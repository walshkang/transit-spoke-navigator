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
      const firstWalkingStep = route.directions.walking[0];
      const lastWalkingStep = route.directions.walking[route.directions.walking.length - 1];
      
      if (firstWalkingStep.start_location && firstWalkingStep.end_location) {
        segments.push({
          start: firstWalkingStep.start_location,
          end: firstWalkingStep.end_location,
          mode: 'WALKING',
          color: "#757575"
        });
      }
    }

    if (route.directions.cycling.length > 0) {
      const firstCyclingStep = route.directions.cycling[0];
      const lastCyclingStep = route.directions.cycling[route.directions.cycling.length - 1];
      
      if (firstCyclingStep.start_location && lastCyclingStep.end_location) {
        segments.push({
          start: firstCyclingStep.start_location,
          end: lastCyclingStep.end_location,
          mode: 'BICYCLING',
          color: "#4CAF50"
        });
      }
    }

    if (route.directions.transit.length > 0) {
      const firstTransitStep = route.directions.transit[0];
      const lastTransitStep = route.directions.transit[route.directions.transit.length - 1];
      
      if (firstTransitStep.start_location && lastTransitStep.end_location) {
        segments.push({
          start: firstTransitStep.start_location,
          end: lastTransitStep.end_location,
          mode: 'TRANSIT',
          color: "#2196F3"
        });
      }
    }
  } else {
    // Regular transit route
    if (route.directions.transit.length > 0) {
      const firstStep = route.directions.transit[0];
      const lastStep = route.directions.transit[route.directions.transit.length - 1];
      
      if (firstStep.start_location && lastStep.end_location) {
        segments.push({
          start: firstStep.start_location,
          end: lastStep.end_location,
          mode: 'TRANSIT',
          color: "#2196F3"
        });
      }
    }
  }

  // Get start and end points
  const startLocation = route.directions.walking[0]?.start_location || 
                       route.directions.transit[0]?.start_location;
  const endLocation = route.directions.walking[route.directions.walking.length - 1]?.end_location || 
                     route.directions.transit[route.directions.transit.length - 1]?.end_location;

  const map = useMapRenderer(
    mapRef,
    {
      segments,
      markers: {
        start: startLocation!,
        end: endLocation!
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
    />
  );
};

export default RouteMap;