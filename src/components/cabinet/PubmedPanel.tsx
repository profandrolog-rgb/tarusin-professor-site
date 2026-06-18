// PubMed filter panel + preset management for Cabinet chat.
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Save, Star, Trash2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PubmedFilters = {
  ages: string[];
  article_types: string[];
  period: { years_back: number | null; from?: string; to?: string };
  languages: string[];
  humans_only: boolean;
  sort: "relevance" | "pub_date";
  retmax: number;
};

export type PubmedPreset = {
  id: string;
  name: string;
  is_default: boolean;
  filters: PubmedFilters;
};

const AGE_OPTIONS = [
  { id: "infant", label: "Младенцы (0-23 мес)" },
  { id: "child", label: "Дети (2-12)" },
  { id: "adolescent", label: "Подростки (13-18)" },
  { id: "adult", label: "Взрослые (19-44)" },
  { id: "aged", label: "Пожилые (65+)" },
  { id: "male", label: "Мужской пол" },
  { id: "female", label: "Женский пол" },
];

const TYPE_OPTIONS = [
  "Review",
  "Systematic Review",
  "Meta-Analysis",
  "Randomized Controlled Trial",
  "Clinical Trial",
  "Practice Guideline",
  "Case Reports",
  "Observational Study",
];

const LANG_OPTIONS = [
  { id: "eng", label: "Английский" },
  { id: "rus", label: "Русский" },
  { id: "ger", label: "Немецкий" },
  { id: "fre", label: "Французский" },
];

const PERIOD_OPTIONS = [
  { years: null, label: "Все" },
  { years: 1, label: "1 год" },
  { years: 3, label: "3 года" },
  { years: 5, label: "5 лет" },
  { years: 10, label: "10 лет" },
];

export const DEFAULT_PRESET_NAME = "Подростковая андрология";
export const DEFAULT_FILTERS: PubmedFilters = {
  ages: ["adolescent", "male"],
  article_types: ["Review", "Randomized Controlled Trial"],
  period: { years_back: 5 },
  languages: ["eng"],
  humans_only: true,
  sort: "relevance",
  retmax: 10,
};

export const EMPTY_FILTERS: PubmedFilters = {
  ages: [],
  article_types: [],
  period: { years_back: null },
  languages: ["eng"],
  humans_only: true,
  sort: "relevance",
  retmax: 10,
};

