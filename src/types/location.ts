export interface SearchResult {
  id: string;
  name: string;
  address: string;
  distance?: number;
  reason?: string;
  rating?: number;
  userRatingCount?: number;
  location: {
    lat: number;
    lng: number;
  };
}

export interface LocationError {
  title: string;
  message: string;
}