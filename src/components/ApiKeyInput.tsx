import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
}

const ApiKeyInput = ({ onSubmit }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow empty key to use backend fallback
    onSubmit(apiKey.trim());
  };

  return (
    <div className="min-h-screen bg-ios-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Welcome to Spoke to Subway</h1>
          <p className="text-gray-600">
            Enter your own Google Maps API key (optional)
          </p>
          <p className="text-sm text-gray-500">
            Leave blank to use the default key
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyInput;