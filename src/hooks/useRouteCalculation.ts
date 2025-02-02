import { useState } from "react";
import { SearchResult } from "@/types/location";
import { Route, DirectionStep } from "@/types/route";
import { useToast } from "@/components/ui/use-toast";
import { formatDirectionStep } from "@/utils/routeCalculations";
import { useRouteSegments } from "./useRouteSegments";

export const useRouteCalculation = (currentLocation: GeolocationCoordinates | null) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();
  const { calculateSegment, processInitialSegment, processFinalSegment } = useRouteSegments();

  const orderStepsGeographically = (steps: DirectionStep[]): DirectionStep[] => {
    return steps.sort((a, b) => {
      if (!a.start_location || !b.start_location) return 0;
      // Sort based on latitude (north to south)
      const latDiff = b.start_location.lat() - a.start_location.lat();
      if (Math.abs(latDiff) > 0.0001) return latDiff;
      // If latitudes are very close, sort based on longitude (west to east)
      return b.start_location.lng() - a.start_location.lng();
    });
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
          // Collect all steps with their coordinates
          const allSteps = [
            ...initialSegment.walkToStationResponse.routes[0].legs[0].steps.map(formatDirectionStep),
            ...initialSegment.cyclingResponse.routes[0].legs[0].steps.map(formatDirectionStep),
            ...transitSteps.filter(step => step.travel_mode === 'TRANSIT').map(formatDirectionStep),
            ...finalSegment.walkToStationResponse.routes[0].legs[0].steps.map(formatDirectionStep),
            ...finalSegment.cyclingResponse.routes[0].legs[0].steps.map(formatDirectionStep),
            ...finalSegment.finalWalkResponse.routes[0].legs[0].steps.map(formatDirectionStep)
          ];

          // Order steps geographically
          const orderedSteps = orderStepsGeographically(allSteps);

          // Calculate durations
          const walkingDuration = Math.round(
            (initialSegment.walkToStationResponse.routes[0].legs[0].duration?.value || 0) / 60 +
            (finalSegment.walkToStationResponse.routes[0].legs[0].duration?.value || 0) / 60 +
            (finalSegment.finalWalkResponse.routes[0].legs[0].duration?.value || 0) / 60
          );

          const cyclingDuration = Math.round(
            (initialSegment.cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60 +
            (finalSegment.cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
          );

          const transitDuration = Math.round(
            transitSteps
              .filter(step => step.travel_mode === 'TRANSIT')
              .reduce((total, step) => {
                const duration = parseInt(step.duration?.text?.split(' ')[0] || '0');
                return total + (isNaN(duration) ? 0 : duration);
              }, 0)
          );

          enhancedRoute = {
            duration: walkingDuration + cyclingDuration + transitDuration,
            bikeMinutes: cyclingDuration,
            subwayMinutes: transitDuration,
            walkingMinutes: walkingDuration,
            startStation: initialSegment.startStation,
            endStation: initialSegment.endStation,
            lastBikeStartStation: finalSegment.startStation,
            lastBikeEndStation: finalSegment.endStation,
            directions: {
              walking: orderedSteps.filter(step => step.mode === 'walking'),
              cycling: orderedSteps.filter(step => step.mode === 'bicycling'),
              transit: orderedSteps.filter(step => step.mode === 'transit')
            }
          };
        }
      }

      // Create original route with geographically ordered steps
      const originalSteps = transitSteps.map(formatDirectionStep);
      const orderedOriginalSteps = orderStepsGeographically(originalSteps);

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
          walking: orderedOriginalSteps.filter(step => step.mode === 'walking'),
          cycling: [],
          transit: orderedOriginalSteps.filter(step => step.mode === 'transit')
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