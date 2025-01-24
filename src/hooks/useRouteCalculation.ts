import { useToast } from "@/components/ui/use-toast";
import { SearchResult } from "@/types/location";
import { Route } from "@/types/route";
import { useDirectionsService } from "./useDirectionsService";
import { useRouteState } from "./useRouteState";
import { formatDirectionStep, calculateMinutes } from "@/utils/routeCalculations";
import { fetchStationData, findNearestStation } from "@/utils/gbfs";
import { StationData } from "@/types/gbfs";

export const useRouteCalculation = (currentLocation: GeolocationCoordinates | null) => {
  const { toast } = useToast();
  const { getDirections } = useDirectionsService();
  const {
    routes,
    setRoutes,
    isCalculatingRoute,
    setIsCalculatingRoute,
    selectedResult,
    setSelectedResult
  } = useRouteState();

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
      // Fetch Citibike station data
      const stations = await fetchStationData();
      
      const origin = new google.maps.LatLng(
        currentLocation.latitude,
        currentLocation.longitude
      );

      // Get initial transit route
      const { result: transitResponse } = await getDirections(
        origin,
        destination,
        google.maps.TravelMode.TRANSIT
      );

      const transitSteps = transitResponse.routes[0].legs[0].steps;
      let transitStartLocation: google.maps.LatLng | undefined;
      let enhancedRoute: Route | undefined;

      // Check for long initial walking segment
      const firstStep = transitSteps[0];
      if (
        transitSteps.length > 1 && 
        firstStep.travel_mode === 'WALKING' && 
        firstStep.duration && 
        firstStep.duration.value > 300
      ) {
        const transitStep = transitSteps.find(step => step.travel_mode === 'TRANSIT');
        if (transitStep?.transit?.departure_stop?.location) {
          transitStartLocation = transitStep.transit.departure_stop.location;

          // Find nearest stations
          const startStation = findNearestStation(
            stations,
            currentLocation.latitude,
            currentLocation.longitude,
            true, // require bikes
            1
          );

          const endStation = findNearestStation(
            stations,
            transitStartLocation.lat(),
            transitStartLocation.lng(),
            false, // don't require bikes, need docks
            0
          );

          if (startStation && endStation) {
            // Get cycling route between stations
            const { result: cyclingResponse } = await getDirections(
              new google.maps.LatLng(startStation.information.lat, startStation.information.lon),
              new google.maps.LatLng(endStation.information.lat, endStation.information.lon),
              google.maps.TravelMode.BICYCLING
            );

            // Get remaining transit journey
            const { result: remainingTransitResponse } = await getDirections(
              transitStartLocation,
              destination,
              google.maps.TravelMode.TRANSIT
            );

            const remainingTransitSteps = remainingTransitResponse.routes[0].legs[0].steps;
            
            enhancedRoute = {
              duration: Math.round(
                (cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60 +
                (remainingTransitResponse.routes[0].legs[0].duration?.value || 0) / 60
              ),
              bikeMinutes: Math.round(
                (cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
              ),
              subwayMinutes: calculateMinutes(remainingTransitSteps, google.maps.TravelMode.TRANSIT),
              walkingMinutes: calculateMinutes(remainingTransitSteps, google.maps.TravelMode.WALKING),
              transitStartLocation,
              directions: {
                transit: remainingTransitSteps.map(formatDirectionStep),
                cycling: cyclingResponse.routes[0].legs[0].steps.map(formatDirectionStep)
              }
            };

            // Add toast notification about available bikes
            toast({
              title: "Citibike Station Found",
              description: `Found station "${startStation.information.name}" with ${startStation.status.num_bikes_available} bikes available`,
            });
          }
        }
      }

      // Create original route
      const originalRoute: Route = {
        duration: Math.round(
          (transitResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        bikeMinutes: 0,
        subwayMinutes: calculateMinutes(transitSteps, google.maps.TravelMode.TRANSIT),
        walkingMinutes: calculateMinutes(transitSteps, google.maps.TravelMode.WALKING),
        directions: {
          transit: transitSteps.map(formatDirectionStep),
          cycling: []
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
    setRoutes,
    results: routes,
    isLoading: isCalculatingRoute
  };
};