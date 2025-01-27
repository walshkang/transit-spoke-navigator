import { DirectionStep, Route, Station } from "@/types/route";
import { calculateDistance } from "@/utils/location";

const WALK_THRESHOLD = 800; // meters

export const extractLastWalkingSegment = (route: Route): DirectionStep | null => {
  const transitSteps = route.directions.transit;
  
  // Find the last walking step
  for (let i = transitSteps.length - 1; i >= 0; i--) {
    if (transitSteps[i].mode === "WALKING") {
      return transitSteps[i];
    }
  }
  
  return null;
};

export const findNearestStationForLastSegment = (
  location: google.maps.LatLng,
  stations: Station[],
  requireBikes: boolean
): Station | null => {
  let nearestStation: Station | null = null;
  let shortestDistance = Infinity;

  stations.forEach((station) => {
    const distance = calculateDistance(
      location.lat(),
      location.lng(),
      station.information.lat,
      station.information.lon
    );

    const hasAvailability = requireBikes 
      ? station.status.num_bikes_available > 0
      : station.status.num_docks_available > 0;

    if (distance < shortestDistance && hasAvailability) {
      shortestDistance = distance;
      nearestStation = station;
    }
  });

  return nearestStation;
};

export const calculateBikingTimeForLastSegment = (
  lastTransitLocation: google.maps.LatLng,
  pickupStation: Station,
  dropOffStation: Station,
  destination: google.maps.LatLng
): { totalTime: number; walkToPickup: number; biking: number; walkToDestination: number } => {
  // Calculate distances
  const walkToPickupDistance = calculateDistance(
    lastTransitLocation.lat(),
    lastTransitLocation.lng(),
    pickupStation.information.lat,
    pickupStation.information.lon
  );

  const bikingDistance = calculateDistance(
    pickupStation.information.lat,
    pickupStation.information.lon,
    dropOffStation.information.lat,
    dropOffStation.information.lon
  );

  const walkToDestinationDistance = calculateDistance(
    dropOffStation.information.lat,
    dropOffStation.information.lon,
    destination.lat(),
    destination.lng()
  );

  // Convert distances to time (assuming average speeds)
  const walkingSpeed = 5; // km/h
  const bikingSpeed = 12; // km/h

  const walkToPickupTime = (walkToPickupDistance / walkingSpeed) * 60;
  const bikingTime = (bikingDistance / bikingSpeed) * 60;
  const walkToDestinationTime = (walkToDestinationDistance / walkingSpeed) * 60;

  return {
    totalTime: walkToPickupTime + bikingTime + walkToDestinationTime,
    walkToPickup: Math.round(walkToPickupTime),
    biking: Math.round(bikingTime),
    walkToDestination: Math.round(walkToDestinationTime)
  };
};