import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiKeyManager } from "@/utils/apiKeyManager";

interface AIKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AIKeyDialog = ({ isOpen, onClose, onSuccess }: AIKeyDialogProps) => {
  const [provider, setProvider] = useState<'openai' | 'gemini'>(apiKeyManager.getAIProvider());
  const [apiKey, setApiKey] = useState(apiKeyManager.getAIKey() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      apiKeyManager.setAIProvider(provider);
      apiKeyManager.setAIKey(apiKey.trim());
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI API Configuration</DialogTitle>
          <DialogDescription>
            Choose your AI provider and enter your API key to enable AI features.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>AI Provider</Label>
            <RadioGroup value={provider} onValueChange={(v) => setProvider(v as 'openai' | 'gemini')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gemini" id="gemini" />
                <Label htmlFor="gemini" className="cursor-pointer">Google Gemini</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="openai" id="openai" />
                <Label htmlFor="openai" className="cursor-pointer">OpenAI GPT</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {provider === 'gemini' 
                ? "Get your API key from Google AI Studio" 
                : "Get your API key from OpenAI Dashboard"}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AIKeyDialog;
