import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

const SearchBar = ({ placeholder, value, onChange, onSearch }: SearchBarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <form 
      className="relative flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ios-gray h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 py-3 rounded-ios border-ios-border bg-ios-card text-base"
        />
      </div>
      <Button 
        type="submit"
        className="bg-ios-blue hover:bg-ios-blue/90"
      >
        Search
      </Button>
    </form>
  );
};

export default SearchBar;