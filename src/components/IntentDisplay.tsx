import { Target, Leaf, Shield, Zap, Palette, X } from "lucide-react";
import { GlossyCard } from "./ui/glossy-card";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface RouteIntent {
  destination: string;
  preferences: {
    priority: "scenic" | "safe" | "speed" | "adventure" | "balanced";
    secondary?: "scenic" | "safe" | "speed" | "adventure" | "balanced" | null;
  };
  constraints: {
    maxDuration?: number | null;
    avoidHighways?: boolean;
    preferParks?: boolean;
    preferProtectedLanes?: boolean;
  };
  confidence: number;
}

interface IntentDisplayProps {
  intent: RouteIntent;
  onDismiss?: () => void;
}

const PRIORITY_CONFIG = {
  scenic: { 
    icon: Leaf, 
    label: "Scenic", 
    color: "text-green-600 dark:text-green-400",
    tooltip: "Prioritizes routes through parks, waterfronts, and scenic areas"
  },
  safe: { 
    icon: Shield, 
    label: "Safe", 
    color: "text-blue-600 dark:text-blue-400",
    tooltip: "Maximizes protected bike lanes and avoids busy intersections"
  },
  speed: { 
    icon: Zap, 
    label: "Fast", 
    color: "text-orange-600 dark:text-orange-400",
    tooltip: "Minimizes total travel time regardless of route conditions"
  },
  adventure: { 
    icon: Palette, 
    label: "Adventure", 
    color: "text-purple-600 dark:text-purple-400",
    tooltip: "Mix of hidden gems, tourist spots, and interesting detours"
  },
  balanced: { 
    icon: Target, 
    label: "Balanced", 
    color: "text-gray-600 dark:text-gray-400",
    tooltip: "Optimizes for a mix of time, safety, and scenery"
  },
};

const IntentDisplay = ({ intent, onDismiss }: IntentDisplayProps) => {
  const PriorityIcon = PRIORITY_CONFIG[intent.preferences.priority].icon;
  const SecondaryIcon = intent.preferences.secondary 
    ? PRIORITY_CONFIG[intent.preferences.secondary].icon 
    : null;

  const activeConstraints = Object.entries(intent.constraints)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  return (
    <TooltipProvider>
      <GlossyCard className="p-4 space-y-3 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">AI understood:</p>
              <p className="text-lg font-semibold text-foreground">{intent.destination}</p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className={`flex items-center gap-1.5 ${PRIORITY_CONFIG[intent.preferences.priority].color} cursor-help`}
              >
                <PriorityIcon className="h-3.5 w-3.5" />
                {PRIORITY_CONFIG[intent.preferences.priority].label} Priority
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">{PRIORITY_CONFIG[intent.preferences.priority].tooltip}</p>
            </TooltipContent>
          </Tooltip>

          {intent.preferences.secondary && SecondaryIcon && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline"
                  className={`flex items-center gap-1.5 ${PRIORITY_CONFIG[intent.preferences.secondary].color} cursor-help`}
                >
                  <SecondaryIcon className="h-3.5 w-3.5" />
                  {PRIORITY_CONFIG[intent.preferences.secondary].label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">{PRIORITY_CONFIG[intent.preferences.secondary].tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {intent.constraints.maxDuration && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-muted-foreground cursor-help">
                  ⏱️ Max {intent.constraints.maxDuration} min
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Routes will not exceed {intent.constraints.maxDuration} minutes</p>
              </TooltipContent>
            </Tooltip>
          )}

        {activeConstraints.length > 0 && activeConstraints.map(constraint => (
          <Tooltip key={constraint}>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-muted-foreground text-xs cursor-help">
                {constraint === 'avoidHighways' && '🚫 No highways'}
                {constraint === 'preferParks' && '🌳 Prefer parks'}
                {constraint === 'preferProtectedLanes' && '🛡️ Protected lanes'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {constraint === 'avoidHighways' && 'Routes avoid major highways and busy roads'}
                {constraint === 'preferParks' && 'Routes prioritize paths through parks when possible'}
                {constraint === 'preferProtectedLanes' && 'Routes use protected bike lanes when available'}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${intent.confidence * 100}%` }}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-medium cursor-help">{Math.round(intent.confidence * 100)}%</span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">AI confidence in understanding your query</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </GlossyCard>
  </TooltipProvider>
  );
};

export default IntentDisplay;
