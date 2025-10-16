import { useState, useEffect } from "react";
import { SearchResult } from "@/types/location";
import SearchBar from "@/components/SearchBar";
import OriginDestinationForm from "@/components/OriginDestinationForm";
import logo from "@/assets/logo.png";
import ErrorAlert from "@/components/ErrorAlert";
import SearchResults from "@/components/SearchResults";
import RouteResults from "@/components/RouteResults";
import RouteDetailsView from "@/components/route-details/RouteDetailsView";
import MethodologyDrawer from "@/components/MethodologyDrawer";
import ApiKeyInput from "@/components/ApiKeyInput";
import AIKeyDialog from "@/components/AIKeyDialog";
import IntentDisplay from "@/components/IntentDisplay";
import { getCurrentPosition } from "@/utils/location";
import { LocationError } from "@/types/location";
import { useGooglePlaces } from "@/hooks/useGooglePlaces";
import { useRouteCalculation } from "@/hooks/useRouteCalculation";
import { useNaturalLanguageSearch } from "@/hooks/useNaturalLanguageSearch";
import { apiKeyManager } from "@/utils/apiKeyManager";
const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isRouteDetailsOpen, setIsRouteDetailsOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentSearch, setCurrentSearch] = useState<SearchResult | null>(null);
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);
  const [naturalLanguageMode, setNaturalLanguageMode] = useState(false);
  const [processedLogo, setProcessedLogo] = useState<string>(logo);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  // From search (no bias)
  const {
    results: fromResults,
    isLoading: isLoadingFrom,
    searchPlaces: searchFrom,
    setResults: setFromResults
  } = useGooglePlaces(null);
  // To search (biased by origin if available)
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
  const {
    parseIntent,
    clearIntent,
    isParsingIntent,
    intent,
    needsAIKey,
    setNeedsAIKey
  } = useNaturalLanguageSearch();
  useEffect(() => {
    if (apiKey) {
      const keyToUse = apiKey;
      setMapsApiKey(keyToUse);
      apiKeyManager.setGoogleMapsKey(keyToUse);
      
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${keyToUse}&libraries=places`;
      script.async = true;
      document.head.appendChild(script);

      // Do not auto geolocate; only load Maps
      script.onload = () => {};
      
      script.onerror = () => {
        setError({
          title: "API Key Error",
          message: "Failed to load Google Maps API. Please check your API key."
        });
      };
    }
    
    return () => {
      const script = document.querySelector('script[src*="maps.googleapis.com"]');
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, [apiKey]);
  const handleUseMyLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setOriginCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch (error) {
      setError({
        title: "Location Permission Needed",
        message: "We couldn't access your location. Please allow location access."
      });
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
    await searchTo(destinationQuery);
  };
  const handleResetSearch = () => {
    // Clear all search-related state
    if (abortController) {
      abortController.abort();
    }
    setOriginQuery("");
    setDestinationQuery("");
    setFromResults([]);
    setToResults([]);
    setCurrentSearch(null);
    setSelectedResult(null);
    setRoutes([]);
    setAbortController(null);
    clearIntent();
  };
  const handleToggleNaturalLanguage = () => {
    setNaturalLanguageMode(!naturalLanguageMode);
    if (intent) {
      clearIntent();
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
  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route);
    setIsRouteDetailsOpen(true);
  };
  const handleApiKeySubmit = (key: string) => {
    if (key.trim()) {
      setApiKey(key.trim());
    }
  };
  
  const handleAIKeySuccess = () => {
    setNeedsAIKey(false);
  };
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Always show API key input if no key is set
  if (!apiKey) {
    return <ApiKeyInput onSubmit={handleApiKeySubmit} />;
  }
  return <div className="min-h-screen gradient-aero-subtle relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{
      animationDelay: '2s'
    }} />
      
      <div className="container max-w-md mx-auto p-6 relative z-10">
        <div className="flex flex-col items-center mb-12 mt-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-aero rounded-full blur-xl opacity-50 animate-pulse-glow" />
            <img src={processedLogo} alt="Transit Navigator" className="w-40 h-40 relative z-10" />
          </div>
          <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            last mile: get to the subway faster
          </h1>
          <p className="text-center text-gray-600 font-thin text-base">discover your perfect route</p>
          <div className="mt-4">
            <button
              className="text-ios-blue text-sm underline hover:opacity-80"
              onClick={() => setIsMethodologyOpen(true)}
            >
              Methodology
            </button>
          </div>
        </div>
        
        <OriginDestinationForm
          fromQuery={originQuery}
          onChangeFrom={setOriginQuery}
          onSearchFrom={handleSearchFromSubmit}
          onUseMyLocation={handleUseMyLocation}
          onResetFrom={() => {
            setOriginQuery("");
            setOriginCoords(null);
            setFromResults([]);
          }}
          fromResultsArea={(
            <>
              {/* Origin results list (and current location) shown above destination */}
              {originCoords && (
                <div
                  className="p-[1.5px] rounded-2xl bg-gradient-to-r from-emerald-300/30 to-cyan-300/30 mb-4"
                  role="button"
                  onClick={() => {
                    setOriginQuery('Current Location');
                  }}
                >
                  <div className="glass p-5 rounded-2xl space-y-2 transition-aero shadow-aero bg-emerald-50/40">
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
          onResetTo={() => {
            setDestinationQuery("");
            setToResults([]);
          }}
          naturalLanguageMode={naturalLanguageMode}
          onToggleNaturalLanguage={handleToggleNaturalLanguage}
          isParsingIntent={isParsingIntent}
        />

        {intent && <div className="mt-4">
            <IntentDisplay intent={intent} onDismiss={clearIntent} />
          </div>}

        {selectedResult && routes.length > 0 ? (
          <RouteResults
            selectedResult={selectedResult}
            routes={routes}
            isCalculatingRoute={isCalculatingRoute}
            onRouteSelect={handleRouteSelect}
            onNewSearch={handleResetSearch}
          />
        ) : (
          <>
            {/* From results moved above via fromResultsArea */}
            {/* To results */}
            {toResults.length > 0 && (
              <SearchResults
                title="Choose a destination"
                results={toResults}
                isLoading={isLoadingTo}
                onResultSelect={(r) => handleResultSelect(r, 'to')}
                onNewSearch={() => setToResults([])}
                currentSelection={currentSearch}
              />
            )}
          </>
        )}

        <ErrorAlert isOpen={error !== null} title={error?.title || "Error"} message={error?.message || "An error occurred"} onClose={() => setError(null)} />

        <AIKeyDialog 
          isOpen={needsAIKey} 
          onClose={() => setNeedsAIKey(false)}
          onSuccess={handleAIKeySuccess}
        />

        {selectedRoute && <RouteDetailsView isOpen={isRouteDetailsOpen} onClose={() => setIsRouteDetailsOpen(false)} originalRoute={selectedRoute} intent={intent} />}
        <MethodologyDrawer open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen} />
      </div>
    </div>;
};
export default Index;