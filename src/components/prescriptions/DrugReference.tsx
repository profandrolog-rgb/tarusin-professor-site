import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BookOpen, Search, Loader2, Pill, AlertTriangle, Syringe, Tag, FileText } from "lucide-react";
import { toast } from "sonner";

interface DrugDigest {
  medication_name: string;
  synonyms: string | null;
  pharmacological_group: string | null;
  indications: string | null;
  contraindications: string | null;
  dosage_info: string | null;
}

export function DrugReference() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [digest, setDigest] = useState<DrugDigest | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setDigest(null);

    try {
      const { data, error } = await supabase.functions.invoke("drug-reference", {
        body: { medication_name: search.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setDigest(data);
      setHistory((prev) => {
        const name = search.trim();
        return [name, ...prev.filter((h) => h !== name)].slice(0, 10);
      });
    } catch (err: any) {
      toast.error(err.message || "Ошибка получения справки");
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (name: string) => {
    setSearch(name);
    setLoading(true);
    setDigest(null);
    supabase.functions
      .invoke("drug-reference", { body: { medication_name: name } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          toast.error("Ошибка получения справки");
          return;
        }
        setDigest(data);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Справочник
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Справочник препаратов
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Название препарата..."
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !search.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Найти"}
            </Button>
          </div>

          {/* History chips */}
          {history.length > 0 && !digest && !loading && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Недавние запросы:</p>
              <div className="flex flex-wrap gap-1.5">
                {history.map((h) => (
                  <button
                    key={h}
                    onClick={() => handleHistoryClick(h)}
                    className="text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Загрузка справки...</p>
            </div>
          )}

          {/* Digest card */}
          {digest && !loading && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-lg font-bold capitalize text-foreground">
                {digest.medication_name}
              </h3>

              {digest.synonyms && (
                <DigestSection
                  icon={<Tag className="h-4 w-4" />}
                  title="Синонимы / Торговые названия"
                  content={digest.synonyms}
                />
              )}

              {digest.pharmacological_group && (
                <DigestSection
                  icon={<Pill className="h-4 w-4" />}
                  title="Фармакологическая группа"
                  content={digest.pharmacological_group}
                />
              )}

              {digest.indications && (
                <DigestSection
                  icon={<FileText className="h-4 w-4" />}
                  title="Показания"
                  content={digest.indications}
                />
              )}

              {digest.contraindications && (
                <DigestSection
                  icon={<AlertTriangle className="h-4 w-4" />}
                  title="Противопоказания"
                  content={digest.contraindications}
                  variant="warning"
                />
              )}

              {digest.dosage_info && (
                <DigestSection
                  icon={<Syringe className="h-4 w-4" />}
                  title="Дозировка"
                  content={digest.dosage_info}
                />
              )}

              <p className="text-[10px] text-muted-foreground/60 mt-4">
                Информация сгенерирована AI и кэширована. Не заменяет инструкцию к препарату.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!digest && !loading && history.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Введите название препарата для получения краткой справки</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DigestSection({
  icon,
  title,
  content,
  variant = "default",
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  variant?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-lg border p-3 space-y-1.5 ${
        variant === "warning"
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-secondary/20"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
    </div>
  );
}
