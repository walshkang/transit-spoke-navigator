import { DirectionStep } from "@/types/route";
import DOMPurify from 'dompurify';

export const formatDirectionStep = (
  step: google.maps.DirectionsStep,
  _index?: number,
  _array?: google.maps.DirectionsStep[]
): DirectionStep => {
  let instructions = DOMPurify.sanitize(step.instructions);
  
  // Ensure we have valid start and end locations
  if (!step.start_location || !step.end_location) {
    console.error('Missing location data in step:', step);
  }
  
  return {
    instructions,
    distance: step.distance?.text || '',
    duration: step.duration?.text || '',
    mode: step.travel_mode.toLowerCase(),
    start_location: step.start_location,
    end_location: step.end_location,
    transit: step.transit ? {
      departure_stop: { name: step.transit.departure_stop?.name || '' },
      arrival_stop: { name: step.transit.arrival_stop?.name || '' },
      line: {
        name: step.transit.line?.name || '',
        short_name: step.transit.line?.short_name || ''
      }
    } : undefined
  };
};

export const calculateMinutes = (
  steps: google.maps.DirectionsStep[], 
  mode: google.maps.TravelMode
): number => {
  return Math.round(
    steps
      .filter(step => step.travel_mode === mode)
      .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
  );
};