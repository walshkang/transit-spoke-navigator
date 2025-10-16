import RouteCard from "./RouteCard";
import { SearchResult } from "@/types/location";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Route as AppRoute } from "@/types/route";

type Route = AppRoute;

interface RouteResultsProps {
  selectedResult: SearchResult;
  routes: Route[];
  isCalculatingRoute: boolean;
  onRouteSelect: (route: Route) => void;
  onNewSearch: () => void;
}

const RouteResults = ({ 
  selectedResult, 
  routes, 
  isCalculatingRoute,
  onRouteSelect,
  onNewSearch
}: RouteResultsProps) => {
  if (isCalculatingRoute) {
    return (
      <div className="flex justify-center mt-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Routes to {selectedResult.name}
        </h2>
        <p className="text-sm text-gray-500">{selectedResult.address}</p>
      </div>
      
      <div className="space-y-4">
        {routes.map((route, index) => (
          <div key={index} className="border-b pb-4 last:border-b-0">
            <h3 className="text-md font-medium text-gray-700 mb-2">
              {route.variant === 'standard' && 'Standard Route'}
              {route.variant === 'enhanced' && 'Enhanced Route'}
              {route.variant === 'no-bus' && 'No Bus (Transit-only)'}
              {route.variant === 'no-bus-bike' && 'No Bus + Bike'}
              {!route.variant && (index === 0 ? 'Standard Route' : 'Enhanced Route')}
            </h3>
            <RouteCard
              duration={route.duration}
              bikeMinutes={route.bikeMinutes}
              subwayMinutes={route.subwayMinutes}
              walkingMinutes={route.walkingMinutes}
              isEnhanced={route.bikeMinutes > 0}
              onClick={() => onRouteSelect(route)}
            />
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full text-ios-blue hover:bg-ios-blue/10"
          onClick={onNewSearch}
        >
          Start New Search
        </Button>
      </div>
    </div>
  );
};

export default RouteResults;