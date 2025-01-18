import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import ErrorAlert from "@/components/ErrorAlert";
import RouteCard from "@/components/RouteCard";
import { getCurrentPosition } from "@/utils/location";
import { calculateDistance } from "@/utils/location";
import { SearchResult, LocationError } from "@/types/location";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    google: typeof google;
  }
}

interface Route {
  duration: number;
  bikeMinutes: number;
  subwayMinutes: number;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getLocation();
  }, []);

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

  const calculateRoutes = async (destination: SearchResult) => {
    if (!currentLocation) {
      toast({
        title: "Error",
        description: "Current location is not available",
        variant: "destructive",
      });
      return;
    }

    setIsCalculatingRoute(true);
    
    try {
      const directionsService = new window.google.maps.DirectionsService();
      
      // Calculate transit route
      const transitRequest = {
        origin: new window.google.maps.LatLng(
          currentLocation.latitude,
          currentLocation.longitude
        ),
        destination: new window.google.maps.LatLng(
          destination.location.lat,
          destination.location.lng
        ),
        travelMode: window.google.maps.TravelMode.TRANSIT,
      };

      // Calculate cycling route
      const cyclingRequest = {
        origin: new window.google.maps.LatLng(
          currentLocation.latitude,
          currentLocation.longitude
        ),
        destination: new window.google.maps.LatLng(
          destination.location.lat,
          destination.location.lng
        ),
        travelMode: window.google.maps.TravelMode.BICYCLING,
      };

      const [transitResponse, cyclingResponse] = await Promise.all([
        new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(transitRequest, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              resolve(result);
            } else {
              reject(status);
            }
          });
        }),
        new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(cyclingRequest, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              resolve(result);
            } else {
              reject(status);
            }
          });
        }),
      ]);

      const route: Route = {
        duration: Math.round(
          (transitResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        bikeMinutes: Math.round(
          (cyclingResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
        subwayMinutes: Math.round(
          (transitResponse.routes[0].legs[0].duration?.value || 0) / 60
        ),
      };

      setRoutes([route]);
      setSelectedResult(destination);
      setIsCalculatingRoute(false);
    } catch (error) {
      console.error("Route calculation error:", error);
      toast({
        title: "Error",
        description: "Failed to calculate routes",
        variant: "destructive",
      });
      setIsCalculatingRoute(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
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
        />

        {isLoading || isCalculatingRoute ? (
          <div className="flex justify-center mt-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : selectedResult && routes.length > 0 ? (
          <div className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900">Routes to {selectedResult.name}</h2>
              <p className="text-sm text-gray-500">{selectedResult.address}</p>
            </div>
            {routes.map((route, index) => (
              <RouteCard
                key={index}
                duration={route.duration}
                bikeMinutes={route.bikeMinutes}
                subwayMinutes={route.subwayMinutes}
                onClick={() => {
                  // Handle route selection
                  console.log("Selected route:", route);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-lg shadow-sm p-4 space-y-2 cursor-pointer hover:bg-gray-50"
                onClick={() => calculateRoutes(result)}
              >
                <h3 className="font-medium text-gray-900">{result.name}</h3>
                <p className="text-gray-500 text-sm">{result.address}</p>
                {result.distance !== undefined && (
                  <p className="text-gray-400 text-sm">
                    {result.distance} km away
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <ErrorAlert
          isOpen={error !== null}
          title={error?.title || "Error"}
          message={error?.message || "An error occurred"}
          onClose={() => setError(null)}
        />
      </div>
    </div>
  );
};

export default Index;