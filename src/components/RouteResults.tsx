import RouteCard from "./RouteCard";
import { SearchResult } from "@/types/location";
import { Loader2 } from "lucide-react";

interface Route {
  duration: number;
  bikeMinutes: number;
  subwayMinutes: number;
}

interface RouteResultsProps {
  selectedResult: SearchResult;
  routes: Route[];
  isCalculatingRoute: boolean;
  onRouteSelect: (route: Route) => void;
}

const RouteResults = ({ 
  selectedResult, 
  routes, 
  isCalculatingRoute,
  onRouteSelect 
}: RouteResultsProps) => {
  if (isCalculatingRoute) {
    return (
      <div className="flex justify-center mt-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Routes to {selectedResult.name}
        </h2>
        <p className="text-sm text-gray-500">{selectedResult.address}</p>
      </div>
      
      {routes.map((route, index) => (
        <div key={index}>
          <h3 className="text-md font-medium text-gray-700 mb-2">
            {index === 0 ? "Normal Routing" : "Enhanced Routing"}
          </h3>
          <RouteCard
            duration={route.duration}
            bikeMinutes={route.bikeMinutes}
            subwayMinutes={route.subwayMinutes}
            onClick={() => onRouteSelect(route)}
          />
        </div>
      ))}
    </div>
  );
};

export default RouteResults;