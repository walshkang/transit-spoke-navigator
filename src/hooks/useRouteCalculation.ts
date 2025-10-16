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

      // Get initial transit route (standard, includes buses)
      const transitResponse = await calculateSegment(
        origin,
        destinationLatLng,
        google.maps.TravelMode.TRANSIT
      );

      const initialTransitSteps = transitResponse.routes[0].legs[0].steps;
      let enhancedRoute: Route | undefined;
      let noBusRoute: Route | undefined;
      let noBusBikeRoute: Route | undefined;

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
            allStepsInOrder,
            variant: 'enhanced'
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
        allStepsInOrder: allStepsInOrderOriginal,
        variant: 'standard'
      };

      // Compute No-Bus (Transit-only) route: allow only non-bus transit modes
      try {
        const directionsService = new google.maps.DirectionsService();
        const noBusResponse: google.maps.DirectionsResult = await new Promise((resolve, reject) => {
          directionsService.route({
            origin,
            destination: destinationLatLng,
            travelMode: google.maps.TravelMode.TRANSIT,
            transitOptions: {
              modes: [
                google.maps.TransitMode.SUBWAY,
                google.maps.TransitMode.TRAIN,
                google.maps.TransitMode.TRAM,
                google.maps.TransitMode.RAIL,
              ],
            },
          }, (result, status) => {
            if (status === 'OK' && result) resolve(result); else reject(status);
          });
        });

        const noBusSteps = noBusResponse.routes[0].legs[0].steps;
        const noBusAllSteps = noBusSteps.map(formatDirectionStep);

        noBusRoute = {
          duration: Math.round((noBusResponse.routes[0].legs[0].duration?.value || 0) / 60),
          bikeMinutes: 0,
          subwayMinutes: Math.round(
            noBusSteps
              .filter(step => step.travel_mode === google.maps.TravelMode.TRANSIT)
              .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
          ),
          walkingMinutes: Math.round(
            noBusSteps
              .filter(step => step.travel_mode === google.maps.TravelMode.WALKING)
              .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
          ),
          directions: {
            walking: noBusSteps
              .filter(step => step.travel_mode === google.maps.TravelMode.WALKING)
              .map(formatDirectionStep),
            cycling: [],
            transit: noBusSteps
              .filter(step => step.travel_mode === google.maps.TravelMode.TRANSIT)
              .map(formatDirectionStep)
          },
          allStepsInOrder: noBusAllSteps,
          variant: 'no-bus'
        };

        // Build No-Bus + Bike when long walks exist
        const noBusFirst = noBusSteps[0];
        const noBusLast = noBusSteps[noBusSteps.length - 1];
        if (noBusFirst?.duration && noBusFirst.duration.value > 300) {
          const noBusInitialSeg = await processInitialSegment(origin, noBusFirst);
          const noBusFinalSeg = await processFinalSegment(
            formatDirectionStep(noBusSteps[noBusSteps.length - 2]),
            destinationLatLng
          );

          if (noBusInitialSeg && noBusFinalSeg) {
            const walkingStepsNB: DirectionStep[] = [];
            const cyclingStepsNB: DirectionStep[] = [];
            const transitStepsNB: DirectionStep[] = [];
            const allStepsInOrderNB: DirectionStep[] = [];

            noBusInitialSeg.walkToStationResponse.routes[0].legs[0].steps.forEach(step => {
              const f = formatDirectionStep(step);
              walkingStepsNB.push(f);
              allStepsInOrderNB.push(f);
            });
            noBusInitialSeg.cyclingResponse.routes[0].legs[0].steps.forEach(step => {
              const f = formatDirectionStep(step);
              cyclingStepsNB.push(f);
              allStepsInOrderNB.push(f);
            });
            noBusSteps
              .filter(step => step.travel_mode === google.maps.TravelMode.TRANSIT)
              .forEach(step => {
                const f = formatDirectionStep(step);
                transitStepsNB.push(f);
                allStepsInOrderNB.push(f);
              });
            noBusFinalSeg.walkToStationResponse.routes[0].legs[0].steps.forEach(step => {
              const f = formatDirectionStep(step);
              walkingStepsNB.push(f);
              allStepsInOrderNB.push(f);
            });
            noBusFinalSeg.cyclingResponse.routes[0].legs[0].steps.forEach(step => {
              const f = formatDirectionStep(step);
              cyclingStepsNB.push(f);
              allStepsInOrderNB.push(f);
            });
            noBusFinalSeg.finalWalkResponse.routes[0].legs[0].steps.forEach(step => {
              const f = formatDirectionStep(step);
              walkingStepsNB.push(f);
              allStepsInOrderNB.push(f);
            });

            const walkingDurationNB = Math.round(
              (noBusInitialSeg.walkToStationResponse.routes[0].legs[0].duration?.value || 0) / 60 +
              (noBusFinalSeg.walkToStationResponse.routes[0].legs[0].duration?.value || 0) / 60 +
              (noBusFinalSeg.finalWalkResponse.routes[0].legs[0].duration?.value || 0) / 60
            );
            const cyclingDurationNB = Math.round(
              (noBusInitialSeg.cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60 +
              (noBusFinalSeg.cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
            );
            const transitDurationNB = Math.round(
              noBusSteps
                .filter(step => step.travel_mode === google.maps.TravelMode.TRANSIT)
                .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
            );

            noBusBikeRoute = {
              duration: walkingDurationNB + cyclingDurationNB + transitDurationNB,
              bikeMinutes: cyclingDurationNB,
              subwayMinutes: transitDurationNB,
              walkingMinutes: walkingDurationNB,
              startStation: noBusInitialSeg.startStation,
              endStation: noBusInitialSeg.endStation,
              lastBikeStartStation: noBusFinalSeg.startStation,
              lastBikeEndStation: noBusFinalSeg.endStation,
              directions: {
                walking: walkingStepsNB,
                cycling: cyclingStepsNB,
                transit: transitStepsNB
              },
              allStepsInOrder: allStepsInOrderNB,
              variant: 'no-bus-bike'
            };
          }
        }
      } catch (status) {
        // If no no-bus route (e.g., ZERO_RESULTS), silently skip
      }

      const nextRoutes = [originalRoute]
        .concat(enhancedRoute ? [enhancedRoute] : [])
        .concat(noBusRoute ? [noBusRoute] : [])
        .concat(noBusBikeRoute ? [noBusBikeRoute] : []);
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