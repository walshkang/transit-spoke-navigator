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
        suppressMarkers: true,
        preserveViewport: false,
      });
    }

    // Function to render route on map
    const renderRoute = async () => {
      if (!mapInstanceRef.current) return;

      const directionsService = new google.maps.DirectionsService();
      const bounds = new google.maps.LatLngBounds();

      try {
        if (route.bikeMinutes > 0) {
          // Enhanced route with walking + cycling + transit
          const walkingSteps = route.directions.walking;
          const cyclingSteps = route.directions.cycling;
          const transitSteps = route.directions.transit;

          if (walkingSteps.length > 0 && transitSteps.length > 0) {
            // Set map to transit layer
            mapInstanceRef.current.setMapTypeId('transit');

            // Render walking route in gray
            const walkingResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route({
                origin: walkingSteps[0].start_location,
                destination: walkingSteps[walkingSteps.length - 1].end_location,
                travelMode: google.maps.TravelMode.WALKING,
              }, (result, status) => {
                if (status === 'OK' && result) {
                  resolve(result);
                } else {
                  reject(status);
                }
              });
            });

            // Render cycling route in green (only if cycling steps exist)
            if (cyclingSteps.length > 0) {
              const cyclingResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
                directionsService.route({
                  origin: cyclingSteps[0].start_location,
                  destination: cyclingSteps[cyclingSteps.length - 1].end_location,
                  travelMode: google.maps.TravelMode.BICYCLING,
                }, (result, status) => {
                  if (status === 'OK' && result) {
                    resolve(result);
                  } else {
                    reject(status);
                  }
                });
              });

              // Render cycling route in green
              new google.maps.DirectionsRenderer({
                map: mapInstanceRef.current,
                directions: cyclingResult,
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: "#4CAF50",
                  strokeWeight: 5
                }
              });

              // Add cycling points to bounds
              cyclingResult.routes[0].legs[0].steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
            }

            // Render transit route in blue
            const transitResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route({
                origin: transitSteps[0].start_location,
                destination: transitSteps[transitSteps.length - 1].end_location,
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

            // Render walking route in gray
            new google.maps.DirectionsRenderer({
              map: mapInstanceRef.current,
              directions: walkingResult,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#757575",
                strokeWeight: 5
              }
            });

            // Render transit route in blue
            new google.maps.DirectionsRenderer({
              map: mapInstanceRef.current,
              directions: transitResult,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#2196F3",
                strokeWeight: 5
              }
            });

            // Add all points to bounds
            [walkingResult, transitResult].forEach(result => {
              result.routes[0].legs[0].steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
            });

            // Add markers for key points
            new google.maps.Marker({
              position: walkingSteps[0].start_location,
              map: mapInstanceRef.current,
              title: "Start",
              label: "A"
            });

            // Add final destination marker
            new google.maps.Marker({
              position: transitSteps[transitSteps.length - 1].end_location,
              map: mapInstanceRef.current,
              title: "End",
              label: "B"
            });

            // Fit bounds with padding
            mapInstanceRef.current.fitBounds(bounds, {
              top: 50,
              right: 50,
              bottom: 50,
              left: 50
            });
          }
        } else {
          // Regular transit route
          const transitSteps = route.directions.transit;
          if (transitSteps.length > 0) {
            const origin = transitSteps[0].start_location;
            const destination = transitSteps[transitSteps.length - 1].end_location;

            if (origin && destination) {
              // Set map to transit layer
              mapInstanceRef.current.setMapTypeId('transit');

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
                  strokeColor: "#2196F3",
                  strokeWeight: 5
                }
              });

              // Add all points to bounds
              result.routes[0].legs[0].steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });

              // Fit bounds with padding
              mapInstanceRef.current.fitBounds(bounds, {
                top: 50,
                right: 50,
                bottom: 50,
                left: 50
              });
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