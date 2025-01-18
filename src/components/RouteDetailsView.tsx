import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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

  const enhancedDuration = originalRoute.bikeMinutes + 
    (originalRoute.subwayMinutes - (originalRoute?.transitStartLocation ? 5 : 0));

  return (
    <Sheet open={isOpen} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <div className="h-full flex flex-col">
          <Tabs defaultValue="original" className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="original">Original</TabsTrigger>
              <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="original" className="flex-1">
              <div className="h-[calc(100vh-200px)] bg-gray-100 rounded-md mb-4">
                {/* Map will go here */}
                <div className="p-4 text-center">Map View Coming Soon</div>
              </div>
              <div className="flex items-center justify-center space-x-2 p-4 border-t">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-medium">
                  {originalRoute.duration} minutes
                </span>
              </div>
            </TabsContent>
            
            <TabsContent value="enhanced" className="flex-1">
              <div className="h-[calc(100vh-200px)] bg-gray-100 rounded-md mb-4">
                {/* Enhanced route map will go here */}
                <div className="p-4 text-center">Enhanced Map View Coming Soon</div>
              </div>
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