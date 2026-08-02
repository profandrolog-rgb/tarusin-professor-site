import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "у сына резко заболело в мошонке",
  "не открывается головка, это нормально?",
  "яичко не опустилось",
  "надо ли делать УЗИ",
];

interface Props {
  initialQuery?: string;
  /** Если задан — вызывается вместо перехода на /video/search. */
  onSubmit?: (query: string) => void;
}

const VideoSearchBox = ({ initialQuery = "", onSubmit }: Props) => {
  const [value, setValue] = useState(initialQuery);
  const navigate = useNavigate();

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    if (onSubmit) onSubmit(trimmed);
    else navigate(`/video/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex gap-2"
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Опишите ситуацию своими словами…"
          aria-label="Поиск по видео"
          className="h-12"
        />
        <Button type="submit" size="lg" className="h-12">
          <Search className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Найти</span>
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setValue(s);
              submit(s);
            }}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoSearchBox;
