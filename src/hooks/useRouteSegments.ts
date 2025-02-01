import { useCallback } from 'react';
import { DirectionStep } from '@/types/route';
import { findNearestStationWithBikes, findNearestStationWithDocks } from '@/utils/gbfsUtils';

export const useRouteSegments = () => {
  const calculateSegment = useCallback(async (
    origin: google.maps.LatLng,
    destination: google.maps.LatLng,
    mode: google.maps.TravelMode
  ): Promise<google.maps.DirectionsResult> => {
    const directionsService = new google.maps.DirectionsService();
    
    return new Promise((resolve, reject) => {
      directionsService.route({
        origin,
        destination,
        travelMode: mode,
      }, (result, status) => {
        if (status === 'OK' && result) {
          resolve(result);
        } else {
          reject(status);
        }
      });
    });
  }, []);

  const processInitialSegment = useCallback(async (
    origin: google.maps.LatLng,
    firstStep: google.maps.DirectionsStep
  ) => {
    const startStation = await findNearestStationWithBikes(
      origin.lat(),
      origin.lng()
    );

    if (!startStation) return null;

    const endStation = await findNearestStationWithDocks(
      firstStep.end_location.lat(),
      firstStep.end_location.lng()
    );

    if (!endStation) return null;

    const walkToStationResponse = await calculateSegment(
      origin,
      new google.maps.LatLng(startStation.information.lat, startStation.information.lon),
      google.maps.TravelMode.WALKING
    );

    const cyclingResponse = await calculateSegment(
      new google.maps.LatLng(startStation.information.lat, startStation.information.lon),
      new google.maps.LatLng(endStation.information.lat, endStation.information.lon),
      google.maps.TravelMode.BICYCLING
    );

    return {
      walkToStationResponse,
      cyclingResponse,
      startStation,
      endStation
    };
  }, [calculateSegment]);

  const processFinalSegment = useCallback(async (
    lastTransitStep: DirectionStep,
    destination: google.maps.LatLng
  ) => {
    if (!lastTransitStep.end_location) return null;

    const startStation = await findNearestStationWithBikes(
      lastTransitStep.end_location.lat(),
      lastTransitStep.end_location.lng()
    );

    if (!startStation) return null;

    const endStation = await findNearestStationWithDocks(
      destination.lat(),
      destination.lng()
    );

    if (!endStation) return null;

    const walkToStationResponse = await calculateSegment(
      lastTransitStep.end_location,
      new google.maps.LatLng(startStation.information.lat, startStation.information.lon),
      google.maps.TravelMode.WALKING
    );

    const cyclingResponse = await calculateSegment(
      new google.maps.LatLng(startStation.information.lat, startStation.information.lon),
      new google.maps.LatLng(endStation.information.lat, endStation.information.lon),
      google.maps.TravelMode.BICYCLING
    );

    const finalWalkResponse = await calculateSegment(
      new google.maps.LatLng(endStation.information.lat, endStation.information.lon),
      destination,
      google.maps.TravelMode.WALKING
    );

    return {
      walkToStationResponse,
      cyclingResponse,
      finalWalkResponse,
      startStation,
      endStation
    };
  }, [calculateSegment]);

  return {
    calculateSegment,
    processInitialSegment,
    processFinalSegment
  };
};