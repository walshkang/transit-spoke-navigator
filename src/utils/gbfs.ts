import { StationData, StationInformation, StationStatus } from "@/types/gbfs";
import { calculateDistance } from "./location";

// Updated URLs to use the correct GBFS feed endpoints
const GBFS_INFO_URL = "https://gbfs.citibikenyc.com/gbfs/en/station_information.json";
const GBFS_STATUS_URL = "https://gbfs.citibikenyc.com/gbfs/en/station_status.json";

export async function fetchStationData(): Promise<StationData[]> {
  try {
    // Fetch station information with proper error handling
    const infoResponse = await fetch(GBFS_INFO_URL);
    if (!infoResponse.ok) {
      throw new Error(`Failed to fetch station information: ${infoResponse.status} ${infoResponse.statusText}`);
    }
    const infoData = await infoResponse.json();
    const stationInfo: StationInformation[] = infoData.data.stations;

    // Fetch station status with proper error handling
    const statusResponse = await fetch(GBFS_STATUS_URL);
    if (!statusResponse.ok) {
      throw new Error(`Failed to fetch station status: ${statusResponse.status} ${statusResponse.statusText}`);
    }
    const statusData = await statusResponse.json();
    const stationStatus: StationStatus[] = statusData.data.stations;

    // Combine information and status
    return stationInfo.map(info => {
      const status = stationStatus.find(s => s.station_id === info.station_id);
      if (!status) {
        console.warn(`No status found for station ${info.station_id}`);
        return null;
      }
      return {
        information: info,
        status: status
      };
    }).filter((station): station is StationData => station !== null);
  } catch (error) {
    console.error("Error fetching station data:", error);
    throw error;
  }
}

export function findNearestStation(
  stations: StationData[],
  lat: number,
  lng: number,
  requireBikes: boolean = true,
  minBikes: number = 1
): StationData | null {
  const availableStations = stations.filter(station => {
    const status = station.status;
    return (
      status.is_installed &&
      status.is_renting &&
      status.is_returning &&
      (!requireBikes || status.num_bikes_available >= minBikes)
    );
  });

  if (availableStations.length === 0) return null;

  return availableStations.reduce((nearest, station) => {
    const distance = calculateDistance(
      lat,
      lng,
      station.information.lat,
      station.information.lon
    );
    
    const nearestDistance = calculateDistance(
      lat,
      lng,
      nearest.information.lat,
      nearest.information.lon
    );

    return distance < nearestDistance ? station : nearest;
  }, availableStations[0]);
}