import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  showReset: boolean;
  onReset: () => void;
}

const SearchBar = ({ 
  placeholder, 
  value, 
  onChange, 
  onSearch,
  showReset,
  onReset
}: SearchBarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <form 
      className="relative flex gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-12 py-6 glass rounded-2xl text-base shadow-aero transition-aero focus:shadow-glow focus:scale-[1.02]"
        />
        {showReset && (
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
        className="px-6 py-6 rounded-2xl shadow-aero glossy hover:shadow-glow transition-aero"
      >
        Search
      </Button>
    </form>
  );
};

export default SearchBar;