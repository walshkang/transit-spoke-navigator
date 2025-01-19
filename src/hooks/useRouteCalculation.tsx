import { useState } from "react";
import { SearchResult } from "@/types/location";
import { useToast } from "@/components/ui/use-toast";

interface DirectionStep {
  instructions: string;
  distance: string;
  duration: string;
  mode: string;
  start_location?: google.maps.LatLng;
  end_location?: google.maps.LatLng;
  transit?: {
    departure_stop?: { name: string };
    arrival_stop?: { name: string };
    line?: { name: string; short_name: string };
  };
}

interface Route {
  duration: number;
  bikeMinutes: number;
  subwayMinutes: number;
  transitStartLocation?: google.maps.LatLng;
  directions: {
    transit: DirectionStep[];
    cycling: DirectionStep[];
  };
}

export const useRouteCalculation = (currentLocation: GeolocationCoordinates | null) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();

  const formatDirectionStep = (step: google.maps.DirectionsStep): DirectionStep => ({
    instructions: step.instructions,
    distance: step.distance?.text || '',
    duration: step.duration?.text || '',
    mode: step.travel_mode.toLowerCase(),
    start_location: step.start_location,
    end_location: step.end_location,
    transit: step.transit ? {
      departure_stop: { name: step.transit.departure_stop?.name || '' },
      arrival_stop: { name: step.transit.arrival_stop?.name || '' },
      line: {
        name: step.transit.line?.name || '',
        short_name: step.transit.line?.short_name || ''
      }
    } : undefined
  });

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

      // Get initial transit route from user's location
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
      let transitStartLocation: google.maps.LatLng | undefined;
      let enhancedRoute: Route | undefined;

      // Check if first step is a walk longer than 5 minutes
      const firstStep = transitSteps[0];
      if (
        transitSteps.length > 1 && 
        firstStep.travel_mode === 'WALKING' && 
        firstStep.duration && 
        firstStep.duration.value > 300
      ) {
        // Find the first transit step to get departure location
        const transitStep = transitSteps.find(step => step.travel_mode === 'TRANSIT');
        if (transitStep?.transit?.departure_stop?.location) {
          transitStartLocation = transitStep.transit.departure_stop.location;

          // Calculate cycling route to transit start
          const cyclingResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            directionsService.route({
              origin,
              destination: transitStartLocation,
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
              origin: transitStartLocation,
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

          // Construct enhanced route
          enhancedRoute = {
            duration: Math.round(
              (cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60 +
              (remainingTransitResponse.routes[0].legs[0].duration?.value || 0) / 60
            ),
            bikeMinutes: Math.round(
              (cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
            ),
            subwayMinutes: Math.round(
              (remainingTransitResponse.routes[0].legs[0].duration?.value || 0) / 60
            ),
            transitStartLocation,
            directions: {
              transit: remainingTransitResponse.routes[0].legs[0].steps.map(formatDirectionStep),
              cycling: cyclingResponse.routes[0].legs[0].steps.map(formatDirectionStep)
            }
          };
        }
      }

      // Create original route (always from user's location)
      const originalRoute: Route = {
        duration: Math.round(
          (transitResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        bikeMinutes: 0,
        subwayMinutes: Math.round(
          (transitResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        directions: {
          transit: transitSteps.map(formatDirectionStep),
          cycling: []
        }
      };

      // Set routes (either both enhanced and original, or just original)
      if (enhancedRoute) {
        setRoutes([originalRoute, enhancedRoute]);
      } else {
        setRoutes([originalRoute]);
      }

      setIsCalculatingRoute(false);
    } catch (error) {
      console.error("Route calculation error:", error);
      toast({
        title: "Error",
        description: "Failed to calculate routes",
        variant: "destructive",
      });
      setIsCalculatingRoute(false);
    }
  };

  return {
    routes,
    isCalculatingRoute,
    selectedResult,
    calculateRoutes,
    setSelectedResult,
    setRoutes,
    results: routes,
    isLoading: isCalculatingRoute
  };
};