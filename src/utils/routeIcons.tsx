import { Clock, Train, Bike, Footprints, Bus } from "lucide-react";

export const getTravelModeIcon = (mode: string) => {
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