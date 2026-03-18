import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface OutfitTaggingProps {
  currentTags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestedTags?: string[];
}

const DEFAULT_TAGS = [
  "Party",
  "Casual",
  "Work",
  "Date",
  "Gym",
  "Formal",
  "Beach",
  "Shopping",
  "Dinner",
  "Brunch",
  "Summer",
  "Winter",
  "Spring",
  "Fall",
  "Favorite",
  "To Buy",
];

export function OutfitTagging({
  currentTags,
  onTagsChange,
  suggestedTags = DEFAULT_TAGS,
}: OutfitTaggingProps) {
  const [newTag, setNewTag] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (
      trimmedTag &&
      !currentTags.includes(trimmedTag) &&
      currentTags.length < 5
    ) {
      onTagsChange([...currentTags, trimmedTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(currentTags.filter((t) => t !== tag));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(newTag);
    }
  };

  const availableSuggestions = suggestedTags.filter(
    (tag) => !currentTags.includes(tag.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Outfit Tags (up to 5)
        </label>
        <div className="flex gap-2 mb-3 flex-wrap">
          {currentTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 cursor-pointer hover:bg-secondary/80"
            >
              {tag}
              <X
                className="w-3 h-3"
                onClick={() => handleRemoveTag(tag)}
              />
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Add a tag (e.g., Party, Casual)"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            disabled={currentTags.length >= 5}
          />
          <Button
            size="sm"
            onClick={() => handleAddTag(newTag)}
            disabled={currentTags.length >= 5 || !newTag.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showSuggestions && availableSuggestions.length > 0 && (
        <div className="bg-secondary/20 p-3 rounded-lg">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Suggested Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((tag) => (
              <Button
                key={tag}
                size="sm"
                variant="outline"
                onClick={() => handleAddTag(tag)}
                disabled={currentTags.length >= 5}
                className="text-xs"
              >
                + {tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Tags help you organize and filter your saved outfits. You can add up to
        5 tags per outfit.
      </p>
    </div>
  );
}
