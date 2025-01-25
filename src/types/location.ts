export interface SearchResult {
  id: string;
  name: string;
  address: string;
  distance?: number;
  location: {
    lat: number;
    lng: number;
  };
}

export interface LocationError {
  title: string;
  message: string;
}