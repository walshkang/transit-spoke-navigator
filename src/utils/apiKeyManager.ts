// Client-side API key management
const STORAGE_KEYS = {
  GOOGLE_MAPS: 'google_maps_api_key',
  AI_API: 'ai_api_key',
  AI_PROVIDER: 'ai_provider' // 'openai' or 'gemini'
} as const;

export const apiKeyManager = {
  // Google Maps
  getGoogleMapsKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_MAPS);
  },
  
  setGoogleMapsKey(key: string): void {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_MAPS, key);
  },
  
  // AI Provider
  getAIProvider(): 'openai' | 'gemini' {
    return (localStorage.getItem(STORAGE_KEYS.AI_PROVIDER) as 'openai' | 'gemini') || 'gemini';
  },
  
  setAIProvider(provider: 'openai' | 'gemini'): void {
    localStorage.setItem(STORAGE_KEYS.AI_PROVIDER, provider);
  },
  
  // AI API Key
  getAIKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AI_API);
  },
  
  setAIKey(key: string): void {
    localStorage.setItem(STORAGE_KEYS.AI_API, key);
  },
  
  // Clear all
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};
