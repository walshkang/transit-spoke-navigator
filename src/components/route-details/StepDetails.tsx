import { DirectionStep } from "@/types/route";
import { getTravelModeIcon } from "@/utils/routeIcons";
import DOMPurify from 'dompurify';
import { Badge } from "@/components/ui/badge";

interface StepDetailsProps {
  step: DirectionStep;
  showStationInfo?: boolean;
}

const StepDetails = ({ step, showStationInfo = true }: StepDetailsProps) => {
  const sanitizedInstructions = DOMPurify.sanitize(step.instructions);

  return (
    <div 
      className="flex items-start space-x-3 p-3 border-b last:border-b-0"
      role="listitem"
      aria-label={`${step.mode} direction step`}
    >
      <div className="flex-shrink-0 mt-1">
        {getTravelModeIcon(step.mode)}
      </div>
      <div className="flex-grow">
        <p 
          className="font-medium text-sm"
          dangerouslySetInnerHTML={{ __html: sanitizedInstructions }}
        />
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
            <div className="flex flex-wrap gap-2 mt-1">
              {step.transit.departure_stop?.name && (
                <Badge variant="outline" className="text-blue-600">
                  From: {step.transit.departure_stop.name}
                </Badge>
              )}
              {step.transit.arrival_stop?.name && (
                <Badge variant="outline" className="text-blue-600">
                  To: {step.transit.arrival_stop.name}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepDetails;