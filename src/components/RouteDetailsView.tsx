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
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      if (directionsRenderer) directionsRenderer.setMap(null);
      setShowMap(false);
    }
  }, [isOpen, directionsRenderer]);

  const handleMapLoad = (map: google.maps.Map) => {
    const renderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      preserveViewport: false,
    });
    setDirectionsRenderer(renderer);
  };

  useEffect(() => {
    if (!originalRoute.directions || !showMap || !directionsRenderer) return;

    const directionsService = new window.google.maps.DirectionsService();

    if (originalRoute.bikeMinutes > 0) {
      // For enhanced routes, use waypoints to show both legs
      const cyclingSteps = originalRoute.directions.cycling;
      const transitSteps = originalRoute.directions.transit;
      
      if (cyclingSteps[0].start_location && transitSteps[transitSteps.length - 1].end_location) {
        directionsService.route(
          {
            origin: cyclingSteps[0].start_location,
            destination: transitSteps[transitSteps.length - 1].end_location,
            waypoints: [{
              location: originalRoute.transitStartLocation!,
              stopover: true
            }],
            travelMode: google.maps.TravelMode.BICYCLING,
          },
          (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0].legs.forEach(leg => {
                leg.steps.forEach(step => {
                  bounds.extend(step.start_location);
                  bounds.extend(step.end_location);
                });
              });
              directionsRenderer.getMap()?.fitBounds(bounds);
            }
          }
        );
      }
    } else {
      // For regular transit routes
      const transitSteps = originalRoute.directions.transit;
      const origin = transitSteps[0].start_location;
      const destination = transitSteps[transitSteps.length - 1].end_location;

      if (origin && destination) {
        directionsService.route(
          {
            origin,
            destination,
            travelMode: google.maps.TravelMode.TRANSIT,
          },
          (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0].legs[0].steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
              directionsRenderer.getMap()?.fitBounds(bounds);
            }
          }
        );
      }
    }
  }, [showMap, directionsRenderer, originalRoute]);

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
