import { Target, Leaf, Shield, Zap, Palette, X } from "lucide-react";
import { GlossyCard } from "./ui/glossy-card";
import { Badge } from "./ui/badge";

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
  scenic: { icon: Leaf, label: "Scenic", color: "text-green-600 dark:text-green-400" },
  safe: { icon: Shield, label: "Safe", color: "text-blue-600 dark:text-blue-400" },
  speed: { icon: Zap, label: "Fast", color: "text-orange-600 dark:text-orange-400" },
  adventure: { icon: Palette, label: "Adventure", color: "text-purple-600 dark:text-purple-400" },
  balanced: { icon: Target, label: "Balanced", color: "text-gray-600 dark:text-gray-400" },
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
        <Badge 
          variant="secondary" 
          className={`flex items-center gap-1.5 ${PRIORITY_CONFIG[intent.preferences.priority].color}`}
        >
          <PriorityIcon className="h-3.5 w-3.5" />
          {PRIORITY_CONFIG[intent.preferences.priority].label} Priority
        </Badge>

        {intent.preferences.secondary && SecondaryIcon && (
          <Badge 
            variant="outline"
            className={`flex items-center gap-1.5 ${PRIORITY_CONFIG[intent.preferences.secondary].color}`}
          >
            <SecondaryIcon className="h-3.5 w-3.5" />
            {PRIORITY_CONFIG[intent.preferences.secondary].label}
          </Badge>
        )}

        {intent.constraints.maxDuration && (
          <Badge variant="outline" className="text-muted-foreground">
            ⏱️ Max {intent.constraints.maxDuration} min
          </Badge>
        )}

        {activeConstraints.length > 0 && activeConstraints.map(constraint => (
          <Badge key={constraint} variant="outline" className="text-muted-foreground text-xs">
            {constraint === 'avoidHighways' && '🚫 No highways'}
            {constraint === 'preferParks' && '🌳 Prefer parks'}
            {constraint === 'preferProtectedLanes' && '🛡️ Protected lanes'}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${intent.confidence * 100}%` }}
          />
        </div>
        <span className="font-medium">{Math.round(intent.confidence * 100)}%</span>
      </div>
    </GlossyCard>
  );
};

export default IntentDisplay;
