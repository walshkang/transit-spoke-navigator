import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, LocateFixed, Search } from "lucide-react";
import type { ReactNode } from "react";

interface OriginDestinationFormProps {
  // From (origin)
  fromQuery: string;
  onChangeFrom: (value: string) => void;
  onSearchFrom: () => void;
  onUseMyLocation: () => void;
  onResetFrom?: () => void;

  // Area to display origin results/current location above destination input
  fromResultsArea?: ReactNode;

  // To (destination) - wired to existing SearchBar-like behavior
  toQuery: string;
  onChangeTo: (value: string) => void;
  onSearchTo: () => void;
  onResetTo?: () => void;

  // Natural language toggle for destination (optional)
  naturalLanguageMode?: boolean;
  onToggleNaturalLanguage?: () => void;
  isParsingIntent?: boolean;
}

const OriginDestinationForm = ({
  fromQuery,
  onChangeFrom,
  onSearchFrom,
  onUseMyLocation,
  onResetFrom,
  toQuery,
  onChangeTo,
  onSearchTo,
  onResetTo,
  fromResultsArea,
  naturalLanguageMode = false,
  onToggleNaturalLanguage,
  isParsingIntent = false,
}: OriginDestinationFormProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted-foreground">From</label>
          {onToggleNaturalLanguage && (
            <button
              type="button"
              onClick={onToggleNaturalLanguage}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Sparkles className={`h-4 w-4 transition-colors ${naturalLanguageMode ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>Natural Language</span>
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Choose a start location"
              value={fromQuery}
              onChange={(e) => onChangeFrom(e.target.value)}
              className="pl-4 pr-12 py-7 glass rounded-2xl text-lg shadow-aero"
            />
            {onResetFrom && fromQuery && (
              <button
                type="button"
                onClick={onResetFrom}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"
              >
                Clear
              </button>
            )}
          </div>
          <Button
            type="button"
            onClick={onSearchFrom}
            aria-label="Search start"
            className="px-6 py-6 rounded-2xl shadow-aero glossy hover:shadow-glow"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
        <div>
          <Button
            type="button"
            onClick={onUseMyLocation}
            variant="secondary"
            className="mt-3 px-4 py-6 rounded-2xl shadow-aero"
          >
            <LocateFixed className="h-4 w-4 mr-2" /> Use my location
          </Button>
        </div>
        {/* Origin results / current location list area */}
        {fromResultsArea}
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">To</label>
        <form
          className="relative flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchTo();
          }}
        >
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder={naturalLanguageMode ? 'Try "Get me to Central Park safely"' : 'Where to?'}
              value={toQuery}
              onChange={(e) => onChangeTo(e.target.value)}
              disabled={isParsingIntent}
              className={`pl-4 pr-12 py-6 glass rounded-2xl text-base shadow-aero ${naturalLanguageMode ? 'border-primary/30' : ''}`}
            />
            {onResetTo && toQuery && !isParsingIntent && (
              <button
                type="button"
                onClick={onResetTo}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"
              >
                Clear
              </button>
            )}
          </div>
          <Button 
            type="submit"
            disabled={isParsingIntent}
            aria-label="Search destination"
            className="px-6 py-6 rounded-2xl shadow-aero glossy hover:shadow-glow"
          >
            {isParsingIntent ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default OriginDestinationForm;


