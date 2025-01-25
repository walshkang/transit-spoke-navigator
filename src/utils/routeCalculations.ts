import { DirectionStep } from "@/types/route";
import DOMPurify from 'dompurify';

export const formatDirectionStep = (
  step: google.maps.DirectionsStep,
  stationInfo?: { bikes?: number; docks?: number }
): DirectionStep => {
  let instructions = DOMPurify.sanitize(step.instructions);
  
  if (stationInfo) {
    const availability = [];
    if (typeof stationInfo.bikes === 'number') {
      availability.push(`${stationInfo.bikes} bikes`);
    }
    if (typeof stationInfo.docks === 'number') {
      availability.push(`${stationInfo.docks} docks`);
    }
    if (availability.length > 0) {
      instructions += ` [${availability.join(', ')}]`;
    }
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