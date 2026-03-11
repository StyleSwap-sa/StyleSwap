import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

interface UserMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionSelect?: (userId: number, userName: string) => void;
}

export function UserMentionInput({
  value,
  onChange,
  onMentionSelect,
}: UserMentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: suggestions } = trpc.mentions.searchUsers.useQuery(
    { query: mentionQuery, limit: 5 },
    { enabled: mentionQuery.length > 0 && showSuggestions }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    onChange(newValue);
    setCursorPosition(e.currentTarget.selectionStart || 0);

    // Check if user is typing a mention
    const lastAtIndex = newValue.lastIndexOf("@", cursorPosition);
    if (lastAtIndex !== -1) {
      const textAfterAt = newValue.substring(lastAtIndex + 1, cursorPosition);
      if (textAfterAt && !textAfterAt.includes(" ")) {
        setMentionQuery(textAfterAt);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectUser = (userId: number, userName: string) => {
    const lastAtIndex = value.lastIndexOf("@", cursorPosition);
    if (lastAtIndex !== -1) {
      const beforeMention = value.substring(0, lastAtIndex);
      const afterMention = value.substring(cursorPosition);
      const newValue = `${beforeMention}@${userName} ${afterMention}`;
      onChange(newValue);
      onMentionSelect?.(userId, userName);
      setShowSuggestions(false);
      setMentionQuery("");
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder="Add a comment... (use @ to mention users)"
        className="w-full"
      />

      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user.id, user.name)}
              className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
