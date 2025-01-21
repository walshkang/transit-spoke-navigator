import { DirectionStep } from "@/types/route";

export const formatDirectionStep = (step: google.maps.DirectionsStep): DirectionStep => ({
  instructions: step.instructions,
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
});

export const calculateMinutes = (steps: google.maps.DirectionsStep[], mode: google.maps.TravelMode): number => {
  return Math.round(
    steps
      .filter(step => step.travel_mode === mode)
      .reduce((total, step) => total + (step.duration?.value || 0), 0) / 60
  );
};