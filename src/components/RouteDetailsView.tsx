import { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface RouteDetailsViewProps {
  isOpen: boolean;
  onClose: () => void;
  originalRoute: {
    duration: number;
    bikeMinutes: number;
    subwayMinutes: number;
    transitStartLocation?: google.maps.LatLng;
  };
}

const RouteDetailsView = ({ isOpen, onClose, originalRoute }: RouteDetailsViewProps) => {
  const [activeTab, setActiveTab] = useState("original");
  const originalMapRef = useRef<HTMLDivElement>(null);
  const enhancedMapRef = useRef<HTMLDivElement>(null);
  const [originalMap, setOriginalMap] = useState<google.maps.Map | null>(null);
  const [enhancedMap, setEnhancedMap] = useState<google.maps.Map | null>(null);

  const enhancedDuration = originalRoute.bikeMinutes + 
    (originalRoute.subwayMinutes - (originalRoute?.transitStartLocation ? 5 : 0));

  useEffect(() => {
    if (!isOpen) return;

    // Initialize maps when sheet is opened
    if (originalMapRef.current && !originalMap) {
      const map = new google.maps.Map(originalMapRef.current, {
        zoom: 12,
        center: { lat: 40.7128, lng: -74.0060 }, // NYC default center
        mapTypeControl: false,
      });
      setOriginalMap(map);
    }

    if (enhancedMapRef.current && !enhancedMap) {
      const map = new google.maps.Map(enhancedMapRef.current, {
        zoom: 12,
        center: { lat: 40.7128, lng: -74.0060 }, // NYC default center
        mapTypeControl: false,
      });
      setEnhancedMap(map);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetTitle className="text-lg font-semibold mb-4">Route Details</SheetTitle>
        <div className="h-full flex flex-col">
          <Tabs defaultValue="original" className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="original">Original</TabsTrigger>
              <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="original" className="flex-1">
              <div 
                ref={originalMapRef}
                className="h-[calc(100vh-200px)] bg-gray-100 rounded-md mb-4"
              />
              <div className="flex items-center justify-center space-x-2 p-4 border-t">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-medium">
                  {originalRoute.duration} minutes
                </span>
              </div>
            </TabsContent>
            
            <TabsContent value="enhanced" className="flex-1">
              <div 
                ref={enhancedMapRef}
                className="h-[calc(100vh-200px)] bg-gray-100 rounded-md mb-4"
              />
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