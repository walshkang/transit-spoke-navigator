import { useEffect, useState } from "react";
import { GlossyCard } from "@/components/ui/glossy-card";
import { ChevronDown, ChevronUp, Lightbulb, Link as LinkIcon } from "lucide-react";
import AIKeyDialog from "@/components/AIKeyDialog";
import { getSuggestionReasoning } from "@/utils/aiService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import MapsContextWidget from "@/components/MapsContextWidget";

interface SuggestionReasoningPanelProps {
  suggestions: Array<{ name: string; placeId?: string }>;
  origin?: { lat: number; lng: number } | null;
  onApplyReasons: (reasonsById: Record<string, string>, reasonsByName: Record<string, string>) => void;
}

export default function SuggestionReasoningPanel({ suggestions, origin, onApplyReasons }: SuggestionReasoningPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsAIKey, setNeedsAIKey] = useState(false);
  const [summary, setSummary] = useState<string | undefined>(undefined);
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [groundingRaw, setGroundingRaw] = useState<any>(null);
  const [showAllSources, setShowAllSources] = useState(false);
  const [widgetToken, setWidgetToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isExpanded && !hasFetched && !isLoading) {
      void fetchReasoning();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const fetchReasoning = async () => {
    setIsLoading(true);
    try {
      const res = await getSuggestionReasoning(
        suggestions,
        origin ? { latitude: origin.lat, longitude: origin.lng } : undefined
      );
      setSummary(res.summary);
      setSources(res.sources);
      setGroundingRaw(res.groundingRaw ?? null);
      setWidgetToken(res.widgetToken);
      onApplyReasons(res.reasonsById, res.reasonsByName);
      setHasFetched(true);
    } catch (error: any) {
      if (error?.message === 'AI_KEY_REQUIRED' || error?.message === 'AI_PROVIDER_NOT_GEMINI') {
        setNeedsAIKey(true);
        return;
      }
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to load reasoning.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIKeySuccess = () => {
    setNeedsAIKey(false);
    void fetchReasoning();
  };

  return (
    <>
      <AIKeyDialog
        isOpen={needsAIKey}
        onClose={() => setNeedsAIKey(false)}
        onSuccess={handleAIKeySuccess}
      />

      <GlossyCard className="overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Why these suggestions?</h3>
              <p className="text-xs text-muted-foreground">AI-backed reasoning from Google Maps grounding</p>
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
                <Skeleton className="h-5 w-1/3" />
              </div>
            ) : (
              <>
                <div className="text-sm text-foreground leading-relaxed p-3 bg-primary/5 rounded-xl">
                  {summary || 'Suggested based on proximity to your start and relevance to your query.'}
                </div>
                {sources.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Sources</h4>
                    <ul className="space-y-1">
                      {(showAllSources ? sources : sources.slice(0, 3)).map((s, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                          <LinkIcon className="h-3.5 w-3.5 text-primary" />
                          <a
                            href={s.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2 hover:text-foreground"
                          >
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                    {sources.length > 3 && (
                      <button
                        type="button"
                        className="mt-1 text-xs text-ios-blue underline hover:opacity-80"
                        onClick={() => setShowAllSources(!showAllSources)}
                      >
                        {showAllSources ? 'Show fewer' : `Show all ${sources.length}`}
                      </button>
                    )}
                  </div>
                )}

                {widgetToken && (
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-foreground mb-1">Google Maps Widget Context</h4>
                    <MapsContextWidget token={widgetToken} />
                  </div>
                )}

                {groundingRaw && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-xs text-ios-blue underline hover:opacity-80"
                    >
                      {showDetails ? 'Hide technical details' : 'Show technical details'}
                    </button>
                    {showDetails && (
                      <div className="mt-2 p-3 bg-muted/40 rounded-md overflow-auto max-h-72">
                        <pre className="text-[11px] leading-snug whitespace-pre-wrap break-words">
                          {(() => {
                            try {
                              return JSON.stringify(groundingRaw, null, 2);
                            } catch {
                              return String(groundingRaw);
                            }
                          })()}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </GlossyCard>
    </>
  );
}
