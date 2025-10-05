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
      className="flex items-start space-x-3 p-4 hover:bg-muted/30 transition-aero"
      role="listitem"
      aria-label={`${step.mode} direction step`}
    >
      <div className="flex-shrink-0 mt-1 text-muted-foreground">
        {getTravelModeIcon(step.mode)}
      </div>
      <div className="flex-grow min-w-0">
        <p 
          className="font-medium text-sm text-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizedInstructions }}
        />
        {step.distance && step.duration && (
          <p className="text-sm text-muted-foreground mt-1">
            {step.distance} • {step.duration}
          </p>
        )}
        {step.transit && (
          <div className="mt-2 space-y-2">
            <p className="text-sm font-medium text-foreground">
              {step.transit.line?.name || step.transit.line?.short_name}
            </p>
            <div className="flex flex-wrap gap-2">
              {step.transit.departure_stop?.name && (
                <Badge variant="outline" className="text-xs">
                  From: {step.transit.departure_stop.name}
                </Badge>
              )}
              {step.transit.arrival_stop?.name && (
                <Badge variant="outline" className="text-xs">
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