import { useRef, useState } from "react";
import { SearchResult } from "@/types/location";
import { calculateDistance } from "@/utils/location";
import { useToast } from "@/components/ui/use-toast";
import { apiKeyManager } from "@/utils/apiKeyManager";

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

      // Prefer Places API (New) Text Search via REST to avoid deprecated JS service
      const mapsKey = apiKeyManager.getGoogleMapsKey();
      if (!mapsKey) {
        throw new Error('Missing Google Maps API key');
      }
      if (!/^[\x00-\x7F]+$/.test(mapsKey) || !/^AIza[0-9A-Za-z_\-]{10,}$/.test(mapsKey)) {
        throw new Error('Invalid Google Maps API key');
      }

      const body: any = {
        textQuery: query.trim(),
      };
      if (currentLocation) {
        body.locationBias = {
          circle: {
            center: {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            },
            radius: 10000,
          },
        };
      }

      const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': mapsKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!resp.ok) {
        let detail = `${resp.status}`;
        try {
          const errJson = await resp.json();
          if (errJson?.error?.message) {
            detail = `${resp.status}: ${errJson.error.message}`;
          }
        } catch {}
        throw new Error(`Places search error: ${detail}`);
      }

      const data = await resp.json();
      const places: any[] = data?.places || [];

      const formattedResults = places.map((p): SearchResult => {
        const lat = p.location?.latitude ?? p.location?.lat ?? 0;
        const lng = p.location?.longitude ?? p.location?.lng ?? 0;
        const name = p.displayName?.text ?? p.displayName ?? '';
        const id = p.id || p.placeId || Math.random().toString();
        return {
          id,
          name,
          address: p.formattedAddress || '',
          location: { lat, lng },
          distance: currentLocation
            ? calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                lat,
                lng
              )
            : undefined,
        };
      });

      setResults(formattedResults);
      return formattedResults;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Search error:", error);
        toast({
          title: "Error",
          description: error instanceof DOMException 
            ? "Search canceled" 
            : (error instanceof Error ? error.message : "Failed to fetch search results"),
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
