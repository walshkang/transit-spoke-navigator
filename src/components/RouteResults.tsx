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
    <div className="mt-6 md:mt-8 space-y-6 md:space-y-8">
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl lg:text-2xl font-medium text-foreground">
          Routes to {selectedResult.name}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">{selectedResult.address}</p>
      </div>
      
      <div className="space-y-4 md:space-y-5">
        {routes.map((route, index) => (
          <div key={index} className="border-b pb-4 md:pb-5 last:border-b-0">
            <h3 className="text-md md:text-lg font-medium text-foreground mb-2 md:mb-3">
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