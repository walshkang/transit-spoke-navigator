import { useState, useEffect } from "react";
import { Clock, Bike, Train, Footprints, X, Navigation } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { GlossyCard, GlossyCardContent, GlossyCardHeader, GlossyCardTitle } from "@/components/ui/glossy-card";
import { Button } from "@/components/ui/button";
import { Route } from "@/types/route";
import RouteMap from "@/components/route-details/RouteMap";
import StepDetails from "@/components/route-details/StepDetails";

interface RouteDetailsViewProps {
  isOpen: boolean;
  onClose: () => void;
  originalRoute: Route;
}

const RouteDetailsView = ({ isOpen, onClose, originalRoute }: RouteDetailsViewProps) => {
  const [showMap, setShowMap] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShowMap(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (map && !directionsRenderer) {
      const renderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
      });
      setDirectionsRenderer(renderer);
    }

    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, [map, directionsRenderer]);

  const handleMapLoad = (loadedMap: google.maps.Map) => {
    console.log("Map loaded, initializing map instance");
    setMap(loadedMap);
  };

  // Use the sequential order if available, otherwise fall back to the old method
  const allSteps = originalRoute.allStepsInOrder || 
    (originalRoute.bikeMinutes > 0 
      ? [...originalRoute.directions.walking, ...originalRoute.directions.cycling, ...originalRoute.directions.transit]
      : originalRoute.directions.transit);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="sticky top-0 z-20 glass-strong p-4 border-b border-glass-border/30">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Navigation className="h-5 w-5 text-primary" />
            </div>
            Route Overview
          </DialogTitle>
          
          {/* Quick Stats */}
          <div className="flex gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{originalRoute.duration} min</span>
            </div>
            {originalRoute.walkingMinutes > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
                <Footprints className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{originalRoute.walkingMinutes} min</span>
              </div>
            )}
            {originalRoute.bikeMinutes > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10">
                <Bike className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">{originalRoute.bikeMinutes} min</span>
              </div>
            )}
            {originalRoute.subwayMinutes > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10">
                <Train className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{originalRoute.subwayMinutes} min</span>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Map Section */}
          {showMap && (
            <GlossyCard className="overflow-hidden">
              <div className="aspect-video w-full">
                <RouteMap 
                  isVisible={showMap} 
                  onMapLoad={handleMapLoad}
                  route={originalRoute}
                />
              </div>
            </GlossyCard>
          )}

          {/* Bike Stations */}
          {originalRoute.startStation && (
            <GlossyCard>
              <GlossyCardHeader>
                <GlossyCardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-xl bg-accent/10">
                    <Bike className="h-4 w-4 text-accent" />
                  </div>
                  Start: {originalRoute.startStation.information.name}
                </GlossyCardTitle>
              </GlossyCardHeader>
              <GlossyCardContent>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-tertiary-green" />
                    <span className="font-medium">{originalRoute.startStation.status.num_bikes_available} bikes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium">{originalRoute.startStation.status.num_docks_available} docks</span>
                  </div>
                </div>
              </GlossyCardContent>
            </GlossyCard>
          )}

          {originalRoute.endStation && (
            <GlossyCard>
              <GlossyCardHeader>
                <GlossyCardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-xl bg-accent/10">
                    <Bike className="h-4 w-4 text-accent" />
                  </div>
                  End: {originalRoute.endStation.information.name}
                </GlossyCardTitle>
              </GlossyCardHeader>
              <GlossyCardContent>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-tertiary-green" />
                    <span className="font-medium">{originalRoute.endStation.status.num_bikes_available} bikes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium">{originalRoute.endStation.status.num_docks_available} docks</span>
                  </div>
                </div>
              </GlossyCardContent>
            </GlossyCard>
          )}

          {/* Step-by-Step Directions */}
          <GlossyCard>
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/30 transition-aero rounded-xl">
                <span className="font-semibold text-base">Step-by-Step Directions</span>
                <span className="text-xs text-muted-foreground">{allSteps.length} steps</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-2 pb-2">
                <div className="space-y-1">
                  {allSteps.map((step, index) => (
                    <StepDetails 
                      key={index} 
                      step={step} 
                      showStationInfo={
                        (originalRoute.bikeMinutes > 0 && index === 0) || 
                        (originalRoute.bikeMinutes > 0 && index === originalRoute.directions.cycling.length - 1)
                      }
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </GlossyCard>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RouteDetailsView;