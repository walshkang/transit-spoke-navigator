import { useEffect, useRef } from "react";
import { Route } from "@/types/route";

interface RouteMapProps {
  isVisible: boolean;
  onMapLoad: (map: google.maps.Map) => void;
  route: Route;
}

const RouteMap = ({ isVisible, onMapLoad, route }: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!isVisible || !mapRef.current) return;

    // Only create a new map if one doesn't exist
    if (!mapInstanceRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 40.7128, lng: -74.0060 }, // NYC default center
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;
      onMapLoad(map);
    }

    // Initialize DirectionsRenderer if not already done
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
        preserveViewport: false,
      });
    }

    // Function to render route on map
    const renderRoute = async () => {
      if (!mapInstanceRef.current || !directionsRendererRef.current) return;

      const directionsService = new google.maps.DirectionsService();

      try {
        if (route.bikeMinutes > 0 && route.transitStartLocation) {
          // Enhanced route with cycling + transit
          const cyclingSteps = route.directions.cycling;
          const transitSteps = route.directions.transit;

          if (cyclingSteps[0]?.start_location && transitSteps[transitSteps.length - 1]?.end_location) {
            const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route({
                origin: cyclingSteps[0].start_location,
                destination: transitSteps[transitSteps.length - 1].end_location,
                waypoints: [{
                  location: route.transitStartLocation,
                  stopover: true
                }],
                travelMode: google.maps.TravelMode.BICYCLING,
              }, (result, status) => {
                if (status === 'OK' && result) {
                  resolve(result);
                } else {
                  reject(status);
                }
              });
            });

            directionsRendererRef.current.setDirections(result);
            const bounds = new google.maps.LatLngBounds();
            result.routes[0].legs.forEach(leg => {
              leg.steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
            });
            mapInstanceRef.current.fitBounds(bounds);
          }
        } else {
          // Regular transit route
          const transitSteps = route.directions.transit;
          const origin = transitSteps[0]?.start_location;
          const destination = transitSteps[transitSteps.length - 1]?.end_location;

          if (origin && destination) {
            const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route({
                origin,
                destination,
                travelMode: google.maps.TravelMode.TRANSIT,
              }, (result, status) => {
                if (status === 'OK' && result) {
                  resolve(result);
                } else {
                  reject(status);
                }
              });
            });

            directionsRendererRef.current.setDirections(result);
            const bounds = new google.maps.LatLngBounds();
            result.routes[0].legs[0].steps.forEach(step => {
              bounds.extend(step.start_location);
              bounds.extend(step.end_location);
            });
            mapInstanceRef.current.fitBounds(bounds);
          }
        }
      } catch (error) {
        console.error('Error rendering route:', error);
      }
    };

    renderRoute();

    return () => {
      // Clean up map instance when component unmounts
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [isVisible, onMapLoad, route]);

  return (
    <div 
      ref={mapRef}
      style={{ height: '400px', width: '100%' }}
      className="bg-gray-100 rounded-md mb-4"
    />
  );
};

export default RouteMap;