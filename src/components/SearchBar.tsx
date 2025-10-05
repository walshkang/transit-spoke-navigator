import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  showReset: boolean;
  onReset: () => void;
  naturalLanguageMode?: boolean;
  onToggleNaturalLanguage?: () => void;
  isParsingIntent?: boolean;
}

const SearchBar = ({ 
  placeholder, 
  value, 
  onChange, 
  onSearch,
  showReset,
  onReset,
  naturalLanguageMode = false,
  onToggleNaturalLanguage,
  isParsingIntent = false
}: SearchBarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  };

  const effectivePlaceholder = naturalLanguageMode 
    ? 'Try "Get me to Central Park safely" or "Fastest route to Brooklyn Bridge"'
    : placeholder;

  return (
    <div className="space-y-3">
      {onToggleNaturalLanguage && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onToggleNaturalLanguage}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <Sparkles className={`h-4 w-4 transition-colors ${naturalLanguageMode ? 'text-primary' : 'text-muted-foreground'}`} />
            <span>Natural Language Mode</span>
            {naturalLanguageMode && (
              <Badge variant="secondary" className="ml-1 text-xs">
                AI Enabled
              </Badge>
            )}
          </button>
        </div>
      )}
      
      <form 
        className="relative flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        <div className="relative flex-1">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 z-10 transition-colors ${
            naturalLanguageMode ? 'text-primary' : 'text-muted-foreground'
          }`} />
          <Input
            type="text"
            placeholder={effectivePlaceholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isParsingIntent}
            className={`pl-12 pr-12 py-6 glass rounded-2xl text-base shadow-aero transition-aero focus:shadow-glow focus:scale-[1.02] ${
              naturalLanguageMode ? 'border-primary/30' : ''
            }`}
          />
          {showReset && !isParsingIntent && (
            <button
              type="button"
              onClick={onReset}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full hover:bg-muted/50 transition-aero"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button 
          type="submit"
          disabled={isParsingIntent}
          className="px-6 py-6 rounded-2xl shadow-aero glossy hover:shadow-glow transition-aero"
        >
          {isParsingIntent ? (
            <>
              <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
              Analyzing...
            </>
          ) : (
            'Search'
          )}
        </Button>
      </form>
    </div>
  );
};

export default SearchBar;