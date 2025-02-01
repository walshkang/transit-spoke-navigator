export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RouteSegment {
  start: google.maps.LatLng;
  end: google.maps.LatLng;
  mode: 'WALKING' | 'BICYCLING' | 'TRANSIT';
  color: string;
}

export interface MapRenderOptions {
  bounds?: MapBounds;
  segments: RouteSegment[];
  markers: {
    start: google.maps.LatLng;
    end: google.maps.LatLng;
  };
}