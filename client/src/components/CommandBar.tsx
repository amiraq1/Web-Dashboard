import { useState, useRef, useEffect } from "react";
import { Search, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  onSubmit: (command: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function CommandBar({
  onSubmit,
  isLoading = false,
  placeholder = "اكتب أمرك هنا... مثال: حلّل ملف المبيعات",
  className,
}: CommandBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative flex h-14 w-full items-center gap-3 rounded-xl border bg-card px-4 shadow-lg transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-5 w-5 text-primary" />
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        data-testid="input-command"
      />

      <div className="flex items-center gap-2">
        <kbd className="hidden rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim() || isLoading}
          data-testid="button-submit-command"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </form>
  );
}
