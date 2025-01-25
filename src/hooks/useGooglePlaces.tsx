import { useState } from "react";
import { SearchResult } from "@/types/location";
import { calculateDistance } from "@/utils/location";
import { useToast } from "@/components/ui/use-toast";

export const useGooglePlaces = (currentLocation: GeolocationCoordinates | null) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchPlaces = async (query: string, signal?: AbortSignal) => {
    if (!query || query.trim().length < 3) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 3 characters",
        variant: "destructive",
      });
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Check if we need to abort before starting
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      if (!window.google?.maps?.places) {
        toast({
          title: "Error",
          description: "Google Maps is not loaded yet. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const mapDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(mapDiv);

      const request: google.maps.places.TextSearchRequest = {
        query: query.trim(),
        locationBias: currentLocation
          ? new window.google.maps.LatLng(
              currentLocation.latitude,
              currentLocation.longitude
            )
          : undefined,
      };

      const placesResults = await new Promise<google.maps.places.PlaceResult[]>(
        (resolve, reject) => {
          // Handle abort signal
          const abortHandler = () => {
            reject(new DOMException('Aborted', 'AbortError'));
          };
          
          if (signal) {
            signal.addEventListener('abort', abortHandler);
          }

          service.textSearch(request, (results, status) => {
            // Cleanup abort listener
            if (signal) {
              signal.removeEventListener('abort', abortHandler);
            }

            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(results || []);
            } else {
              reject(status);
            }
          });
        }
      );

      const formattedResults = placesResults.map((result): SearchResult => ({
        id: result.place_id || Math.random().toString(),
        name: result.name || "",
        address: result.formatted_address || "",
        location: {
          lat: result.geometry?.location?.lat() || 0,
          lng: result.geometry?.location?.lng() || 0,
        },
        distance: currentLocation
          ? calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              result.geometry?.location?.lat() || 0,
              result.geometry?.location?.lng() || 0
            )
          : undefined,
      }));

      setResults(formattedResults);
    } catch (error) {
      // Only show errors if not aborted
      if (error.name !== 'AbortError') {
        console.error("Search error:", error);
        toast({
          title: "Error",
          description: error instanceof DOMException 
            ? "Search canceled" 
            : "Failed to fetch search results",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    results, 
    isLoading, 
    searchPlaces, 
    setResults 
  };
};