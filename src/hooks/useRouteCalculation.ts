import { useState } from "react";
import { SearchResult } from "@/types/location";
import { Route } from "@/types/route";
import { useToast } from "@/components/ui/use-toast";
import { formatDirectionStep } from "@/utils/routeCalculations";
import { useRouteSegments } from "./useRouteSegments";

export const useRouteCalculation = (currentLocation: GeolocationCoordinates | null) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();
  const { calculateSegment, processInitialSegment, processFinalSegment } = useRouteSegments();

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
      const origin = new google.maps.LatLng(
        currentLocation.latitude,
        currentLocation.longitude
      );
      const destinationLatLng = new google.maps.LatLng(
        destination.location.lat,
        destination.location.lng
      );

      // Get initial transit route
      const transitResponse = await calculateSegment(
        origin,
        destinationLatLng,
        google.maps.TravelMode.TRANSIT
      );

      const transitSteps = transitResponse.routes[0].legs[0].steps;
      let enhancedRoute: Route | undefined;

      // Check for long walking segments
      const firstStep = transitSteps[0];
      const lastStep = transitSteps[transitSteps.length - 1];
      
      if (firstStep.duration && firstStep.duration.value > 300) {
        const initialSegment = await processInitialSegment(origin, firstStep);
        const finalSegment = await processFinalSegment(
          formatDirectionStep(transitSteps[transitSteps.length - 2]),
          destinationLatLng
        );

        if (initialSegment && finalSegment) {
          const walkingSteps = [
            ...initialSegment.walkToStationResponse.routes[0].legs[0].steps,
            ...finalSegment.walkToStationResponse.routes[0].legs[0].steps,
            ...finalSegment.finalWalkResponse.routes[0].legs[0].steps
          ];

          const cyclingSteps = [
            ...initialSegment.cyclingResponse.routes[0].legs[0].steps,
            ...finalSegment.cyclingResponse.routes[0].legs[0].steps
          ];

          const transitStepsFiltered = transitSteps
            .filter(step => step.travel_mode === 'TRANSIT')
            .map(formatDirectionStep);

          enhancedRoute = {
            duration: Math.round(
              (initialSegment.walkToStationResponse.routes[0].legs[0].duration?.value || 0) / 60 +
              (initialSegment.cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60 +
              transitStepsFiltered.reduce((total, step) => {
                const duration = parseInt(step.duration.split(' ')[0]);
                return total + (isNaN(duration) ? 0 : duration);
              }, 0) +
              (finalSegment.walkToStationResponse.routes[0].legs[0].duration?.value || 0) / 60 +
              (finalSegment.cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60 +
              (finalSegment.finalWalkResponse.routes[0].legs[0].duration?.value || 0) / 60
            ),
            bikeMinutes: Math.round(
              ((initialSegment.cyclingResponse.routes[0].legs[0].duration?.value || 0) +
               (finalSegment.cyclingResponse.routes[0].legs[0].duration?.value || 0)) / 60
            ),
            subwayMinutes: Math.round(
              transitStepsFiltered.reduce((total, step) => {
                const duration = parseInt(step.duration.split(' ')[0]);
                return total + (isNaN(duration) ? 0 : duration);
              }, 0)
            ),
            walkingMinutes: Math.round(
              ((initialSegment.walkToStationResponse.routes[0].legs[0].duration?.value || 0) +
               (finalSegment.walkToStationResponse.routes[0].legs[0].duration?.value || 0) +
               (finalSegment.finalWalkResponse.routes[0].legs[0].duration?.value || 0)) / 60
            ),
            startStation: initialSegment.startStation,
            endStation: initialSegment.endStation,
            lastBikeStartStation: finalSegment.startStation,
            lastBikeEndStation: finalSegment.endStation,
            directions: {
              walking: walkingSteps.map(formatDirectionStep),
              cycling: cyclingSteps.map(formatDirectionStep),
              transit: transitStepsFiltered
            }
          };
        }
      }

      // Create original route
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

      setRoutes(enhancedRoute ? [originalRoute, enhancedRoute] : [originalRoute]);

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