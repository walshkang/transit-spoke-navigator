import { DirectionStep } from "@/types/route";
import { getTravelModeIcon } from "@/utils/routeIcons";

interface StepDetailsProps {
  step: DirectionStep;
}

const StepDetails = ({ step }: StepDetailsProps) => {
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

export default StepDetails;