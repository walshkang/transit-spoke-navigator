import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Route } from "@/types/route";
import RouteMap from "./RouteMap";
import StepDetails from "./StepDetails";

interface RouteDetailsViewProps {
  isOpen: boolean;
  onClose: () => void;
  originalRoute: Route;
}

const RouteDetailsView = ({ isOpen, onClose, originalRoute }: RouteDetailsViewProps) => {
  const [activeTab, setActiveTab] = useState("biking");
  const [showBikingMap, setShowBikingMap] = useState(false);
  const [showTransitMap, setShowTransitMap] = useState(false);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [enhancedRenderer, setEnhancedRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (directionsRenderer) directionsRenderer.setMap(null);
      if (enhancedRenderer) enhancedRenderer.setMap(null);
      setShowBikingMap(false);
      setShowTransitMap(false);
    }
  }, [isOpen, directionsRenderer, enhancedRenderer]);

  const handleBikingMapLoad = useCallback((map: google.maps.Map) => {
    const renderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      preserveViewport: false,
    });
    setDirectionsRenderer(renderer);
  }, []);

  const handleTransitMapLoad = useCallback((map: google.maps.Map) => {
    const renderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      preserveViewport: false,
    });
    setEnhancedRenderer(renderer);
  }, []);

  useEffect(() => {
    if (!originalRoute.directions) return;

    const directionsService = new window.google.maps.DirectionsService();

    if (showBikingMap && directionsRenderer && originalRoute.directions.cycling.length > 0) {
      const cyclingSteps = originalRoute.directions.cycling;
      const origin = cyclingSteps[0].start_location;

      if (origin) {
        directionsService.route(
          {
            origin,
            destination: originalRoute.transitStartLocation,
            travelMode: google.maps.TravelMode.BICYCLING,
          },
          (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
            }
          }
        );
      }
    }

    if (showTransitMap && enhancedRenderer && originalRoute.directions.transit.length > 0) {
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
              enhancedRenderer.setDirections(result);
            }
          }
        );
      }
    }
  }, [showBikingMap, showTransitMap, directionsRenderer, enhancedRenderer, originalRoute]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetTitle className="text-lg font-semibold mb-4">Route Details</SheetTitle>
        <div className="h-full flex flex-col">
          {originalRoute.bikeMinutes > 0 ? (
            <Tabs defaultValue="biking" className="flex-1" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="biking">Biking Leg</TabsTrigger>
                <TabsTrigger value="transit">Transit Leg</TabsTrigger>
              </TabsList>
              
              <TabsContent value="biking">
                {!showBikingMap && (
                  <button 
                    onClick={() => setShowBikingMap(true)} 
                    className="mb-4 p-2 bg-blue-500 text-white rounded"
                  >
                    Show Map
                  </button>
                )}
                {showBikingMap && (
                  <RouteMap 
                    isVisible={showBikingMap} 
                    onMapLoad={handleBikingMapLoad} 
                  />
                )}
                <div className="flex items-center justify-center space-x-2 p-4 border-t border-b">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="text-lg font-medium">
                    {originalRoute.bikeMinutes} minutes
                  </span>
                </div>
                <div className="mt-4 divide-y overflow-y-auto max-h-[300px]">
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left font-medium">
                      Step by Step Directions
                    </CollapsibleTrigger>
                    <CollapsibleContent className="bg-gray-50 rounded-md">
                      {originalRoute.directions.cycling.map((step, index) => (
                        <StepDetails key={index} step={step} />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </TabsContent>
              
              <TabsContent value="transit">
                {!showTransitMap && (
                  <button 
                    onClick={() => setShowTransitMap(true)} 
                    className="mb-4 p-2 bg-blue-500 text-white rounded"
                  >
                    Show Map
                  </button>
                )}
                {showTransitMap && (
                  <RouteMap 
                    isVisible={showTransitMap} 
                    onMapLoad={handleTransitMapLoad} 
                  />
                )}
                <div className="flex items-center justify-center space-x-2 p-4 border-t border-b">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="text-lg font-medium">
                    {originalRoute.subwayMinutes} minutes
                  </span>
                </div>
                <div className="mt-4 divide-y overflow-y-auto max-h-[300px]">
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left font-medium">
                      Step by Step Directions
                    </CollapsibleTrigger>
                    <CollapsibleContent className="bg-gray-50 rounded-md">
                      {originalRoute.directions.transit.map((step, index) => (
                        <StepDetails key={index} step={step} />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex-1">
              {!showTransitMap && (
                <button 
                  onClick={() => setShowTransitMap(true)} 
                  className="mb-4 p-2 bg-blue-500 text-white rounded"
                >
                  Show Map
                </button>
              )}
              {showTransitMap && (
                <RouteMap 
                  isVisible={showTransitMap} 
                  onMapLoad={handleTransitMapLoad} 
                />
              )}
              <div className="flex items-center justify-center space-x-2 p-4 border-t border-b">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-medium">
                  {originalRoute.duration} minutes
                </span>
              </div>
              <div className="mt-4 divide-y overflow-y-auto max-h-[300px]">
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left font-medium">
                    Step by Step Directions
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-gray-50 rounded-md">
                    {originalRoute.directions.transit.map((step, index) => (
                      <StepDetails key={index} step={step} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RouteDetailsView;