import { useState, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import ErrorAlert from "@/components/ErrorAlert";
import { getCurrentPosition } from "@/utils/location";
import { calculateDistance } from "@/utils/location";
import { SearchResult, LocationError } from "@/types/location";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LocationError | null>(null);
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Initialize Google Places service
      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );

      const request = {
        query,
        location: currentLocation
          ? new google.maps.LatLng(
              currentLocation.latitude,
              currentLocation.longitude
            )
          : undefined,
        radius: 50000, // 50km radius
      };

      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
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
          setResults(formattedResults);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch search results",
            variant: "destructive",
          });
        }
        setIsLoading(false);
      });
    } catch (error) {
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

        {isLoading ? (
          <div className="flex justify-center mt-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-lg shadow-sm p-4 space-y-2 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  // Handle navigation to route calculation
                  console.log("Navigate to route calculation for:", result);
                }}
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