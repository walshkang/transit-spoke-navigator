import { useState, useEffect } from "react";
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

  const { 
    results, 
    isLoading, 
    searchPlaces 
  } = useGooglePlaces(currentLocation);

  const {
    routes,
    isCalculatingRoute,
    selectedResult,
    calculateRoutes
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      searchPlaces(searchQuery);
    }
  };

  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route);
    setIsRouteDetailsOpen(true);
  };

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
  };

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
          onChange={handleSearch}
          onSearch={handleSearchSubmit}
        />

        {selectedResult && routes.length > 0 ? (
          <RouteResults
            selectedResult={selectedResult}
            routes={routes}
            isCalculatingRoute={isCalculatingRoute}
            onRouteSelect={handleRouteSelect}
          />
        ) : (
          <SearchResults
            results={results}
            isLoading={isLoading}
            onResultSelect={calculateRoutes}
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