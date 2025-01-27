import { useState, useEffect } from "react";
import { SearchResult } from "@/types/location";
import SearchBar from "@/components/SearchBar";
import ErrorAlert from "@/components/ErrorAlert";
import SearchResults from "@/components/SearchResults";
import RouteResults from "@/components/RouteResults";
import RouteDetailsView from "@/components/route-details/RouteDetailsView";
import ApiKeyInput from "@/components/ApiKeyInput";
import { getCurrentPosition } from "@/utils/location";
import { LocationError } from "@/types/location";
import { useGooglePlaces } from "@/hooks/useGooglePlaces";
import { useRouteCalculation } from "@/hooks/useRouteCalculation";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isRouteDetailsOpen, setIsRouteDetailsOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentSearch, setCurrentSearch] = useState<SearchResult | null>(null);

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

  useEffect(() => {
    if (apiKey) {
      getLocation();
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }
  }, [apiKey]);

  const getLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setCurrentLocation(position.coords);
    } catch (error) {
      setError({
        title: "Location Services Required",
        message: "Please enable location services to use this feature.",
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
      await searchPlaces(searchQuery, newAbortController.signal);
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
    setApiKey(key);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  if (!apiKey) {
    return <ApiKeyInput onSubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="min-h-screen bg-ios-background">
      <div className="container max-w-md mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Spoke to Subway
        </h1>
        
        <SearchBar
          placeholder="Where to?"
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearchSubmit}
          showReset={!!currentSearch || searchQuery.length > 0}
          onReset={handleResetSearch}
        />

        {selectedResult && routes.length > 0 ? (
          <RouteResults
            selectedResult={selectedResult}
            routes={routes}
            isCalculatingRoute={isCalculatingRoute}
            onRouteSelect={handleRouteSelect}
            onNewSearch={handleResetSearch}
          />
        ) : (
          <SearchResults
            results={results}
            isLoading={isLoading}
            onResultSelect={handleResultSelect}
            onNewSearch={handleResetSearch}
            currentSelection={currentSearch}
          />
        )}

        <ErrorAlert
          isOpen={error !== null}
          title={error?.title || "Error"}
          message={error?.message || "An error occurred"}
          onClose={() => setError(null)}
        />

        {selectedRoute && (
          <RouteDetailsView
            isOpen={isRouteDetailsOpen}
            onClose={() => setIsRouteDetailsOpen(false)}
            originalRoute={selectedRoute}
          />
        )}
      </div>
    </div>
  );
};

export default Index;