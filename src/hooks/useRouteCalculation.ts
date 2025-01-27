import { useState } from "react";
import { SearchResult } from "@/types/location";
import { Route, RouteCalculationError, DirectionStep } from "@/types/route";
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

      // Check first walking segment optimization (existing logic)
      const firstStep = transitSteps[0];
      if (
        transitSteps.length > 1 && 
        firstStep.travel_mode === 'WALKING' && 
        firstStep.duration && 
        firstStep.duration.value > 300 &&
        firstStep.end_location
      ) {
        const startStation = await findNearestStationWithBikes(
          currentLocation.latitude,
          currentLocation.longitude
        );

        if (startStation) {
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
            const initialWalkingMinutes = Math.round(
              walkToStationResponse.routes[0].legs[0].duration?.value || 0) / 60;
            const cyclingMinutes = Math.round(
              cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60;
            
            // Calculate walking minutes from remaining transit steps
            const remainingWalkingMinutes = Math.round(
              remainingTransitResponse.routes[0].legs[0].steps
                .filter(step => step.travel_mode === 'WALKING')
                .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
            );

            const transitMinutes = Math.round(
              remainingTransitResponse.routes[0].legs[0].steps
                .filter(step => step.travel_mode === 'TRANSIT')
                .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
            );

            // Round all minutes to nearest integer
            enhancedRoute = {
              duration: Math.round(initialWalkingMinutes + cyclingMinutes + transitMinutes + remainingWalkingMinutes),
              bikeMinutes: Math.round(cyclingMinutes),
              subwayMinutes: Math.round(transitMinutes),
              walkingMinutes: Math.round(initialWalkingMinutes + remainingWalkingMinutes),
              startStation,
              endStation,
              transitStartLocation: new google.maps.LatLng(
                endStation.information.lat,
                endStation.information.lon
              ),
              directions: {
                walking: walkToStationResponse.routes[0].legs[0].steps.map(step => formatDirectionStep(step)),
                cycling: cyclingResponse.routes[0].legs[0].steps.map(step => formatDirectionStep(step)),
                transit: remainingTransitResponse.routes[0].legs[0].steps.map(step => formatDirectionStep(step))
              }
            };
          }
        }
      }

      // Check last walking segment optimization
      const lastStep = transitSteps[transitSteps.length - 1];
      if (
        lastStep.travel_mode === 'WALKING' &&
        lastStep.duration &&
        lastStep.duration.value > 300 &&
        lastStep.start_location
      ) {
        const startStation = await findNearestStationWithBikes(
          lastStep.start_location.lat(),
          lastStep.start_location.lng()
        );

        if (startStation) {
          const endStation = await findNearestStationWithDocks(
            destinationLatLng.lat(),
            destinationLatLng.lng()
          );

          if (endStation) {
            // Calculate walking route to start station
            const walkToStationResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route({
                origin: lastStep.start_location,
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

            // Calculate final walking segment
            const finalWalkResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route({
                origin: new google.maps.LatLng(
                  endStation.information.lat,
                  endStation.information.lon
                ),
                destination: destinationLatLng,
                travelMode: window.google.maps.TravelMode.WALKING,
              }, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(status);
                }
              });
            });

            // Update the transit steps array
            const updatedTransitSteps = transitSteps.slice(0, -1); // Remove the last walking step
            updatedTransitSteps.push(...walkToStationResponse.routes[0].legs[0].steps);
            updatedTransitSteps.push(...cyclingResponse.routes[0].legs[0].steps);
            updatedTransitSteps.push(...finalWalkResponse.routes[0].legs[0].steps);

            // Calculate updated durations
            const lastWalkingMinutes = Math.round(
              (walkToStationResponse.routes[0].legs[0].duration?.value || 0) / 60 +
              (finalWalkResponse.routes[0].legs[0].duration?.value || 0) / 60
            );
            const lastCyclingMinutes = Math.round(
              (cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
            );

            enhancedRoute = {
              ...enhancedRoute,
              duration: Math.round(
                (transitResponse.routes[0].legs[0].duration?.value || 0) / 60 +
                lastWalkingMinutes + lastCyclingMinutes
              ),
              bikeMinutes: (enhancedRoute?.bikeMinutes || 0) + lastCyclingMinutes,
              walkingMinutes: (enhancedRoute?.walkingMinutes || 0) + lastWalkingMinutes,
              lastBikeStartStation: startStation,
              lastBikeEndStation: endStation,
              directions: {
                walking: [...(enhancedRoute?.directions.walking || [])],
                cycling: [...(enhancedRoute?.directions.cycling || []), ...cyclingResponse.routes[0].legs[0].steps.map(step => formatDirectionStep(step))],
                transit: updatedTransitSteps.map(step => formatDirectionStep(step))
              }
            };
          }
        }
      }

      // Create original route (always from user's location)
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
          transit: transitSteps.map(formatDirectionStep)
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
