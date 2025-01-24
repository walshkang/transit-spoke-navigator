import { useState } from "react";
import { SearchResult } from "@/types/location";
import { calculateDistance } from "@/utils/location";
import { useToast } from "@/components/ui/use-toast";

export const useGooglePlaces = (currentLocation: GeolocationCoordinates | null) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting search with query:", query);
      
      const mapDiv = document.createElement('div');
      mapDiv.style.display = 'none';
      document.body.appendChild(mapDiv);
      
      const map = new window.google.maps.Map(mapDiv, {
        center: { lat: 0, lng: 0 },
        zoom: 1
      });

      const service = new window.google.maps.places.PlacesService(map);
      console.log("Places service initialized");

      const request: google.maps.places.TextSearchRequest = {
        query,
        location: currentLocation
          ? new window.google.maps.LatLng(
              currentLocation.latitude,
              currentLocation.longitude
            )
          : undefined,
        radius: 50000, // 50km radius
      };

      console.log("Search request:", request);

      const processResults = async (
        results: google.maps.places.PlaceResult[] | null, 
        status: google.maps.places.PlacesServiceStatus
      ) => {
        console.log("Places API response status:", status);
        console.log("Raw results:", results);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedResults: SearchResult[] = await Promise.all(
            results.map(async (result) => {
              // Get additional details for each place
              const placeDetails = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
                service.getDetails(
                  {
                    placeId: result.place_id!,
                    fields: ['opening_hours']
                  },
                  (place, detailStatus) => {
                    if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place) {
                      resolve(place);
                    } else {
                      reject(detailStatus);
                    }
                  }
                );
              }).catch(() => null); // If details fail, continue with basic info

              return {
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
              };
            })
          );
          
          console.log("Formatted results:", formattedResults);
          setResults(formattedResults);
          setIsLoading(false);
          
          document.body.removeChild(mapDiv);
        } else {
          console.error("Places API error:", status);
          toast({
            title: "Error",
            description: "Failed to fetch search results",
            variant: "destructive",
          });
          setIsLoading(false);
          document.body.removeChild(mapDiv);
        }
      };

      service.textSearch(request, processResults);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "An error occurred while searching",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return { results, isLoading, searchPlaces, setResults };
};