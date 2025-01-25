import { StationData } from "@/types/gbfs";
import { GBFSCache } from "@/types/route";
import { calculateDistance } from "./location";

const CACHE_TTL = 60000; // 60 seconds
let gbfsCache: GBFSCache | null = null;

export const findNearestStationWithBikes = async (
  lat: number, 
  lng: number, 
  maxDistance: number = 500, // meters
  minBikes: number = 1
): Promise<StationData | null> => {
  const stations = await getStationsWithCache();
  if (!stations) return null;

  return stations
    .filter(station => 
      station.status.num_bikes_available >= minBikes &&
      calculateDistance(lat, lng, station.information.lat, station.information.lon) * 1000 <= maxDistance
    )
    .sort((a, b) => 
      calculateDistance(lat, lng, a.information.lat, a.information.lon) -
      calculateDistance(lat, lng, b.information.lat, b.information.lon)
    )[0] || null;
};

export const findNearestStationWithDocks = async (
  lat: number, 
  lng: number, 
  maxDistance: number = 500, // meters
  minDocks: number = 1
): Promise<StationData | null> => {
  const stations = await getStationsWithCache();
  if (!stations) return null;

  return stations
    .filter(station => 
      station.status.num_docks_available >= minDocks &&
      calculateDistance(lat, lng, station.information.lat, station.information.lon) * 1000 <= maxDistance
    )
    .sort((a, b) => 
      calculateDistance(lat, lng, a.information.lat, a.information.lon) -
      calculateDistance(lat, lng, b.information.lat, b.information.lon)
    )[0] || null;
};

const getStationsWithCache = async (): Promise<StationData[] | null> => {
  const now = Date.now();
  
  if (gbfsCache && now - gbfsCache.timestamp < gbfsCache.ttl) {
    return gbfsCache.data;
  }

  try {
    const infoResponse = await fetch('https://gbfs.citibikenyc.com/gbfs/en/station_information.json');
    const statusResponse = await fetch('https://gbfs.citibikenyc.com/gbfs/en/station_status.json');
    
    if (!infoResponse.ok || !statusResponse.ok) {
      console.error('Failed to fetch GBFS data:', infoResponse.status, statusResponse.status);
      return null;
    }

    const infoData = await infoResponse.json();
    const statusData = await statusResponse.json();

    const stations: StationData[] = infoData.data.stations.map((info: any) => {
      const status = statusData.data.stations.find((s: any) => s.station_id === info.station_id);
      return {
        information: info,
        status: status || { 
          station_id: info.station_id,
          num_bikes_available: 0,
          num_docks_available: 0,
          is_installed: false,
          is_renting: false,
          is_returning: false
        }
      };
    });

    gbfsCache = {
      data: stations,
      timestamp: now,
      ttl: CACHE_TTL
    };

    return stations;
  } catch (error) {
    console.error('Error fetching GBFS data:', error);
    return null;
  }
};