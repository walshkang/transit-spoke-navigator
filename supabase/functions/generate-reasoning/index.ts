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
    const { route, intent } = await req.json();
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
            content: `You are a transit route analyst that explains routing decisions in clear, human-friendly language.

Given a route and user intent, explain:
1. Why this route was chosen based on user preferences
2. Key trade-offs made (time vs safety vs scenery)
3. Notable features along the route
4. Safety considerations

Keep explanations concise, friendly, and actionable. Use specific details from the route data.

Return ONLY valid JSON in this format:
{
  "summary": "One sentence explaining why this route matches user needs",
  "keyPoints": [
    "Specific reason 1",
    "Specific reason 2",
    "Specific reason 3"
  ],
  "tradeoffs": [
    {
      "aspect": "time|safety|scenery|complexity",
      "explanation": "What was prioritized and why"
    }
  ],
  "highlights": [
    "Notable feature 1 along the route",
    "Notable feature 2 along the route"
  ],
  "confidence": number between 0 and 1
}`
          },
          {
            role: "user",
            content: `Route Data:
- Total Duration: ${route.duration} minutes
- Walking: ${route.walkingMinutes} minutes
- Biking: ${route.bikeMinutes} minutes
- Transit: ${route.subwayMinutes} minutes
${route.startStation ? `- Start Bike Station: ${route.startStation.name}` : ''}
${route.endStation ? `- End Bike Station: ${route.endStation.name}` : ''}

User Intent:
- Destination: ${intent?.destination || 'Not specified'}
- Priority: ${intent?.preferences?.priority || 'balanced'}
${intent?.preferences?.secondary ? `- Secondary Priority: ${intent.preferences.secondary}` : ''}
${intent?.constraints?.maxDuration ? `- Max Duration: ${intent.constraints.maxDuration} minutes` : ''}
${intent?.constraints?.avoidHighways ? '- Avoid highways' : ''}
${intent?.constraints?.preferParks ? '- Prefer parks' : ''}
${intent?.constraints?.preferProtectedLanes ? '- Prefer protected bike lanes' : ''}

Generate reasoning for why this route is recommended.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_route_reasoning",
              description: "Generate human-friendly explanation for route recommendation",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  keyPoints: {
                    type: "array",
                    items: { type: "string" }
                  },
                  tradeoffs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        aspect: { type: "string", enum: ["time", "safety", "scenery", "complexity"] },
                        explanation: { type: "string" }
                      }
                    }
                  },
                  highlights: {
                    type: "array",
                    items: { type: "string" }
                  },
                  confidence: { type: "number", minimum: 0, maximum: 1 }
                },
                required: ["summary", "keyPoints", "tradeoffs", "highlights", "confidence"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_route_reasoning" } }
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
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const reasoning = JSON.parse(toolCall.function.arguments);
    
    console.log("Generated reasoning:", reasoning);

    return new Response(JSON.stringify(reasoning), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating reasoning:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