const Chip = ({ active, onClick, children, disabled }: {
  active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-background hover:bg-accent border-border"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

export function PubmedPanel({
  userId, filters, onFiltersChange, disabled,
}: {
  userId: string;
  filters: PubmedFilters;
  onFiltersChange: (f: PubmedFilters) => void;
  disabled?: boolean;
}) {
  const [presets, setPresets] = useState<PubmedPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [expanded, setExpanded] = useState(true);

  // Load presets; seed default if none
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("pubmed_search_presets")
        .select("id, name, is_default, filters")
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });
      if (error) { toast.error("Не удалось загрузить пресеты PubMed"); return; }
      let list = (data || []) as PubmedPreset[];
      if (list.length === 0) {
        const { data: ins, error: insErr } = await supabase
          .from("pubmed_search_presets")
          .insert({ user_id: userId, name: DEFAULT_PRESET_NAME, is_default: true, filters: DEFAULT_FILTERS as any })
          .select("id, name, is_default, filters")
          .single();
        if (!insErr && ins) {
          list = [ins as PubmedPreset];
        }
      }
      setPresets(list);
      const def = list.find((p) => p.is_default) || list[0];
      if (def) {
        setSelectedPresetId(def.id);
        onFiltersChange(def.filters);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggleInArray = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const applyPreset = (id: string) => {
    setSelectedPresetId(id);
    const p = presets.find((x) => x.id === id);
    if (p) onFiltersChange(p.filters);
  };

  const saveAsNew = async () => {
    const name = window.prompt("Название пресета:")?.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from("pubmed_search_presets")
      .insert({ user_id: userId, name, filters: filters as any })
      .select("id, name, is_default, filters")
      .single();
    if (error || !data) { toast.error("Не удалось сохранить пресет"); return; }
    setPresets((prev) => [...prev, data as PubmedPreset]);
    setSelectedPresetId(data.id);
    toast.success("Пресет сохранён");
  };

  const saveChanges = async () => {
    if (!selectedPresetId) return;
    const { error } = await supabase
      .from("pubmed_search_presets")
      .update({ filters: filters as any })
      .eq("id", selectedPresetId);
    if (error) { toast.error("Не удалось обновить пресет"); return; }
    setPresets((prev) => prev.map((p) => p.id === selectedPresetId ? { ...p, filters } : p));
    toast.success("Пресет обновлён");
  };

  const setAsDefault = async () => {
    if (!selectedPresetId) return;
    await supabase.from("pubmed_search_presets").update({ is_default: false }).eq("user_id", userId);
    const { error } = await supabase.from("pubmed_search_presets").update({ is_default: true }).eq("id", selectedPresetId);
    if (error) { toast.error("Не удалось сделать пресет по умолчанию"); return; }
    setPresets((prev) => prev.map((p) => ({ ...p, is_default: p.id === selectedPresetId })));
    toast.success("Пресет по умолчанию обновлён");
  };

  const deletePreset = async () => {
    if (!selectedPresetId) return;
    if (!confirm("Удалить пресет?")) return;
    const { error } = await supabase.from("pubmed_search_presets").delete().eq("id", selectedPresetId);
    if (error) { toast.error("Не удалось удалить"); return; }
    const next = presets.filter((p) => p.id !== selectedPresetId);
    setPresets(next);
    setSelectedPresetId(next[0]?.id || "");
    if (next[0]) onFiltersChange(next[0].filters);
  };

  const reset = () => onFiltersChange(EMPTY_FILTERS);

  return (
    <div className="border border-border rounded-md bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">PubMed</span>
          <Select value={selectedPresetId} onValueChange={applyPreset} disabled={disabled || presets.length === 0}>
            <SelectTrigger className="h-7 w-[220px] text-xs"><SelectValue placeholder="Пресет фильтров" /></SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.is_default ? "★ " : ""}{p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={saveChanges} disabled={disabled || !selectedPresetId} title="Сохранить изменения в текущем пресете">
            <Save className="w-3.5 h-3.5 mr-1" />Обновить
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={saveAsNew} disabled={disabled}>
            + Новый
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={setAsDefault} disabled={disabled || !selectedPresetId} title="Сделать пресетом по умолчанию">
            <Star className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive" onClick={deletePreset} disabled={disabled || !selectedPresetId}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={reset} disabled={disabled} title="Сбросить фильтры">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="p-1 hover:text-primary">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {expanded && (
        <div className="p-3 space-y-3">
          {/* Ages */}
          <div>
            <Label className="text-xs">Возраст / пол</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {AGE_OPTIONS.map((a) => (
                <Chip key={a.id} active={filters.ages.includes(a.id)} disabled={disabled}
                  onClick={() => onFiltersChange({ ...filters, ages: toggleInArray(filters.ages, a.id) })}>
                  {a.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Article types */}
          <div>
            <Label className="text-xs">Тип статьи</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {TYPE_OPTIONS.map((t) => (
                <Chip key={t} active={filters.article_types.includes(t)} disabled={disabled}
                  onClick={() => onFiltersChange({ ...filters, article_types: toggleInArray(filters.article_types, t) })}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Period */}
            <div>
              <Label className="text-xs">Период</Label>
              <Select
                value={String(filters.period?.years_back ?? "all")}
                onValueChange={(v) => onFiltersChange({ ...filters, period: { years_back: v === "all" ? null : Number(v) } })}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={String(p.years)} value={p.years === null ? "all" : String(p.years)} className="text-xs">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Sort */}
            <div>
              <Label className="text-xs">Сортировка</Label>
              <Select value={filters.sort} onValueChange={(v: any) => onFiltersChange({ ...filters, sort: v })} disabled={disabled}>
                <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance" className="text-xs">По релевантности</SelectItem>
                  <SelectItem value="pub_date" className="text-xs">По дате публикации</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Retmax */}
            <div>
              <Label className="text-xs">Количество</Label>
              <Select value={String(filters.retmax)} onValueChange={(v) => onFiltersChange({ ...filters, retmax: Number(v) })} disabled={disabled}>
                <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" className="text-xs">5</SelectItem>
                  <SelectItem value="10" className="text-xs">10</SelectItem>
                  <SelectItem value="15" className="text-xs">15</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Humans */}
            <div>
              <Label className="text-xs">Только люди</Label>
              <div className="h-8 mt-1 flex items-center">
                <Switch checked={filters.humans_only} onCheckedChange={(v) => onFiltersChange({ ...filters, humans_only: v })} disabled={disabled} />
              </div>
            </div>
          </div>

          {/* Languages */}
          <div>
            <Label className="text-xs">Язык</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {LANG_OPTIONS.map((l) => (
                <Chip key={l.id} active={filters.languages.includes(l.id)} disabled={disabled}
                  onClick={() => onFiltersChange({ ...filters, languages: toggleInArray(filters.languages, l.id) })}>
                  {l.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
