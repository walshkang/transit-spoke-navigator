import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

  const parseIntent = async (query: string): Promise<RouteIntent | null> => {
    if (!query.trim()) {
      return null;
    }

    setIsParsingIntent(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('parse-route-intent', {
        body: { query }
      });

      if (error) {
        console.error("Error parsing intent:", error);
        toast({
          title: "AI Parse Error",
          description: "Could not understand your query. Try a simpler search.",
          variant: "destructive"
        });
        return null;
      }

      const parsedIntent = data as RouteIntent;
      setIntent(parsedIntent);
      
      console.log("Parsed intent:", parsedIntent);
      
      return parsedIntent;
    } catch (error) {
      console.error("Error calling parse-route-intent:", error);
      toast({
        title: "Error",
        description: "Failed to parse your search query.",
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
    intent
  };
};
