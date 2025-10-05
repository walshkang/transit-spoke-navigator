import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { parseRouteIntent } from "@/utils/aiService";

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

export const useNaturalLanguageSearch = () => {
  const [isParsingIntent, setIsParsingIntent] = useState(false);
  const [intent, setIntent] = useState<RouteIntent | null>(null);
  const [needsAIKey, setNeedsAIKey] = useState(false);

  const parseIntent = async (query: string): Promise<RouteIntent | null> => {
    if (!query.trim()) {
      return null;
    }

    setIsParsingIntent(true);
    
    try {
      const parsedIntent = await parseRouteIntent(query);
      setIntent(parsedIntent);
      console.log("Parsed intent:", parsedIntent);
      return parsedIntent;
    } catch (error: any) {
      console.error("Error parsing intent:", error);
      
      if (error.message === 'AI_KEY_REQUIRED') {
        setNeedsAIKey(true);
        return null;
      }
      
      toast({
        title: "AI Parse Error",
        description: error.message || "Could not understand your query. Try a simpler search.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsParsingIntent(false);
    }
  };

  const clearIntent = () => {
    setIntent(null);
  };

  return {
    parseIntent,
    clearIntent,
    isParsingIntent,
    intent,
    needsAIKey,
    setNeedsAIKey
  };
};
