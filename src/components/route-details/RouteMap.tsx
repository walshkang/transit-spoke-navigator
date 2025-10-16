import { useRef } from "react";
import { Route } from "@/types/route";
import { useMapRenderer } from "@/hooks/useMapRenderer";
import { RouteSegment } from "@/types/maps";

interface RouteMapProps {
  isVisible: boolean;
  onMapLoad: (map: google.maps.Map) => void;
  route: Route;
}

const RouteMap = ({ isVisible, onMapLoad, route }: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  // Prepare route segments
  const segments: RouteSegment[] = [];

  if (route.bikeMinutes > 0) {
    // Enhanced route segments
    if (route.directions.walking.length > 0) {
      const walkingSteps = route.directions.walking;
      for (let i = 0; i < walkingSteps.length; i++) {
        const step = walkingSteps[i];
        if (step.start_location && step.end_location) {
          segments.push({
            start: step.start_location,
            end: step.end_location,
            mode: 'WALKING',
            color: "#757575"
          });
        }
      }
    }

    if (route.directions.cycling.length > 0) {
      const cyclingSteps = route.directions.cycling;
      for (let i = 0; i < cyclingSteps.length; i++) {
        const step = cyclingSteps[i];
        if (step.start_location && step.end_location) {
          segments.push({
            start: step.start_location,
            end: step.end_location,
            mode: 'BICYCLING',
            color: "#4CAF50"
          });
        }
      }
    }

    if (route.directions.transit.length > 0) {
      const transitSteps = route.directions.transit;
      for (let i = 0; i < transitSteps.length; i++) {
        const step = transitSteps[i];
        if (step.start_location && step.end_location) {
          segments.push({
            start: step.start_location,
            end: step.end_location,
            mode: 'TRANSIT',
            color: "#2196F3"
          });
        }
      }
    }
  } else {
    // Regular transit route
    // Include walking segments as well for standard routes
    if (route.directions.walking.length > 0) {
      const walkingSteps = route.directions.walking;
      for (let i = 0; i < walkingSteps.length; i++) {
        const step = walkingSteps[i];
        if (step.start_location && step.end_location) {
          segments.push({
            start: step.start_location,
            end: step.end_location,
            mode: 'WALKING',
            color: "#757575"
          });
        }
      }
    }

    if (route.directions.transit.length > 0) {
      const transitSteps = route.directions.transit;
      for (let i = 0; i < transitSteps.length; i++) {
        const step = transitSteps[i];
        if (step.start_location && step.end_location) {
          segments.push({
            start: step.start_location,
            end: step.end_location,
            mode: 'TRANSIT',
            color: "#2196F3"
          });
        }
      }
    }
  }

  // Get start and end points
  const startLocation = route.directions.walking[0]?.start_location || 
                       route.directions.transit[0]?.start_location;
  const endLocation = route.directions.walking[route.directions.walking.length - 1]?.end_location || 
                     route.directions.transit[route.directions.transit.length - 1]?.end_location;

  if (!startLocation || !endLocation) {
    console.error('Invalid start or end location');
    return null;
  }

  const map = useMapRenderer(
    mapRef,
    {
      segments,
      markers: {
        start: startLocation,
        end: endLocation
      }
    },
    isVisible
  );

  // Notify parent when map is loaded
  if (map) {
    onMapLoad(map);
  }

  return (
    <div 
      ref={mapRef}
      style={{ height: '400px', width: '100%' }}
      className="bg-gray-100 rounded-md mb-4"
      aria-label="Route map"
    />
  );
};

export default RouteMap;