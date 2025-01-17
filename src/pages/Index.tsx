import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import RouteCard from "@/components/RouteCard";
import ErrorAlert from "@/components/ErrorAlert";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showError, setShowError] = useState(false);

  // Simulated route data
  const routes = [
    { id: 1, duration: 25, bikeMinutes: 10, subwayMinutes: 15 },
    { id: 2, duration: 30, bikeMinutes: 12, subwayMinutes: 18 },
    { id: 3, duration: 35, bikeMinutes: 15, subwayMinutes: 20 },
  ];

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
        />

        <div className="mt-6">
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              duration={route.duration}
              bikeMinutes={route.bikeMinutes}
              subwayMinutes={route.subwayMinutes}
              onClick={() => setShowError(true)}
            />
          ))}
        </div>

        <ErrorAlert
          isOpen={showError}
          title="Location Services Required"
          message="Please enable location services to use this feature."
          onClose={() => setShowError(false)}
        />
      </div>
    </div>
  );
};

export default Index;