import { useState } from "react";
import { SearchResult } from "@/types/location";

interface DirectionsResult {
  result: google.maps.DirectionsResult;
  status: google.maps.DirectionsStatus;
}

export const useDirectionsService = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getDirections = async (
    origin: google.maps.LatLng,
    destination: google.maps.LatLng | SearchResult,
    travelMode: google.maps.TravelMode
  ): Promise<DirectionsResult> => {
    setIsLoading(true);
    
    try {
      const directionsService = new window.google.maps.DirectionsService();
      const destinationLatLng = 'location' in destination 
        ? new google.maps.LatLng(destination.location.lat, destination.location.lng)
        : destination;

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin,
          destination: destinationLatLng,
          travelMode,
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(status);
          }
        });
      });

      return { result, status: google.maps.DirectionsStatus.OK };
    } catch (error) {
      return {
        result: {} as google.maps.DirectionsResult,
        status: error as google.maps.DirectionsStatus
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getDirections,
    isLoading
  };
};