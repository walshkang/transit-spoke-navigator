export interface GBFSResponse {
  data: {
    en: {
      feeds: {
        name: string;
        url: string;
      }[];
    };
  };
}

export interface StationInformation {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
}

export interface StationStatus {
  station_id: string;
  num_bikes_available: number;
  num_docks_available: number;
  is_installed: boolean;
  is_renting: boolean;
  is_returning: boolean;
}

export interface StationData {
  information: StationInformation;
  status: StationStatus;
}