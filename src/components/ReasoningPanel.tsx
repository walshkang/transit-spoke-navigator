import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lightbulb, TrendingUp, MapPin, Sparkles } from "lucide-react";
import { GlossyCard } from "./ui/glossy-card";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";

interface RouteReasoning {
  summary: string;
  keyPoints: string[];
  tradeoffs: Array<{
    aspect: "time" | "safety" | "scenery" | "complexity";
    explanation: string;
  }>;
  highlights: string[];
  confidence: number;
}

interface ReasoningPanelProps {
  route: any;
  intent?: any;
}

const ASPECT_CONFIG = {
  time: { icon: "⏱️", label: "Time Optimization" },
  safety: { icon: "🛡️", label: "Safety Priority" },
  scenery: { icon: "🌿", label: "Scenic Route" },
  complexity: { icon: "🎯", label: "Route Simplicity" }
};

const ReasoningPanel = ({ route, intent }: ReasoningPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reasoning, setReasoning] = useState<RouteReasoning | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && !reasoning && !isLoading) {
      generateReasoning();
    }
  }, [isExpanded]);

  const generateReasoning = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-reasoning', {
        body: { route, intent }
      });

      if (error) {
        console.error("Error generating reasoning:", error);
        return;
      }

      setReasoning(data as RouteReasoning);
    } catch (error) {
      console.error("Error calling generate-reasoning:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlossyCard className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Why this route?</h3>
            <p className="text-xs text-muted-foreground">AI reasoning and insights</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 animate-accordion-down">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : reasoning ? (
            <>
              {/* Summary */}
              <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">
                  {reasoning.summary}
                </p>
              </div>

              {/* Confidence */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Confidence:</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${reasoning.confidence * 100}%` }}
                  />
                </div>
                <span className="font-medium">{Math.round(reasoning.confidence * 100)}%</span>
              </div>

              {/* Key Points */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Key Factors</h4>
                </div>
                <ul className="space-y-2">
                  {reasoning.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trade-offs */}
              {reasoning.tradeoffs.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Trade-offs</h4>
                  <div className="space-y-2">
                    {reasoning.tradeoffs.map((tradeoff, index) => (
                      <div key={index} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{ASPECT_CONFIG[tradeoff.aspect].icon}</span>
                          <span className="text-xs font-medium text-foreground">
                            {ASPECT_CONFIG[tradeoff.aspect].label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">
                          {tradeoff.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {reasoning.highlights.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Route Highlights</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reasoning.highlights.map((highlight, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </GlossyCard>
  );
};

export default ReasoningPanel;
