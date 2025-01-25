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
          // Enhanced route with walking + cycling + transit
          const walkingSteps = route.directions.walking;
          const cyclingSteps = route.directions.cycling;
          const transitSteps = route.directions.transit;

          if (walkingSteps.length > 0 && cyclingSteps.length > 0 && transitSteps.length > 0) {
            const walkingStart = walkingSteps[0].start_location;
            const walkingEnd = walkingSteps[walkingSteps.length - 1].end_location;
            const cyclingStart = cyclingSteps[0].start_location;
            const cyclingEnd = route.transitStartLocation;
            const transitEnd = transitSteps[transitSteps.length - 1].end_location;

            if (walkingStart && walkingEnd && cyclingStart && cyclingEnd && transitEnd) {
              // First render walking route
              const walkingResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
                directionsService.route({
                  origin: walkingStart,
                  destination: walkingEnd,
                  travelMode: google.maps.TravelMode.WALKING,
                }, (result, status) => {
                  if (status === 'OK' && result) {
                    resolve(result);
                  } else {
                    reject(status);
                  }
                });
              });

              // Then render cycling route
              const cyclingResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
                directionsService.route({
                  origin: cyclingStart,
                  destination: cyclingEnd,
                  travelMode: google.maps.TravelMode.BICYCLING,
                }, (result, status) => {
                  if (status === 'OK' && result) {
                    resolve(result);
                  } else {
                    reject(status);
                  }
                });
              });

              // Finally render transit route
              const transitResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
                directionsService.route({
                  origin: cyclingEnd,
                  destination: transitEnd,
                  travelMode: google.maps.TravelMode.TRANSIT,
                }, (result, status) => {
                  if (status === 'OK' && result) {
                    resolve(result);
                  } else {
                    reject(status);
                  }
                });
              });

              // Create bounds that include all points
              const bounds = new google.maps.LatLngBounds();
              
              // Add all route points to bounds
              [walkingResult, cyclingResult, transitResult].forEach(result => {
                result.routes[0].legs[0].steps.forEach(step => {
                  bounds.extend(step.start_location);
                  bounds.extend(step.end_location);
                });
              });

              // Clear any existing renderers
              if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(null);
              }

              // Render walking route in gray
              const walkingRenderer = new google.maps.DirectionsRenderer({
                map: mapInstanceRef.current,
                directions: walkingResult,
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: "#757575", // Gray for walking
                  strokeWeight: 5
                }
              });

              // Render cycling route in green
              const cyclingRenderer = new google.maps.DirectionsRenderer({
                map: mapInstanceRef.current,
                directions: cyclingResult,
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: "#4CAF50", // Green for cycling
                  strokeWeight: 5
                }
              });

              // Render transit route in blue
              const transitRenderer = new google.maps.DirectionsRenderer({
                map: mapInstanceRef.current,
                directions: transitResult,
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: "#2196F3", // Blue for transit
                  strokeWeight: 5
                }
              });

              // Add markers for start, transition points, and end
              new google.maps.Marker({
                position: walkingStart,
                map: mapInstanceRef.current,
                title: "Start",
                label: "A"
              });

              new google.maps.Marker({
                position: cyclingStart,
                map: mapInstanceRef.current,
                title: "Bike Start",
                label: "B"
              });

              new google.maps.Marker({
                position: cyclingEnd,
                map: mapInstanceRef.current,
                title: "Transit Start",
                label: "C"
              });

              new google.maps.Marker({
                position: transitEnd,
                map: mapInstanceRef.current,
                title: "End",
                label: "D"
              });

              mapInstanceRef.current.fitBounds(bounds);
            }
          }
        } else {
          // Regular transit route
          const transitSteps = route.directions.transit;
          if (transitSteps.length > 0) {
            const origin = transitSteps[0].start_location;
            const destination = transitSteps[transitSteps.length - 1].end_location;

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

              // Clear any existing renderers
              if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(null);
              }

              // Create a new renderer for the transit route
              const transitRenderer = new google.maps.DirectionsRenderer({
                map: mapInstanceRef.current,
                directions: result,
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: "#2196F3", // Blue for transit
                  strokeWeight: 5
                }
              });

              const bounds = new google.maps.LatLngBounds();
              result.routes[0].legs[0].steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
              mapInstanceRef.current.fitBounds(bounds);
            }
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