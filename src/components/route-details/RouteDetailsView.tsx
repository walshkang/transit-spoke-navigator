import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Route } from "@/types/route";
import RouteMap from "@/components/route-details/RouteMap";
import StepDetails from "@/components/route-details/StepDetails";

interface RouteDetailsViewProps {
  isOpen: boolean;
  onClose: () => void;
  originalRoute: Route;
}

const RouteDetailsView = ({ isOpen, onClose, originalRoute }: RouteDetailsViewProps) => {
  const [showMap, setShowMap] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setShowMap(false);
    }
  }, [isOpen]);

  const handleMapLoad = (loadedMap: google.maps.Map) => {
    console.log("Map loaded, initializing map instance");
    setMap(loadedMap);
  };

  // Combine cycling and transit steps for enhanced routes
  const allSteps = originalRoute.bikeMinutes > 0 
    ? [...originalRoute.directions.cycling, ...originalRoute.directions.transit]
    : originalRoute.directions.transit;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetTitle className="text-lg font-semibold mb-4">Route Details</SheetTitle>
        <div className="h-full flex flex-col">
          <div className="flex-1">
            {!showMap && (
              <button 
                onClick={() => setShowMap(true)} 
                className="mb-4 p-2 bg-blue-500 text-white rounded"
              >
                Show Map
              </button>
            )}
            {showMap && (
              <RouteMap 
                isVisible={showMap} 
                onMapLoad={handleMapLoad}
                route={originalRoute}
              />
            )}
            <div className="flex items-center justify-center space-x-2 p-4 border-t border-b">
              <Clock className="h-5 w-5 text-gray-500" />
              <span className="text-lg font-medium">
                {originalRoute.bikeMinutes > 0 
                  ? `${originalRoute.bikeMinutes + originalRoute.subwayMinutes} minutes total (${originalRoute.bikeMinutes} biking, ${originalRoute.subwayMinutes} transit)`
                  : `${originalRoute.duration} minutes`
                }
              </span>
            </div>
            <div className="mt-4 divide-y overflow-y-auto max-h-[300px]">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left font-medium">
                  Step by Step Directions
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-gray-50 rounded-md">
                  {allSteps.map((step, index) => (
                    <StepDetails key={index} step={step} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RouteDetailsView;