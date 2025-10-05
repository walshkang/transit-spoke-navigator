import { apiKeyManager } from "./apiKeyManager";

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

interface RouteReasoning {
  summary: string;
  keyPoints: string[];
  tradeoffs: Array<{
    aspect: string;
    explanation: string;
  }>;
  highlights: string[];
  confidence: number;
}

async function callGemini(prompt: string, apiKey: string): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAI(prompt: string): Promise<string> {
  const apiKey = apiKeyManager.getAIKey();
  const provider = apiKeyManager.getAIProvider();

  if (!apiKey) {
    throw new Error('AI_KEY_REQUIRED');
  }

  if (provider === 'gemini') {
    return await callGemini(prompt, apiKey);
  } else {
    return await callOpenAI(prompt, apiKey);
  }
}

export async function parseRouteIntent(query: string): Promise<RouteIntent> {
  const prompt = `You are a transit route preference analyzer. Extract the destination and preferences from this query: "${query}"

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "destination": "extracted location name",
  "preferences": {
    "priority": "scenic|safe|speed|adventure|balanced",
    "secondary": "scenic|safe|speed|adventure|balanced" or null
  },
  "constraints": {
    "maxDuration": number in minutes or null,
    "avoidHighways": boolean,
    "preferParks": boolean,
    "preferProtectedLanes": boolean
  },
  "confidence": number between 0-1
}`;

  const response = await callAI(prompt);
  
  // Extract JSON from response (handle markdown code blocks)
  let jsonText = response.trim();
  if (jsonText.includes('```')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }
  
  return JSON.parse(jsonText);
}

export async function generateRouteReasoning(route: any, intent: any): Promise<RouteReasoning> {
  const prompt = `You are a transit route analyst. Analyze this route and explain why it's recommended.

Route Details:
- Total Duration: ${route.totalDuration} minutes
- Walking Time: ${route.walkingDuration} minutes
- Biking Time: ${route.bikingDuration} minutes
- Transit Time: ${route.transitDuration} minutes

User Preferences: ${JSON.stringify(intent)}

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "summary": "brief one-sentence summary",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "tradeoffs": [
    {"aspect": "time|cost|complexity", "explanation": "why this tradeoff"}
  ],
  "highlights": ["highlight 1", "highlight 2"],
  "confidence": number between 0-1
}`;

  const response = await callAI(prompt);
  
  // Extract JSON from response
  let jsonText = response.trim();
  if (jsonText.includes('```')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }
  
  return JSON.parse(jsonText);
}
