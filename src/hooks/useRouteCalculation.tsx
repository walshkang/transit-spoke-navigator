import { useState } from "react";
import { SearchResult } from "@/types/location";
import { useToast } from "@/components/ui/use-toast";

interface DirectionStep {
  instructions: string;
  distance: string;
  duration: string;
  mode: string;
  transit_details?: {
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
    mode: step.travel_mode,
    transit_details: step.transit ? {
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
      
      const transitRequest = {
        origin: new window.google.maps.LatLng(
          currentLocation.latitude,
          currentLocation.longitude
        ),
        destination: new window.google.maps.LatLng(
          destination.location.lat,
          destination.location.lng
        ),
        travelMode: window.google.maps.TravelMode.TRANSIT,
      };

      const cyclingRequest = {
        origin: new window.google.maps.LatLng(
          currentLocation.latitude,
          currentLocation.longitude
        ),
        destination: new window.google.maps.LatLng(
          destination.location.lat,
          destination.location.lng
        ),
        travelMode: window.google.maps.TravelMode.BICYCLING,
      };

      const [transitResponse, cyclingResponse] = await Promise.all([
        new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(transitRequest, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              console.log('Transit Response:', result);
              resolve(result);
            } else {
              reject(status);
            }
          });
        }),
        new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(cyclingRequest, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              console.log('Cycling Response:', result);
              resolve(result);
            } else {
              reject(status);
            }
          });
        }),
      ]);

      let transitStartLocation: google.maps.LatLng | undefined;
      const transitSteps = transitResponse.routes[0].legs[0].steps;
      const cyclingSteps = cyclingResponse.routes[0].legs[0].steps;

      for (const step of transitSteps) {
        if (step.travel_mode === 'TRANSIT') {
          transitStartLocation = step.start_location;
          break;
        }
      }

      const route: Route = {
        duration: Math.round(
          (transitResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        bikeMinutes: Math.round(
          (cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        subwayMinutes: Math.round(
          (transitResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        transitStartLocation,
        directions: {
          transit: transitSteps.map(formatDirectionStep),
          cycling: cyclingSteps.map(formatDirectionStep)
        }
      };

      console.log('Formatted Route:', route);
      setRoutes([route]);
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
    setRoutes
  };
};