import { Footprints, Train, Bus, Bike } from "lucide-react";

export const getTravelModeIcon = (mode: string) => {
  switch (mode.toLowerCase()) {
    case 'walking':
      return <Footprints className="h-5 w-5" />;
    case 'transit':
      return <Train className="h-5 w-5" />;
    case 'bus':
      return <Bus className="h-5 w-5" />;
    case 'bicycling':
      return <Bike className="h-5 w-5" />;
    default:
      return <Footprints className="h-5 w-5" />;
  }
};