import { Clock, Train, Bike, Footprints } from "lucide-react";

interface RouteCardProps {
  duration: number;
  bikeMinutes: number;
  subwayMinutes: number;
  walkingMinutes: number;
  onClick: () => void;
}

const RouteCard = ({ duration, bikeMinutes, subwayMinutes, walkingMinutes, onClick }: RouteCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-ios-card p-4 rounded-ios shadow-sm border border-ios-border mb-3 active:bg-gray-50 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-ios-gray" />
          <span className="font-semibold">{duration} min</span>
        </div>
      </div>
      <div className="flex space-x-4">
        {bikeMinutes > 0 && (
          <div className="flex items-center space-x-2">
            <Bike className="h-4 w-4 text-ios-blue" />
            <span className="text-sm text-ios-gray">{bikeMinutes} min</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Train className="h-4 w-4 text-ios-blue" />
          <span className="text-sm text-ios-gray">{subwayMinutes} min</span>
        </div>
        <div className="flex items-center space-x-2">
          <Footprints className="h-4 w-4 text-ios-blue" />
          <span className="text-sm text-ios-gray">{walkingMinutes} min</span>
        </div>
      </div>
    </div>
  );
};

export default RouteCard;