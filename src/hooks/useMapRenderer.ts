import { useEffect, useRef } from 'react';
import { MapRenderOptions } from '@/types/maps';

export const useMapRenderer = (
  mapRef: React.RefObject<HTMLDivElement>,
  options: MapRenderOptions,
  isVisible: boolean
) => {
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const renderersRef = useRef<google.maps.DirectionsRenderer[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!isVisible || !mapRef.current) return;

    const initializeMap = () => {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current!, {
          zoom: 12,
          center: { lat: 40.7128, lng: -74.0060 },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
      }

      // Set transit layer
      mapInstanceRef.current.setMapTypeId('transit');

      // Clear existing renderers and markers
      renderersRef.current.forEach(renderer => renderer.setMap(null));
      renderersRef.current = [];
      
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Calculate bounds
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(options.markers.start);
      bounds.extend(options.markers.end);

      // Add markers using standard Marker class
      const startMarker = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: options.markers.start,
        title: "Start"
      });

      const endMarker = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: options.markers.end,
        title: "End"
      });

      markersRef.current.push(startMarker, endMarker);

      // Render route segments
      options.segments.forEach(async segment => {
        try {
          const directionsService = new google.maps.DirectionsService();
          const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            directionsService.route({
              origin: segment.start,
              destination: segment.end,
              travelMode: segment.mode as google.maps.TravelMode,
            }, (result, status) => {
              if (status === 'OK' && result) {
                resolve(result);
              } else {
                reject(status);
              }
            });
          });

          const renderer = new google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            directions: result,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: segment.color,
              strokeWeight: 5
            }
          });

          renderersRef.current.push(renderer);

          // Extend bounds with segment points
          result.routes[0].legs[0].steps.forEach(step => {
            bounds.extend(step.start_location);
            bounds.extend(step.end_location);
          });

          // Fit bounds with padding
          mapInstanceRef.current?.fitBounds(bounds, {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
          });
        } catch (error) {
          console.error('Error rendering route segment:', error);
        }
      });
    };

    initializeMap();

    return () => {
      // Clean up markers and renderers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      renderersRef.current.forEach(renderer => renderer.setMap(null));
      renderersRef.current = [];
    };
  }, [isVisible, mapRef, options]);

  return mapInstanceRef.current;
};