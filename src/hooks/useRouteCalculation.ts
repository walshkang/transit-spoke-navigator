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
    // First, create a map of steps by their start locations
    const stepsByStartLocation = new Map<string, DirectionStep>();
    const endLocationToStep = new Map<string, DirectionStep>();
    
    steps.forEach(step => {
      if (!step.start_location || !step.end_location) return;
      
      const startKey = `${step.start_location.lat()},${step.start_location.lng()}`;
      const endKey = `${step.end_location.lat()},${step.end_location.lng()}`;
      
      stepsByStartLocation.set(startKey, step);
      endLocationToStep.set(endKey, step);
    });

    // Find the first step (one that starts at origin)
    const orderedSteps: DirectionStep[] = [];
    let currentStep = steps.find(step => {
      if (!step.start_location || !currentLocation) return false;
      const latDiff = Math.abs(step.start_location.lat() - currentLocation.latitude);
      const lngDiff = Math.abs(step.start_location.lng() - currentLocation.longitude);
      return latDiff < 0.0001 && lngDiff < 0.0001;
    });

    // Build the ordered list by following the path
    while (currentStep && orderedSteps.length < steps.length) {
      orderedSteps.push(currentStep);
      
      if (!currentStep.end_location) break;
      
      const nextKey = `${currentStep.end_location.lat()},${currentStep.end_location.lng()}`;
      currentStep = stepsByStartLocation.get(nextKey);
      
      // Break if we can't find the next step to prevent infinite loops
      if (!currentStep && orderedSteps.length < steps.length) {
        console.error('Could not find next step in sequence');
        break;
      }
    }

    return orderedSteps;
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

          // Separate ordered steps by mode
          const walkingSteps = orderedSteps.filter(step => step.mode === 'walking');
          const cyclingSteps = orderedSteps.filter(step => step.mode === 'bicycling');
          const transitSteps = orderedSteps.filter(step => step.mode === 'transit');

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
              .reduce((total, step) => {
                const duration = parseInt(step.duration?.split(' ')[0] || '0');
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
              walking: walkingSteps,
              cycling: cyclingSteps,
              transit: transitSteps
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