import { StationData } from "./gbfs";

export interface DirectionStep {
  instructions: string;
  distance: string;
  duration: string;
  mode: string;
  start_location?: google.maps.LatLng;
  end_location?: google.maps.LatLng;
  transit?: {
    departure_stop?: { name: string };
    arrival_stop?: { name: string };
    line?: { name: string; short_name: string };
  };
}

export interface Station {
  information: {
    lat: number;
    lon: number;
    name: string;
  };
  status: {
    num_bikes_available: number;
    num_docks_available: number;
  };
}

export interface Route {
  duration: number;
  bikeMinutes: number;
  subwayMinutes: number;
  walkingMinutes: number;
  // Distinguishes how the route was generated for labeling and logic
  variant?: 'standard' | 'enhanced' | 'no-bus' | 'no-bus-bike';
  transitStartLocation?: google.maps.LatLng;
  startStation?: StationData;
  endStation?: StationData;
  lastBikeStartStation?: StationData;
  lastBikeEndStation?: StationData;
  directions: {
    walking: DirectionStep[];
    cycling: DirectionStep[];
    transit: DirectionStep[];
  };
  allStepsInOrder?: DirectionStep[]; // Sequential order of all steps
}

export interface RouteCalculationError {
  type: 'LOCATION_ERROR' | 'CALCULATION_ERROR' | 'NO_STATIONS_ERROR';
  message: string;
}

export interface GBFSCache {
  data: StationData[];
  timestamp: number;
  ttl: number;
}