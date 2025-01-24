import { StationData, StationInformation, StationStatus } from "@/types/gbfs";
import { calculateDistance } from "./location";

const GBFS_BASE_URL = "https://gbfs.citibikenyc.com/gbfs/2.3";

export async function fetchStationData(): Promise<StationData[]> {
  try {
    // Fetch station information
    const infoResponse = await fetch(`${GBFS_BASE_URL}/station_information.json`);
    const infoData = await infoResponse.json();
    const stationInfo: StationInformation[] = infoData.data.stations;

    // Fetch station status
    const statusResponse = await fetch(`${GBFS_BASE_URL}/station_status.json`);
    const statusData = await statusResponse.json();
    const stationStatus: StationStatus[] = statusData.data.stations;

    // Combine information and status
    return stationInfo.map(info => {
      const status = stationStatus.find(s => s.station_id === info.station_id);
      return {
        information: info,
        status: status!
      };
    });
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