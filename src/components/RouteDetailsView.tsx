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
  const [activeTab, setActiveTab] = useState("original");
  const [showOriginalMap, setShowOriginalMap] = useState(false);
  const [showEnhancedMap, setShowEnhancedMap] = useState(false);
  const originalMapRef = useRef<HTMLDivElement>(null);
  const enhancedMapRef = useRef<HTMLDivElement>(null);
  const [originalMap, setOriginalMap] = useState<google.maps.Map | null>(null);
  const [enhancedMap, setEnhancedMap] = useState<google.maps.Map | null>(null);
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
      setOriginalMap(null);
      setEnhancedMap(null);
      setShowOriginalMap(false);
      setShowEnhancedMap(false);
    }
  }, [isOpen]);

  // Effect to initialize maps when shown
  useEffect(() => {
    if (!isOpen || !originalRoute || !window.google || (!showOriginalMap && !showEnhancedMap)) return;

    const initMap = (ref: HTMLDivElement) => {
      return new window.google.maps.Map(ref, {
        zoom: 12,
        center: { lat: 40.7128, lng: -74.0060 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    };

    // Initialize original map
    if (showOriginalMap && originalMapRef.current && !originalMap) {
      const map = initMap(originalMapRef.current);
      setOriginalMap(map);

      const renderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        preserveViewport: false,
      });
      setDirectionsRenderer(renderer);
    }

    // Initialize enhanced map
    if (showEnhancedMap && enhancedMapRef.current && !enhancedMap) {
      const map = initMap(enhancedMapRef.current);
      setEnhancedMap(map);

      const renderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        preserveViewport: false,
      });
      setEnhancedRenderer(renderer);
    }
  }, [isOpen, showOriginalMap, showEnhancedMap]);

  // Effect to draw routes on the maps
  useEffect(() => {
    if (!originalRoute.directions) return;

    const directionsService = new window.google.maps.DirectionsService();

    // Draw original route
    if (showOriginalMap && originalMap && directionsRenderer && originalRoute.directions.transit.length > 0) {
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
              directionsRenderer.setDirections(result);
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0].legs[0].steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
              originalMap.fitBounds(bounds);
            }
          }
        );
      }
    }

    // Draw enhanced route (cycling portion)
    if (showEnhancedMap && enhancedMap && enhancedRenderer && originalRoute.transitStartLocation) {
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
              enhancedRenderer.setDirections(result);
              const bounds = new window.google.maps.LatLngBounds();
              result.routes[0].legs[0].steps.forEach(step => {
                bounds.extend(step.start_location);
                bounds.extend(step.end_location);
              });
              enhancedMap.fitBounds(bounds);
            }
          }
        );
      }
    }
  }, [originalMap, enhancedMap, directionsRenderer, enhancedRenderer, showOriginalMap, showEnhancedMap, originalRoute]);

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
          <Tabs defaultValue="original" className="flex-1" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="original">Original</TabsTrigger>
              <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="original" className="flex-1">
              {!showOriginalMap && (
                <button onClick={() => setShowOriginalMap(true)} className="mb-4 p-2 bg-blue-500 text-white rounded">
                  Show Map
                </button>
              )}
              {showOriginalMap && (
                <div 
                  ref={originalMapRef}
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
              <div className="mt-4 divide-y">
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
            
            <TabsContent value="enhanced" className="flex-1">
              {!showEnhancedMap && (
                <button onClick={() => setShowEnhancedMap(true)} className="mb-4 p-2 bg-blue-500 text-white rounded">
                  Show Map
                </button>
              )}
              {showEnhancedMap && (
                <div 
                  ref={enhancedMapRef}
                  style={{ height: '400px', width: '100%' }}
                  className="bg-gray-100 rounded-md mb-4"
                />
              )}
              <div className="flex items-center justify-center space-x-2 p-4 border-t border-b">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-medium">
                  {enhancedDuration} minutes
                </span>
              </div>
              <div className="mt-4 divide-y">
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
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RouteDetailsView;
