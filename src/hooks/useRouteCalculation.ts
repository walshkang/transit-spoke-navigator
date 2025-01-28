import { useState } from "react";
import { SearchResult } from "@/types/location";
import { Route, RouteCalculationError } from "@/types/route";
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

  const processInitialWalkingSegment = async (
    origin: google.maps.LatLng,
    firstStep: google.maps.DirectionsStep,
    directionsService: google.maps.DirectionsService
  ) => {
    const startStation = await findNearestStationWithBikes(
      origin.lat(),
      origin.lng()
    );

    if (!startStation) return null;

    const endStation = await findNearestStationWithDocks(
      firstStep.end_location.lat(),
      firstStep.end_location.lng()
    );

    if (!endStation) return null;

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

    return {
      walkToStationResponse,
      cyclingResponse,
      startStation,
      endStation
    };
  };

  const processFinalWalkingSegment = async (
    lastTransitStep: google.maps.DirectionsStep,
    destination: google.maps.LatLng,
    directionsService: google.maps.DirectionsService
  ) => {
    const startStation = await findNearestStationWithBikes(
      lastTransitStep.end_location.lat(),
      lastTransitStep.end_location.lng()
    );

    if (!startStation) return null;

    const endStation = await findNearestStationWithDocks(
      destination.lat(),
      destination.lng()
    );

    if (!endStation) return null;

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

    const finalWalkResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      directionsService.route({
        origin: new google.maps.LatLng(
          endStation.information.lat,
          endStation.information.lon
        ),
        destination,
        travelMode: google.maps.TravelMode.WALKING,
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          reject(status);
        }
      });
    });

    return {
      cyclingResponse,
      finalWalkResponse,
      startStation,
      endStation
    };
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

      // Check for long walking segments
      const firstStep = transitSteps[0];
      const lastStep = transitSteps[transitSteps.length - 1];
      const lastTransitStep = transitSteps[transitSteps.length - 2];
      
      const hasLongInitialWalk = firstStep.travel_mode === 'WALKING' && 
                                firstStep.duration && 
                                firstStep.duration.value > 400;
      
      const hasLongFinalWalk = lastStep.travel_mode === 'WALKING' && 
                              lastStep.duration && 
                              lastStep.duration.value > 400;

      // Process initial walking segment if needed
      const initialSegment = hasLongInitialWalk 
        ? await processInitialWalkingSegment(origin, firstStep, directionsService)
        : null;

      // Process final walking segment if needed
      const finalSegment = hasLongFinalWalk && lastTransitStep
        ? await processFinalWalkingSegment(lastTransitStep, destinationLatLng, directionsService)
        : null;

      // If either segment was processed successfully, create enhanced route
      if (initialSegment || finalSegment) {
        let walkingSteps: google.maps.DirectionsStep[] = [];
        let cyclingSteps: google.maps.DirectionsStep[] = [];
        let transitStepsFiltered: google.maps.DirectionsStep[] = [];
        let totalWalkingMinutes = 0;
        let totalCyclingMinutes = 0;
        let totalTransitMinutes = 0;

        // Add initial segment if it exists
        if (initialSegment) {
          walkingSteps = [...initialSegment.walkToStationResponse.routes[0].legs[0].steps];
          cyclingSteps = [...initialSegment.cyclingResponse.routes[0].legs[0].steps];
          totalWalkingMinutes += calculateWalkingMinutes(walkingSteps);
          totalCyclingMinutes += Math.round(
            (initialSegment.cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
          );
        }

        // Add transit steps
        transitStepsFiltered = transitSteps.filter(step => step.travel_mode === 'TRANSIT');
        totalTransitMinutes = calculateTransitMinutes(transitStepsFiltered);

        // Add final segment if it exists
        if (finalSegment) {
          cyclingSteps = [...cyclingSteps, ...finalSegment.cyclingResponse.routes[0].legs[0].steps];
          walkingSteps = [...walkingSteps, ...finalSegment.finalWalkResponse.routes[0].legs[0].steps];
          totalCyclingMinutes += Math.round(
            (finalSegment.cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
          );
          totalWalkingMinutes += Math.round(
            (finalSegment.finalWalkResponse.routes[0].legs[0].duration?.value || 0) / 60
          );
        }

        enhancedRoute = {
          duration: totalWalkingMinutes + totalCyclingMinutes + totalTransitMinutes,
          bikeMinutes: totalCyclingMinutes,
          subwayMinutes: totalTransitMinutes,
          walkingMinutes: totalWalkingMinutes,
          startStation: initialSegment?.startStation,
          endStation: initialSegment?.endStation,
          lastBikeStartStation: finalSegment?.startStation,
          lastBikeEndStation: finalSegment?.endStation,
          directions: {
            walking: walkingSteps.map(formatDirectionStep),
            cycling: cyclingSteps.map(formatDirectionStep),
            transit: transitStepsFiltered.map(formatDirectionStep)
          }
        };
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