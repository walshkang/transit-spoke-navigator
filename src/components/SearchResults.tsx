import { SearchResult } from "@/types/location";

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  onResultSelect: (result: SearchResult) => void;
}

const SearchResults = ({ results, isLoading, onResultSelect }: SearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center mt-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {results.map((result) => (
        <div
          key={result.id}
          className="bg-white rounded-lg shadow-sm p-4 space-y-2 cursor-pointer hover:bg-gray-50"
          onClick={() => onResultSelect(result)}
        >
          <h3 className="font-medium text-gray-900">{result.name}</h3>
          <p className="text-gray-500 text-sm">{result.address}</p>
          {result.distance !== undefined && (
            <p className="text-gray-400 text-sm">
              {result.distance} km away
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default SearchResults;