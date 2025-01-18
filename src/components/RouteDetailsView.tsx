import { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

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

  // Cleanup effect to remove map instances when the sheet is closed
  useEffect(() => {
    if (!isOpen || !originalRoute || !window.google) {
      console.log('Conditions not met:', { isOpen, hasRoute: !!originalRoute, hasGoogle: !!window.google });
      return;
    }

    // Cleanup previous instances
    return () => {
      if (directionsRenderer) directionsRenderer.setMap(null);
      if (enhancedRenderer) enhancedRenderer.setMap(null);
      setOriginalMap(null);
      setEnhancedMap(null);
    };
  }, [isOpen]);

  // Effect to initialize maps when the sheet is opened and maps are shown
  useEffect(() => {
    if (!isOpen || !originalRoute || !window.google || (!showOriginalMap && !showEnhancedMap)) return;

    console.log('Initializing maps with route:', originalRoute);

    // Initialize original map
    if (showOriginalMap && originalMapRef.current && !originalMap) {
      console.log('Creating original map');
      const map = new window.google.maps.Map(originalMapRef.current, {
        zoom: 12,
        center: { lat: 40.7128, lng: -74.0060 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
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
      console.log('Creating enhanced map');
      const map = new window.google.maps.Map(enhancedMapRef.current, {
        zoom: 12,
        center: { lat: 40.7128, lng: -74.0060 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      setEnhancedMap(map);

      const renderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        preserveViewport: false,
      });
      setEnhancedRenderer(renderer);
    }
  }, [isOpen, originalRoute, showOriginalMap, showEnhancedMap]);

  // Effect to draw routes on the maps
  useEffect(() => {
    if (!originalMap || !enhancedMap || !directionsRenderer || !enhancedRenderer || !originalRoute.directions) {
      console.log('Missing required elements for route rendering');
      return;
    }

    console.log('Drawing routes');

    const directionsService = new window.google.maps.DirectionsService();
    
    // Draw original route
    if (showOriginalMap && originalRoute.directions.transit.length > 0) {
      const origin = originalRoute.directions.transit[0].start_location;
      const destination = originalRoute.directions.transit[originalRoute.directions.transit.length - 1].end_location;
      
      console.log('Route endpoints:', { origin, destination });

      if (origin && destination) {
        directionsService.route(
          {
            origin: origin,
            destination: destination,
            travelMode: window.google.maps.TravelMode.TRANSIT,
          },
          (result, status) => {
            console.log('Transit route result:', { status, result });
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

    // Draw enhanced route
    if (showEnhancedMap && originalRoute.transitStartLocation && originalRoute.directions.cycling.length > 0) {
      const origin = originalRoute.directions.cycling[0].start_location;
      
      if (origin) {
        directionsService.route(
          {
            origin: origin,
            destination: originalRoute.transitStartLocation,
            travelMode: window.google.maps.TravelMode.BICYCLING,
          },
          (result, status) => {
            console.log('Cycling route result:', { status, result });
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
  }, [originalMap, enhancedMap, directionsRenderer, enhancedRenderer, originalRoute, showOriginalMap, showEnhancedMap]);

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
              <div className="flex items-center justify-center space-x-2 p-4 border-t">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-medium">
                  {originalRoute.duration} minutes
                </span>
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
              <div className="flex items-center justify-center space-x-2 p-4 border-t">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-medium">
                  {enhancedDuration} minutes
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RouteDetailsView;