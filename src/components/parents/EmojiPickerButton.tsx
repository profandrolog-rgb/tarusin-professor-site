import { lazy, Suspense, useState } from "react";
import { Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "next-themes";

// Lazy-load emoji-mart (~150KB) so it doesn't bloat initial admin bundle.
const Picker = lazy(async () => {
  const [{ default: data }, mod] = await Promise.all([
    import("@emoji-mart/data"),
    import("@emoji-mart/react"),
  ]);
  return {
    default: (props: any) => <mod.default data={data} {...props} />,
  };
});

interface Props {
  value: string | null | undefined;
  onChange: (emoji: string | null) => void;
  placeholder?: string;
}

const EmojiPickerButton = ({ value, onChange, placeholder = "Эмодзи" }: Props) => {
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 min-w-[64px] justify-center text-xl"
            aria-label="Выбрать эмодзи"
          >
            {value ? (
              <span>{value}</span>
            ) : (
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                <Smile className="w-4 h-4" />
                {placeholder}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 border-none bg-transparent shadow-xl w-auto" align="start" sideOffset={8}>
          <Suspense fallback={<div className="w-[352px] h-[435px] rounded-lg bg-muted animate-pulse" />}>
            <Picker
              theme={resolvedTheme === "dark" ? "dark" : "light"}
              locale="ru"
              previewPosition="none"
              skinTonePosition="search"
              maxFrequentRows={2}
              onEmojiSelect={(e: any) => {
                onChange(e.native);
                setOpen(false);
              }}
            />
          </Suspense>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 px-2 text-muted-foreground hover:text-destructive"
          onClick={() => onChange(null)}
          aria-label="Очистить эмодзи"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

export default EmojiPickerButton;
