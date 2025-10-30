import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OriginDestinationForm from "@/components/OriginDestinationForm";
import SearchResults from "@/components/SearchResults";
import ErrorAlert from "@/components/ErrorAlert";
import ThemeToggle from "@/components/ThemeToggle";
import ApiKeyInput from "@/components/ApiKeyInput";
import SuggestionReasoningPanel from "@/components/SuggestionReasoningPanel";
import { useGooglePlaces } from "@/hooks/useGooglePlaces";
import { useRouteCalculation } from "@/hooks/useRouteCalculation";
import { getCurrentPosition } from "@/utils/location";
import { apiKeyManager } from "@/utils/apiKeyManager";
import { getGroundedSuggestions } from "@/utils/aiService";
import type { SearchResult, LocationError } from "@/types/location";

export default function AISearch() {
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentSearch, setCurrentSearch] = useState<SearchResult | null>(null);
  const [isLoadingNLSuggestions, setIsLoadingNLSuggestions] = useState(false);
  const [groundedSuggestions, setGroundedSuggestions] = useState<Array<{ name: string; placeId?: string }>>([]);

  const {
    results: fromResults,
    isLoading: isLoadingFrom,
    searchPlaces: searchFrom,
    setResults: setFromResults
  } = useGooglePlaces(null);

  const {
    results: toResults,
    isLoading: isLoadingTo,
    searchPlaces: searchTo,
    setResults: setToResults
  } = useGooglePlaces(originCoords ? ({ latitude: originCoords.lat, longitude: originCoords.lng } as GeolocationCoordinates) : null);

  const {
    routes,
    isCalculatingRoute,
    selectedResult,
    calculateRoutes,
    setRoutes,
    setSelectedResult
  } = useRouteCalculation();

  useEffect(() => {
    if (apiKey) {
      const keyToUse = apiKey;
      apiKeyManager.setGoogleMapsKey(keyToUse);

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(keyToUse)}&loading=async&libraries=places`;
      script.setAttribute('loading', 'async');
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onerror = () => {
        setError({ title: "API Key Error", message: "Failed to load Google Maps API. Please check your API key." });
      };
    }
    return () => {
      const script = document.querySelector('script[src*="maps.googleapis.com"]');
      if (script) document.head.removeChild(script);
    };
  }, [apiKey]);

  const handleUseMyLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setOriginCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch {
      setError({ title: "Location Permission Needed", message: "We couldn't access your location. Please allow location access." });
    }
  };

  const handleSearchFromSubmit = async () => {
    if (!originQuery.trim()) return;
    await searchFrom(originQuery);
  };

  const handleSearchToSubmit = async () => {
    if (!destinationQuery.trim()) return;
    if (!originCoords) {
      setError({ title: "Pick a start", message: "Set From (or use your location) first." });
      return;
    }
    setToResults([]);
    setIsLoadingNLSuggestions(true);
    try {
      const provider = apiKeyManager.getAIProvider();
      const aiKey = apiKeyManager.getAIKey();
      if (provider !== 'gemini' || !aiKey) {
        // Fallback to Places only
        await searchTo(destinationQuery);
        setToResults((prev) => prev.slice(0, 3));
        return;
      }

      const suggestions = await getGroundedSuggestions(
        destinationQuery,
        { latitude: originCoords.lat, longitude: originCoords.lng },
        3
      );
      setGroundedSuggestions(suggestions || []);

      if (!suggestions || suggestions.length === 0) {
        await searchTo(destinationQuery);
        setToResults((prev) => prev.slice(0, 3));
        return;
      }

      await searchTo(destinationQuery);
      const idRank = new Map<string, number>();
      suggestions.forEach((s, i) => { if (s.placeId) idRank.set(s.placeId, i); });
      setToResults((prev) => {
        const filtered = prev.filter((r) => idRank.has(r.id));
        const finalList = (filtered.length ? filtered : prev).slice();
        finalList.sort((a, b) => {
          const aiA = idRank.get(a.id);
          const aiB = idRank.get(b.id);
          if (aiA == null && aiB == null) return 0;
          if (aiA == null) return 1;
          if (aiB == null) return -1;
          return aiA - aiB;
        });
        return finalList.slice(0, 3);
      });
    } finally {
      setIsLoadingNLSuggestions(false);
    }
  };

  const handleResultSelect = (result: SearchResult, list: 'from' | 'to') => {
    if (list === 'from') {
      setOriginQuery(result.name);
      setOriginCoords(result.location);
      setCurrentSearch(null);
      setFromResults([]);
    } else {
      setCurrentSearch(result);
      if (!originCoords) {
        setError({ title: "Pick a start", message: "Set From (or use your location) first." });
        return;
      }
      calculateRoutes(result, originCoords);
    }
  };

  const handleResetSearch = () => {
    if (abortController) abortController.abort();
    setOriginQuery("");
    setDestinationQuery("");
    setFromResults([]);
    setToResults([]);
    setCurrentSearch(null);
    setRoutes([]);
    setAbortController(null);
  };

  const handleApiKeySubmit = (key: string) => {
    if (key.trim()) setApiKey(key.trim());
  };

  if (!apiKey) {
    return <ApiKeyInput onSubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500/15 via-indigo-500/15 to-fuchsia-500/15 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[28rem] h-[28rem] bg-sky-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] bg-indigo-400/20 rounded-full blur-3xl" />

      <div className="container max-w-md md:max-w-2xl lg:max-w-4xl mx-auto p-6 md:p-8 lg:p-12 relative z-10">
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">Search with AI</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Gemini grounded by Google Maps for smarter suggestions</p>
          </div>
          <Link to="/">
            <Button variant="secondary" className="rounded-xl">Back to Normal Search</Button>
          </Link>
        </div>

        <OriginDestinationForm
          fromQuery={originQuery}
          onChangeFrom={setOriginQuery}
          onSearchFrom={handleSearchFromSubmit}
          onUseMyLocation={handleUseMyLocation}
          onResetFrom={() => { setOriginQuery(""); setOriginCoords(null); setFromResults([]); }}
          fromResultsArea={(
            <>
              {originCoords && (
                <div className="p-[1.5px] rounded-2xl bg-gradient-to-r from-sky-300/30 to-indigo-300/30 mb-4" role="button" onClick={() => setOriginQuery('Current Location')}>
                  <div className="glass p-5 rounded-2xl space-y-2 transition-aero shadow-aero bg-white/60">
                    <h3 className="font-semibold text-lg">Current Location</h3>
                    <p className="text-muted-foreground text-sm">Lat {originCoords.lat.toFixed(5)}, Lng {originCoords.lng.toFixed(5)}</p>
                  </div>
                </div>
              )}
              {fromResults.length > 0 && (
                <SearchResults
                  title="Choose a start"
                  results={fromResults}
                  isLoading={isLoadingFrom}
                  onResultSelect={(r) => handleResultSelect(r, 'from')}
                  onNewSearch={() => setFromResults([])}
                />
              )}
            </>
          )}
          toQuery={destinationQuery}
          onChangeTo={setDestinationQuery}
          onSearchTo={handleSearchToSubmit}
          onResetTo={() => { setDestinationQuery(""); setToResults([]); }}
          naturalLanguageMode={true}
        />

        {selectedResult && routes.length > 0 ? (
          <div className="mt-6">
            {/* reuse existing results view */}
          </div>
        ) : (
          <>
            {groundedSuggestions.length > 0 && toResults.length > 0 && (
              <div className="mt-6">
                <SuggestionReasoningPanel
                  suggestions={groundedSuggestions}
                  origin={originCoords}
                  onApplyReasons={(reasonsById, reasonsByName) => {
                    const norm = (s: string) => s.trim().toLowerCase();
                    const hasAIReasons = Object.keys(reasonsById).length > 0 || Object.keys(reasonsByName).length > 0;
                    setToResults((prev) => {
                      if (hasAIReasons) {
                        return prev.map((r) => ({
                          ...r,
                          reason: reasonsById[r.id] || reasonsByName[norm(r.name)] || r.reason,
                        }));
                      }
                      return prev.map((r) => {
                        const parts: string[] = [];
                        if (typeof r.rating === 'number') {
                          const stars = `${r.rating.toFixed(1)}★`;
                          const count = typeof r.userRatingCount === 'number' ? r.userRatingCount : undefined;
                          const countLabel = count != null ? (count >= 1000 ? `${Math.round(count / 100) / 10}k` : `${count}`) : undefined;
                          parts.push(countLabel ? `${stars} · ${countLabel} reviews` : stars);
                        }
                        if (r.distance !== undefined) parts.push(`~${r.distance.toFixed(1)} km away`);
                        if (parts.length === 0) parts.push('Matches your query');
                        return { ...r, reason: parts.join(' · ') };
                      });
                    });
                  }}
                />
              </div>
            )}

            {(toResults.length > 0 || isLoadingNLSuggestions) && (
              <SearchResults
                title="Choose a destination"
                results={toResults}
                isLoading={isLoadingNLSuggestions || isLoadingTo}
                onResultSelect={(r) => handleResultSelect(r, 'to')}
                onNewSearch={() => setToResults([])}
                currentSelection={currentSearch}
              />
            )}
          </>
        )}

        <ErrorAlert isOpen={error !== null} title={error?.title || "Error"} message={error?.message || "An error occurred"} onClose={() => setError(null)} />
      </div>
    </div>
  );
}


