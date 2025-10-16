import { useRef, useState } from "react";
import { SearchResult } from "@/types/location";
import { Route, DirectionStep } from "@/types/route";
import { useToast } from "@/components/ui/use-toast";
import { formatDirectionStep } from "@/utils/routeCalculations";
import { useRouteSegments } from "./useRouteSegments";

type OriginCoords = { lat: number; lng: number };

export const useRouteCalculation = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();
  const { calculateSegment, processInitialSegment, processFinalSegment } = useRouteSegments();

  // Directions cache keyed by OD pair (rounded)
  type RouteKey = `${number},${number}->${number},${number}`;
  const directionsCacheRef = useRef<Map<RouteKey, { ts: number; data: Route[] }>>(new Map());
  const ROUTE_TTL_MS = 15 * 60 * 1000;

  function makeRouteKey(o: OriginCoords, d: { lat: number; lng: number }): RouteKey {
    return `${o.lat.toFixed(5)},${o.lng.toFixed(5)}->${d.lat.toFixed(5)},${d.lng.toFixed(5)}` as RouteKey;
  }

  const orderStepsGeographically = (steps: DirectionStep[]): DirectionStep[] => {
    // For routes with segments, we need to maintain the order they were added
    // Rather than trying to chain by exact coordinates
    // Simply return steps as they are since they're already added in the correct order
    return steps;
  };

  const calculateRoutes = async (destination: SearchResult, originCoords: OriginCoords) => {
    if (!originCoords) {
      toast({
        title: "Missing origin",
        description: "Please select a starting point first",
        variant: "destructive",
      });
      return;
    }

    setIsCalculatingRoute(true);
    setSelectedResult(destination);
    
    try {
      const origin = new google.maps.LatLng(
        originCoords.lat,
        originCoords.lng
      );
      const destinationLatLng = new google.maps.LatLng(
        destination.location.lat,
        destination.location.lng
      );

      // Cache check
      const cacheKey = makeRouteKey(originCoords, destination.location);
      const cached = directionsCacheRef.current.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.ts < ROUTE_TTL_MS) {
        setRoutes(cached.data);
        return;
      }

      // Get initial transit route
      const transitResponse = await calculateSegment(
        origin,
        destinationLatLng,
        google.maps.TravelMode.TRANSIT
      );

      const initialTransitSteps = transitResponse.routes[0].legs[0].steps;
      let enhancedRoute: Route | undefined;

      // Check for long walking segments
      const firstStep = initialTransitSteps[0];
      const lastStep = initialTransitSteps[initialTransitSteps.length - 1];
      
      if (firstStep.duration && firstStep.duration.value > 300) {
        const initialSegment = await processInitialSegment(origin, firstStep);
        const finalSegment = await processFinalSegment(
          formatDirectionStep(initialTransitSteps[initialTransitSteps.length - 2]),
          destinationLatLng
        );

        if (initialSegment && finalSegment) {
          // Collect all steps in the correct sequential order
          const walkingSteps: DirectionStep[] = [];
          const cyclingSteps: DirectionStep[] = [];
          const transitSteps: DirectionStep[] = [];
          const allStepsInOrder: DirectionStep[] = [];

          // Add initial walking to bike station
          initialSegment.walkToStationResponse.routes[0].legs[0].steps.forEach(step => {
            const formattedStep = formatDirectionStep(step);
            walkingSteps.push(formattedStep);
            allStepsInOrder.push(formattedStep);
          });

          // Add initial cycling segment
          initialSegment.cyclingResponse.routes[0].legs[0].steps.forEach(step => {
            const formattedStep = formatDirectionStep(step);
            cyclingSteps.push(formattedStep);
            allStepsInOrder.push(formattedStep);
          });

          // Add transit steps (subway/bus)
          initialTransitSteps
            .filter(step => step.travel_mode === google.maps.TravelMode.TRANSIT)
            .forEach(step => {
              const formattedStep = formatDirectionStep(step);
              transitSteps.push(formattedStep);
              allStepsInOrder.push(formattedStep);
            });

          // Add final walking to bike station
          finalSegment.walkToStationResponse.routes[0].legs[0].steps.forEach(step => {
            const formattedStep = formatDirectionStep(step);
            walkingSteps.push(formattedStep);
            allStepsInOrder.push(formattedStep);
          });

          // Add final cycling segment
          finalSegment.cyclingResponse.routes[0].legs[0].steps.forEach(step => {
            const formattedStep = formatDirectionStep(step);
            cyclingSteps.push(formattedStep);
            allStepsInOrder.push(formattedStep);
          });

          // Add final walking to destination
          finalSegment.finalWalkResponse.routes[0].legs[0].steps.forEach(step => {
            const formattedStep = formatDirectionStep(step);
            walkingSteps.push(formattedStep);
            allStepsInOrder.push(formattedStep);
          });

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
            initialTransitSteps
              .filter(step => step.travel_mode === google.maps.TravelMode.TRANSIT)
              .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
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
            },
            allStepsInOrder
          };
        }
      }

      // Create original route
      const allStepsInOrderOriginal = initialTransitSteps.map(formatDirectionStep);
      
      const originalRoute: Route = {
        duration: Math.round(
          (transitResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        bikeMinutes: 0,
        subwayMinutes: Math.round(
          initialTransitSteps
            .filter(step => step.travel_mode === google.maps.TravelMode.TRANSIT)
            .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
        ),
        walkingMinutes: Math.round(
          initialTransitSteps
            .filter(step => step.travel_mode === google.maps.TravelMode.WALKING)
            .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
        ),
        directions: {
          walking: initialTransitSteps
            .filter(step => step.travel_mode === google.maps.TravelMode.WALKING)
            .map(formatDirectionStep),
          cycling: [],
          transit: initialTransitSteps
            .filter(step => step.travel_mode === google.maps.TravelMode.TRANSIT)
            .map(formatDirectionStep)
        },
        allStepsInOrder: allStepsInOrderOriginal
      };

      const nextRoutes = enhancedRoute ? [originalRoute, enhancedRoute] : [originalRoute];
      setRoutes(nextRoutes);
      // Save to cache
      directionsCacheRef.current.set(cacheKey, { ts: Date.now(), data: nextRoutes });

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