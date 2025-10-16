import { Loader2 } from "lucide-react";
import { SearchResult } from "@/types/location";
import { Button } from "@/components/ui/button";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  currentSelection?: SearchResult | null;
  onResultSelect: (result: SearchResult) => void;
  onNewSearch: () => void;
  title?: string;
}

const SearchResults = ({ 
  results, 
  isLoading, 
  onResultSelect,
  currentSelection,
  onNewSearch,
  title
}: SearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center mt-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground px-1">{title}</h3>
      )}
      {results.map((result) => (
        <div
          key={result.id}
          className={`glass p-5 rounded-2xl space-y-2 cursor-pointer transition-aero hover:shadow-glow hover:scale-[1.02] ${
            currentSelection?.id === result.id ? 'ring-2 ring-primary shadow-glow' : 'shadow-aero'
          }`}
          onClick={() => onResultSelect(result)}
        >
          <h3 className="font-semibold text-lg">{result.name}</h3>
          <p className="text-muted-foreground text-sm">{result.address}</p>
          {result.distance !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              <p className="text-accent text-sm font-medium">
                {result.distance} km away
              </p>
            </div>
          )}
        </div>
      ))}
      
      {results.length > 0 && (
        <div className="pt-6">
          <Button
            variant="ghost"
            className="w-full rounded-xl py-6 hover:bg-primary/10 hover:text-primary transition-aero"
            onClick={onNewSearch}
          >
            Start New Search
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;