import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a transit route preference analyzer. Extract destination, preferences, and constraints from user queries.

Return ONLY valid JSON in this exact format:
{
  "destination": "location name",
  "preferences": {
    "priority": "scenic" | "safe" | "speed" | "adventure" | "balanced",
    "secondary": "scenic" | "safe" | "speed" | "adventure" | "balanced" | null
  },
  "constraints": {
    "maxDuration": number or null,
    "avoidHighways": boolean,
    "preferParks": boolean,
    "preferProtectedLanes": boolean
  },
  "confidence": number between 0 and 1
}

Priority types:
- scenic: prioritize parks, waterfronts, landmarks
- safe: maximize protected bike lanes, avoid busy intersections
- speed: minimize total time
- adventure: mix of hidden gems and tourist spots
- balanced: general optimized route

Examples:
"Get me to Central Park safely" → {"destination": "Central Park", "preferences": {"priority": "safe", "secondary": null}, "constraints": {"avoidHighways": true, "preferProtectedLanes": true}, "confidence": 0.95}
"Fastest route to Brooklyn Bridge" → {"destination": "Brooklyn Bridge", "preferences": {"priority": "speed", "secondary": null}, "constraints": {}, "confidence": 0.98}
"Scenic ride to Times Square in under 30 minutes" → {"destination": "Times Square", "preferences": {"priority": "scenic", "secondary": "speed"}, "constraints": {"maxDuration": 30, "preferParks": true}, "confidence": 0.92}`
          },
          {
            role: "user",
            content: query
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_route_intent",
              description: "Extract destination and route preferences from natural language query",
              parameters: {
                type: "object",
                properties: {
                  destination: { type: "string" },
                  preferences: {
                    type: "object",
                    properties: {
                      priority: { type: "string", enum: ["scenic", "safe", "speed", "adventure", "balanced"] },
                      secondary: { type: "string", enum: ["scenic", "safe", "speed", "adventure", "balanced"], nullable: true }
                    },
                    required: ["priority"]
                  },
                  constraints: {
                    type: "object",
                    properties: {
                      maxDuration: { type: "number", nullable: true },
                      avoidHighways: { type: "boolean" },
                      preferParks: { type: "boolean" },
                      preferProtectedLanes: { type: "boolean" }
                    }
                  },
                  confidence: { type: "number", minimum: 0, maximum: 1 }
                },
                required: ["destination", "preferences", "constraints", "confidence"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "parse_route_intent" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const intent = JSON.parse(toolCall.function.arguments);
    
    console.log("Parsed intent:", intent);

    return new Response(JSON.stringify(intent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error parsing route intent:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
