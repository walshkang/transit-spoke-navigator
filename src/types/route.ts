import { SearchResult } from "./location";

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

export interface Route {
  duration: number;
  bikeMinutes: number;
  subwayMinutes: number;
  walkingMinutes: number;
  transitStartLocation?: google.maps.LatLng;
  directions: {
    transit: DirectionStep[];
    cycling: DirectionStep[];
  };
}

export interface RouteCalculationError {
  type: 'LOCATION_ERROR' | 'CALCULATION_ERROR';
  message: string;
}