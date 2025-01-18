import { useState } from "react";
import { SearchResult } from "@/types/location";
import { useToast } from "@/components/ui/use-toast";

interface Route {
  duration: number;
  bikeMinutes: number;
  subwayMinutes: number;
}

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
              resolve(result);
            } else {
              reject(status);
            }
          });
        }),
        new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(cyclingRequest, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              resolve(result);
            } else {
              reject(status);
            }
          });
        }),
      ]);

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
      };

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