import { useState } from "react";
import { SearchResult } from "@/types/location";
import { Route } from "@/types/route";
import { useToast } from "@/components/ui/use-toast";
import { findNearestStationWithBikes, findNearestStationWithDocks } from "@/utils/gbfsUtils";
import { formatDirectionStep } from "@/utils/routeCalculations";

export const useRouteCalculation = (currentLocation: GeolocationCoordinates | null) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();

  const calculateRoutes = async (destination: SearchResult) => {
    if (!currentLocation) {
      toast({
        title: "Error",
        description: "Current location is not available",
        variant: "destructive",
      });
      return;
    }

    setIsCalculatingRoute(true);
    setSelectedResult(destination);
    
    try {
      const directionsService = new window.google.maps.DirectionsService();
      const origin = new window.google.maps.LatLng(
        currentLocation.latitude,
        currentLocation.longitude
      );
      const destinationLatLng = new window.google.maps.LatLng(
        destination.location.lat,
        destination.location.lng
      );

      // Get initial transit route
      const transitResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin,
          destination: destinationLatLng,
          travelMode: window.google.maps.TravelMode.TRANSIT,
        }, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(status);
          }
        });
      });

      const transitSteps = transitResponse.routes[0].legs[0].steps;
      let enhancedRoute: Route | undefined;

      // Check if first step is a walk longer than 5 minutes
      const firstStep = transitSteps[0];
      if (
        transitSteps.length > 1 && 
        firstStep.travel_mode === 'WALKING' && 
        firstStep.duration && 
        firstStep.duration.value > 300 &&
        firstStep.end_location
      ) {
        // Find nearest bike station to user
        const startStation = await findNearestStationWithBikes(
          currentLocation.latitude,
          currentLocation.longitude
        );

        if (startStation) {
          // Find nearest dock station to first transit stop
          const endStation = await findNearestStationWithDocks(
            firstStep.end_location.lat(),
            firstStep.end_location.lng()
          );

          if (endStation) {
            // Calculate walking route to start station
            const walkToStationResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route({
                origin,
                destination: new google.maps.LatLng(
                  startStation.information.lat,
                  startStation.information.lon
                ),
                travelMode: window.google.maps.TravelMode.WALKING,
              }, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(status);
                }
              });
            });

            // Calculate cycling route between stations
            const cyclingResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route({
                origin: new google.maps.LatLng(
                  startStation.information.lat,
                  startStation.information.lon
                ),
                destination: new google.maps.LatLng(
                  endStation.information.lat,
                  endStation.information.lon
                ),
                travelMode: window.google.maps.TravelMode.BICYCLING,
              }, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(status);
                }
              });
            });

            // Calculate remaining transit journey
            const remainingTransitResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route({
                origin: new google.maps.LatLng(
                  endStation.information.lat,
                  endStation.information.lon
                ),
                destination: destinationLatLng,
                travelMode: window.google.maps.TravelMode.TRANSIT,
              }, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(status);
                }
              });
            });

            // Calculate durations correctly for each segment
            const walkingMinutes = Math.round(
              walkToStationResponse.routes[0].legs[0].duration?.value || 0) / 60;
            const cyclingMinutes = Math.round(
              cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60;
            const transitMinutes = Math.round(
              remainingTransitResponse.routes[0].legs[0].duration?.value || 0) / 60;

            // Format steps with station info only where needed
            const walkingSteps = walkToStationResponse.routes[0].legs[0].steps.map((step, index) => 
              formatDirectionStep(step, index === 0 ? { bikes: startStation.status.num_bikes_available } : undefined)
            );
            
            const cyclingSteps = cyclingResponse.routes[0].legs[0].steps.map((step, index, array) => 
              formatDirectionStep(step, index === array.length - 1 ? { docks: endStation.status.num_docks_available } : undefined)
            );

            // Construct enhanced route
            enhancedRoute = {
              duration: walkingMinutes + cyclingMinutes + transitMinutes,
              bikeMinutes: cyclingMinutes,
              subwayMinutes: transitMinutes,
              walkingMinutes,
              startStation,
              endStation,
              transitStartLocation: new google.maps.LatLng(
                endStation.information.lat,
                endStation.information.lon
              ),
              directions: {
                walking: walkingSteps,
                cycling: cyclingSteps,
                transit: remainingTransitResponse.routes[0].legs[0].steps.map(step => formatDirectionStep(step))
              }
            };
          }
        }
      }

      // Create original route with all Google-provided steps
      const originalRoute: Route = {
        duration: Math.round(
          (transitResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        bikeMinutes: 0,
        subwayMinutes: Math.round(
          transitSteps
            .filter(step => step.travel_mode === 'TRANSIT')
            .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
        ),
        walkingMinutes: Math.round(
          transitSteps
            .filter(step => step.travel_mode === 'WALKING')
            .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
        ),
        directions: {
          walking: [],
          cycling: [],
          transit: transitSteps.map(step => formatDirectionStep(step))
        }
      };

      // Set routes (either both enhanced and original, or just original)
      if (enhancedRoute) {
        setRoutes([originalRoute, enhancedRoute]);
      } else {
        setRoutes([originalRoute]);
      }

    } catch (error) {
      console.error("Route calculation error:", error);
      toast({
        title: "Error",
        description: "Failed to calculate routes",
        variant: "destructive",
      });
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  return {
    routes,
    isCalculatingRoute,
    selectedResult,
    calculateRoutes,
    setSelectedResult,
    setRoutes
  };
};