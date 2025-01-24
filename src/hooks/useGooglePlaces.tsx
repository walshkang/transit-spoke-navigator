import { useState } from "react";
import { SearchResult } from "@/types/location";
import { calculateDistance } from "@/utils/location";
import { useToast } from "@/components/ui/use-toast";

export const useGooglePlaces = (currentLocation: GeolocationCoordinates | null) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchPlaces = async (query: string) => {
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
      console.log("Starting search with query:", query);
      
      // Wait for Google Maps to be loaded
      if (!window.google || !window.google.maps) {
        toast({
          title: "Error",
          description: "Google Maps is not loaded yet. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      const service = new window.google.maps.places.PlacesService(map);

      const request: google.maps.places.TextSearchRequest = {
        query: query.trim(),
        location: currentLocation
          ? new window.google.maps.LatLng(
              currentLocation.latitude,
              currentLocation.longitude
            )
          : undefined,
        radius: 50000, // 50km radius
      };

      console.log("Search request:", request);

      service.textSearch(request, (results, status) => {
        console.log("Places API response status:", status);
        console.log("Raw results:", results);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedResults: SearchResult[] = results.map((result) => ({
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
          
          console.log("Formatted results:", formattedResults);
          setResults(formattedResults);
        } else {
          console.error("Places API error:", status);
          toast({
            title: "Error",
            description: "Failed to fetch search results",
            variant: "destructive",
          });
        }
        setIsLoading(false);
      });
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