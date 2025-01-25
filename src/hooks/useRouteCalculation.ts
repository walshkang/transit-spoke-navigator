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
            // Get walking route to start station
            const { result: walkingResponse } = await getDirections(
              origin,
              new google.maps.LatLng(startStation.information.lat, startStation.information.lon),
              google.maps.TravelMode.WALKING
            );

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
                (walkingResponse.routes[0].legs[0].duration?.value || 0) / 60 +
                (cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60 +
                (remainingTransitResponse.routes[0].legs[0].duration?.value || 0) / 60
              ),
              bikeMinutes: Math.round(
                (cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
              ),
              subwayMinutes: calculateMinutes(remainingTransitSteps, google.maps.TravelMode.TRANSIT),
              walkingMinutes: calculateMinutes(walkingResponse.routes[0].legs[0].steps, google.maps.TravelMode.WALKING),
              transitStartLocation,
              startStation,
              endStation,
              directions: {
                walking: walkingResponse.routes[0].legs[0].steps.map(step => 
                  formatDirectionStep(step, { bikes: startStation.status.num_bikes_available })
                ),
                cycling: cyclingResponse.routes[0].legs[0].steps.map(step => 
                  formatDirectionStep(step, { 
                    bikes: startStation.status.num_bikes_available,
                    docks: endStation.status.num_docks_available 
                  })
                ),
                transit: remainingTransitSteps.map(formatDirectionStep)
              }
            };
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
          walking: transitSteps.filter(step => step.travel_mode === 'WALKING').map(formatDirectionStep),
          cycling: [],
          transit: transitSteps.filter(step => step.travel_mode === 'TRANSIT').map(formatDirectionStep)
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
