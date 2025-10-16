import { useRef, useState } from "react";
import { SearchResult } from "@/types/location";
import { calculateDistance } from "@/utils/location";
import { useToast } from "@/components/ui/use-toast";

export const useGooglePlaces = (currentLocation: GeolocationCoordinates | null) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const lastControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Simple in-memory cache with TTL
  const cacheRef = useRef<Map<string, { ts: number; results: SearchResult[] }>>(new Map());
  const CACHE_TTL_MS = 10 * 60 * 1000;

  function makeKey(query: string, loc: GeolocationCoordinates | null) {
    const k = query.trim().toLowerCase();
    if (!loc) return `${k}|none`;
    const hint = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
    return `${k}|${hint}`;
  }

  const performSearch = async (query: string, signal?: AbortSignal): Promise<SearchResult[]> => {
    if (!query || query.trim().length < 3) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 3 characters",
        variant: "destructive",
      });
      setResults([]);
      return [];
    }

    setIsLoading(true);
    try {
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
        location: currentLocation
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
      return formattedResults;
    } catch (error) {
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
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Public API: debounced + cached search
  const searchPlaces = (query: string) => {
    // Check cache first
    const key = makeKey(query, currentLocation);
    const cached = cacheRef.current.get(key);
    const now = Date.now();
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      setResults(cached.results);
      return Promise.resolve();
    }

    // Abort previous in-flight request
    if (lastControllerRef.current) {
      lastControllerRef.current.abort();
    }
    const controller = new AbortController();
    lastControllerRef.current = controller;

    // Debounce
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    return new Promise<void>((resolve) => {
      debounceTimerRef.current = window.setTimeout(async () => {
        const fetched = await performSearch(query, controller.signal);
        // After successful fetch, cache results (use fetched, not state snapshot)
        cacheRef.current.set(key, { ts: Date.now(), results: fetched });
        resolve();
      }, 450);
    });
  };

  return { 
    results, 
    isLoading, 
    searchPlaces,
    setResults 
  };
};
