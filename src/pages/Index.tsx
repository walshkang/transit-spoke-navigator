import { useState, useEffect } from "react";
import { SearchResult } from "@/types/location";
import SearchBar from "@/components/SearchBar";
import logo from "@/assets/logo.png";
import ErrorAlert from "@/components/ErrorAlert";
import SearchResults from "@/components/SearchResults";
import RouteResults from "@/components/RouteResults";
import RouteDetailsView from "@/components/route-details/RouteDetailsView";
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
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isRouteDetailsOpen, setIsRouteDetailsOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentSearch, setCurrentSearch] = useState<SearchResult | null>(null);
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);
  const [naturalLanguageMode, setNaturalLanguageMode] = useState(false);
  const [processedLogo, setProcessedLogo] = useState<string>(logo);
  const {
    results,
    isLoading,
    searchPlaces,
    setResults
  } = useGooglePlaces(currentLocation);
  const {
    routes,
    isCalculatingRoute,
    selectedResult,
    calculateRoutes,
    setRoutes,
    setSelectedResult
  } = useRouteCalculation(currentLocation);
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

      script.onload = () => {
        getLocation();
      };
      
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
  const getLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setCurrentLocation(position.coords);
    } catch (error) {
      setError({
        title: "Location Services Required",
        message: "Please enable location services to use this feature."
      });
    }
  };
  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;

    // Cancel previous search
    if (abortController) {
      abortController.abort();
    }
    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    try {
      if (naturalLanguageMode) {
        // Parse natural language query
        const parsedIntent = await parseIntent(searchQuery);
        if (parsedIntent) {
          // Use the destination from parsed intent
          await searchPlaces(parsedIntent.destination, newAbortController.signal);
        }
      } else {
        // Regular search
        await searchPlaces(searchQuery, newAbortController.signal);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError({
          title: "Search Error",
          message: "Failed to fetch search results"
        });
      }
    }
  };
  const handleResetSearch = () => {
    // Clear all search-related state
    if (abortController) {
      abortController.abort();
    }
    setSearchQuery("");
    setResults([]);
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
  const handleResultSelect = (result: SearchResult) => {
    setCurrentSearch(result);
    calculateRoutes(result);
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
        </div>
        
        <SearchBar placeholder="Where to?" value={searchQuery} onChange={setSearchQuery} onSearch={handleSearchSubmit} showReset={!!currentSearch || searchQuery.length > 0} onReset={handleResetSearch} naturalLanguageMode={naturalLanguageMode} onToggleNaturalLanguage={handleToggleNaturalLanguage} isParsingIntent={isParsingIntent} />

        {intent && <div className="mt-4">
            <IntentDisplay intent={intent} onDismiss={clearIntent} />
          </div>}

        {selectedResult && routes.length > 0 ? <RouteResults selectedResult={selectedResult} routes={routes} isCalculatingRoute={isCalculatingRoute} onRouteSelect={handleRouteSelect} onNewSearch={handleResetSearch} /> : <SearchResults results={results} isLoading={isLoading} onResultSelect={handleResultSelect} onNewSearch={handleResetSearch} currentSelection={currentSearch} />}

        <ErrorAlert isOpen={error !== null} title={error?.title || "Error"} message={error?.message || "An error occurred"} onClose={() => setError(null)} />

        <AIKeyDialog 
          isOpen={needsAIKey} 
          onClose={() => setNeedsAIKey(false)}
          onSuccess={handleAIKeySuccess}
        />

        {selectedRoute && <RouteDetailsView isOpen={isRouteDetailsOpen} onClose={() => setIsRouteDetailsOpen(false)} originalRoute={selectedRoute} intent={intent} />}
      </div>
    </div>;
};
export default Index;