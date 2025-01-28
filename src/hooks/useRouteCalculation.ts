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

  const calculateTransitMinutes = (steps: google.maps.DirectionsStep[]): number => {
    return Math.round(
      steps
        .filter(step => step.travel_mode === 'TRANSIT')
        .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
    );
  };

  const calculateWalkingMinutes = (steps: google.maps.DirectionsStep[]): number => {
    return Math.round(
      steps
        .filter(step => step.travel_mode === 'WALKING')
        .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
    );
  };

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
      const directionsService = new google.maps.DirectionsService();
      const origin = new google.maps.LatLng(
        currentLocation.latitude,
        currentLocation.longitude
      );
      const destinationLatLng = new google.maps.LatLng(
        destination.location.lat,
        destination.location.lng
      );

      // Get initial transit route
      const transitResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin,
          destination: destinationLatLng,
          travelMode: google.maps.TravelMode.TRANSIT,
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(status);
          }
        });
      });

      const transitSteps = transitResponse.routes[0].legs[0].steps;
      let enhancedRoute: Route | undefined;

      // Check if first or last step is a walk longer than 400 meters
      const firstStep = transitSteps[0];
      const lastStep = transitSteps[transitSteps.length - 1];
      
      const hasLongInitialWalk = firstStep.travel_mode === 'WALKING' && 
                                firstStep.duration && 
                                firstStep.duration.value > 400;
      
      const hasLongFinalWalk = lastStep.travel_mode === 'WALKING' && 
                              lastStep.duration && 
                              lastStep.duration.value > 400;

      if (transitSteps.length > 1 && (hasLongInitialWalk || hasLongFinalWalk)) {
        // Process initial walking segment
        if (hasLongInitialWalk) {
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
                  travelMode: google.maps.TravelMode.WALKING,
                }, (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
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
                  travelMode: google.maps.TravelMode.BICYCLING,
                }, (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
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
                  travelMode: google.maps.TravelMode.TRANSIT,
                }, (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
                    resolve(result);
                  } else {
                    reject(status);
                  }
                });
              });

              // Calculate durations
              const initialWalkingMinutes = Math.round(
                (walkToStationResponse.routes[0].legs[0].duration?.value || 0) / 60
              );
              const cyclingMinutes = Math.round(
                (cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
              );
              const transitMinutes = calculateTransitMinutes(remainingTransitResponse.routes[0].legs[0].steps);
              const finalWalkingMinutes = calculateWalkingMinutes(remainingTransitResponse.routes[0].legs[0].steps);

              enhancedRoute = {
                duration: initialWalkingMinutes + cyclingMinutes + transitMinutes + finalWalkingMinutes,
                bikeMinutes: cyclingMinutes,
                subwayMinutes: transitMinutes,
                walkingMinutes: initialWalkingMinutes + finalWalkingMinutes,
                startStation,
                endStation,
                directions: {
                  walking: walkToStationResponse.routes[0].legs[0].steps.map(formatDirectionStep),
                  cycling: cyclingResponse.routes[0].legs[0].steps.map(formatDirectionStep),
                  transit: remainingTransitResponse.routes[0].legs[0].steps.map(formatDirectionStep)
                }
              };
            }
          }
        }

        // Process final walking segment if initial wasn't processed
        if (!enhancedRoute && hasLongFinalWalk) {
          const lastTransitStep = transitSteps[transitSteps.length - 2]; // Get the last transit step
          const startStation = await findNearestStationWithBikes(
            lastTransitStep.end_location.lat(),
            lastTransitStep.end_location.lng()
          );

          if (startStation) {
            const endStation = await findNearestStationWithDocks(
              destination.location.lat,
              destination.location.lng
            );

            if (endStation) {
              // Calculate transit route until bike station
              const transitToStationResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
                directionsService.route({
                  origin,
                  destination: new google.maps.LatLng(
                    startStation.information.lat,
                    startStation.information.lon
                  ),
                  travelMode: google.maps.TravelMode.TRANSIT,
                }, (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
                    resolve(result);
                  } else {
                    reject(status);
                  }
                });
              });

              // Calculate cycling route to final destination
              const finalCyclingResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
                directionsService.route({
                  origin: new google.maps.LatLng(
                    startStation.information.lat,
                    startStation.information.lon
                  ),
                  destination: new google.maps.LatLng(
                    endStation.information.lat,
                    endStation.information.lon
                  ),
                  travelMode: google.maps.TravelMode.BICYCLING,
                }, (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
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
                  travelMode: google.maps.TravelMode.WALKING,
                }, (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
                    resolve(result);
                  } else {
                    reject(status);
                  }
                });
              });

              const transitMinutes = calculateTransitMinutes(transitToStationResponse.routes[0].legs[0].steps);
              const initialWalkingMinutes = calculateWalkingMinutes(transitToStationResponse.routes[0].legs[0].steps);
              const cyclingMinutes = Math.round(
                (finalCyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
              );
              const finalWalkingMinutes = Math.round(
                (finalWalkResponse.routes[0].legs[0].duration?.value || 0) / 60
              );

              enhancedRoute = {
                duration: transitMinutes + initialWalkingMinutes + cyclingMinutes + finalWalkingMinutes,
                bikeMinutes: cyclingMinutes,
                subwayMinutes: transitMinutes,
                walkingMinutes: initialWalkingMinutes + finalWalkingMinutes,
                startStation,
                endStation,
                directions: {
                  walking: [...transitToStationResponse.routes[0].legs[0].steps
                    .filter(step => step.travel_mode === 'WALKING')
                    .map(formatDirectionStep),
                    ...finalWalkResponse.routes[0].legs[0].steps.map(formatDirectionStep)],
                  cycling: finalCyclingResponse.routes[0].legs[0].steps.map(formatDirectionStep),
                  transit: transitToStationResponse.routes[0].legs[0].steps
                    .filter(step => step.travel_mode === 'TRANSIT')
                    .map(formatDirectionStep)
                }
              };
            }
          }
        }
      }

      // Create original route (always from user's location)
      const originalRoute: Route = {
        duration: Math.round(
          (transitResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        bikeMinutes: 0,
        subwayMinutes: calculateTransitMinutes(transitSteps),
        walkingMinutes: calculateWalkingMinutes(transitSteps),
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