import { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Footprints, Bus, TrainFront, Bike } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

// Interface for direction steps
interface DirectionStep {
  instructions: string;
  distance: string;
  duration: string;
  mode: string;
  start_location?: google.maps.LatLng;
  end_location?: google.maps.LatLng;
  transit?: {
    departure_stop?: { name: string };
    arrival_stop?: { name: string };
    line?: { name: string; short_name: string };
  };
}

// Props interface for RouteDetailsView
interface RouteDetailsViewProps {
  isOpen: boolean;
  onClose: () => void;
  originalRoute: {
    duration: number;
    bikeMinutes: number;
    subwayMinutes: number;
    transitStartLocation?: google.maps.LatLng;
    directions: {
      transit: DirectionStep[];
      cycling: DirectionStep[];
    };
  };
}

// Helper function to render the appropriate icon based on travel mode
const getTravelModeIcon = (mode: string) => {
  switch (mode.toLowerCase()) {
    case 'walking':
      return <Footprints className="h-5 w-5" />;
    case 'transit':
      return <TrainFront className="h-5 w-5" />;
    case 'bus':
      return <Bus className="h-5 w-5" />;
    case 'bicycling':
      return <Bike className="h-5 w-5" />;
    default:
      return <Footprints className="h-5 w-5" />;
  }
};

// RouteDetailsView component
const RouteDetailsView = ({ isOpen, onClose, originalRoute }: RouteDetailsViewProps) => {
  const [activeTab, setActiveTab] = useState("biking");
  const [showBikingMap, setShowBikingMap] = useState(false);
  const [showTransitMap, setShowTransitMap] = useState(false);
  const bikingMapRef = useRef<HTMLDivElement>(null);
  const transitMapRef = useRef<HTMLDivElement>(null);
  const [bikingMap, setBikingMap] = useState<google.maps.Map | null>(null);
  const [transitMap, setTransitMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [enhancedRenderer, setEnhancedRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  // Calculate enhanced route duration
  const enhancedDuration = originalRoute.bikeMinutes + 
    (originalRoute.subwayMinutes - (originalRoute?.transitStartLocation ? 5 : 0));

  // Effect to cleanup maps when sheet is closed
  useEffect(() => {
    if (!isOpen) {
      if (directionsRenderer) directionsRenderer.setMap(null);
      if (enhancedRenderer) enhancedRenderer.setMap(null);
      setBikingMap(null);
      setTransitMap(null);
      setShowBikingMap(false);
      setShowTransitMap(false);
    }
  }, [isOpen]);

  // Effect to initialize maps when shown
  useEffect(() => {
    if (!isOpen || !originalRoute || !window.google || (!showBikingMap && !showTransitMap)) return;

    const initMap = (ref: HTMLDivElement) => {
      return new window.google.maps.Map(ref, {
        zoom: 12,
        center: { lat: 40.7128, lng: -74.0060 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    };

    // Initialize biking map
    if (showBikingMap && bikingMapRef.current && !bikingMap) {
      const map = initMap(bikingMapRef.current);
      setBikingMap(map);

      const renderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        preserveViewport: false,
      });
      setDirectionsRenderer(renderer);
    }

    // Initialize transit map
    if (showTransitMap && transitMapRef.current && !transitMap) {
      const map = initMap(transitMapRef.current);
      setTransitMap(map);

      const renderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        preserveViewport: false,
      });
      setEnhancedRenderer(renderer);
    }
  }, [isOpen, showBikingMap, showTransitMap]);

  // Effect to draw routes on the maps
  useEffect(() => {
    if (!originalRoute.directions) return;

    const directionsService = new window.google.maps.DirectionsService();

    // Draw biking route
    if (showBikingMap && bikingMap && directionsRenderer && originalRoute.directions.cycling.length > 0) {
      const cyclingSteps = originalRoute.directions.cycling;
      const origin = cyclingSteps[0].start_location;

      if (origin) {
        directionsService.route(
          {
            origin: origin,
            destination: originalRoute.transitStartLocation,
            travelMode: google.maps.TravelMode.BICYCLING,
          },
          (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0].legs[0].steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
              bikingMap.fitBounds(bounds);
            }
          }
        );
      }
    }

    // Draw transit route
    if (showTransitMap && transitMap && enhancedRenderer && originalRoute.directions.transit.length > 0) {
      const transitSteps = originalRoute.directions.transit;
      const origin = transitSteps[0].start_location;
      const destination = transitSteps[transitSteps.length - 1].end_location;

      if (origin && destination) {
        directionsService.route(
          {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.TRANSIT,
          },
          (result, status) => {
            if (status === 'OK' && result) {
              enhancedRenderer.setDirections(result);
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0].legs[0].steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
              transitMap.fitBounds(bounds);
            }
          }
        );
      }
    }
  }, [bikingMap, transitMap, directionsRenderer, enhancedRenderer, showBikingMap, showTransitMap, originalRoute]);

  // Render step details
  const renderStepDetails = (step: DirectionStep) => {
    return (
      <div className="flex items-start space-x-3 p-3 border-b last:border-b-0">
        <div className="flex-shrink-0 mt-1">
          {getTravelModeIcon(step.mode)}
        </div>
        <div className="flex-grow">
          <p className="font-medium text-sm">{step.instructions}</p>
          {step.distance && step.duration && (
            <p className="text-sm text-gray-500">
              {step.distance} • {step.duration}
            </p>
          )}
          {step.transit && (
            <div className="mt-1 text-sm">
              <p className="text-gray-700">
                {step.transit.line?.name || step.transit.line?.short_name}
              </p>
              <p className="text-gray-500">
                From: {step.transit.departure_stop?.name}
              </p>
              <p className="text-gray-500">
                To: {step.transit.arrival_stop?.name}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

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
              
              <TabsContent value="biking" className="flex-1">
                {!showBikingMap && (
                  <button onClick={() => setShowBikingMap(true)} className="mb-4 p-2 bg-blue-500 text-white rounded">
                    Show Map
                  </button>
                )}
                {showBikingMap && (
                  <div 
                    ref={bikingMapRef}
                    style={{ height: '400px', width: '100%' }}
                    className="bg-gray-100 rounded-md mb-4"
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
                        <div key={index}>
                          {renderStepDetails(step)}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </TabsContent>
              
              <TabsContent value="transit" className="flex-1">
                {!showTransitMap && (
                  <button onClick={() => setShowTransitMap(true)} className="mb-4 p-2 bg-blue-500 text-white rounded">
                    Show Map
                  </button>
                )}
                {showTransitMap && (
                  <div 
                    ref={transitMapRef}
                    style={{ height: '400px', width: '100%' }}
                    className="bg-gray-100 rounded-md mb-4"
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
                        <div key={index}>
                          {renderStepDetails(step)}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex-1">
              {!showTransitMap && (
                <button onClick={() => setShowTransitMap(true)} className="mb-4 p-2 bg-blue-500 text-white rounded">
                  Show Map
                </button>
              )}
              {showTransitMap && (
                <div 
                  ref={transitMapRef}
                  style={{ height: '400px', width: '100%' }}
                  className="bg-gray-100 rounded-md mb-4"
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
                      <div key={index}>
                        {renderStepDetails(step)}
                      </div>
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
