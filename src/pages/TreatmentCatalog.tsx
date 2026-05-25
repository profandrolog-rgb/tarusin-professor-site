import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { ArrowLeft, Plus, Loader2, Pencil, Sun, Beaker, AlertTriangle, Upload, Download, Wallet, RefreshCw, Bot, Hand, Search, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SECTIONS, TreatmentCategory } from "@/components/treatment/sections";
import { CsvImportDialog } from "@/components/treatment/CsvImportDialog";
import { CATALOG_KNOWN_COLUMNS, serializeCsv } from "@/lib/treatmentCsv";
import { formatRub, priceFreshness, effectivePrice } from "@/lib/treatment/cost";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PriceSource { source: string; url: string; price: number; fetched_at: string }

interface Row {
  id: string;
  category: TreatmentCategory;
  subcategory: string | null;
  name: string;
  inn: string | null;
  form: string | null;
  default_dose: number | null;
  dose_unit: string | null;
  default_dilution_volume: number | null;
  default_dilution_solvent: string | null;
  default_frequency: string | null;
  default_duration_days: number | null;
  infusion_rate: string | null;
  notes: string | null;
  is_rx: boolean;
  is_off_label: boolean;
  light_sensitive: boolean;
  glucose_only: boolean;
  is_active: boolean;
  price_override: number | null;
  price_currency: string | null;
  price_updated_at: string | null;
  price_source_note: string | null;
  pack_size_num: number | null;
  units_per_dose_num: number | null;
  price_auto: number | null;
  price_auto_updated_at: string | null;
  price_auto_sources: PriceSource[] | null;
  price_source_preference: "auto" | "manual" | null;
  parse_query: string | null;
}

const empty: Partial<Row> = { category: "iv_drip", is_active: true, is_rx: false, is_off_label: false, light_sensitive: false, glucose_only: false, price_currency: "RUB", price_source_preference: "auto" };

const FRESHNESS_STYLES: Record<string, { dot: string; label: string }> = {
  fresh:   { dot: "bg-emerald-500", label: "цена свежая (≤30 дн.)" },
  stale:   { dot: "bg-amber-500",   label: "цена устарела (30–90 дн.)" },
  old:     { dot: "bg-red-500",     label: "цена давно не обновлялась (>90 дн.)" },
  missing: { dot: "bg-muted-foreground/30", label: "цена не задана" },
};

export default function TreatmentCatalog() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);
  const [filter, setFilter] = useState<TreatmentCategory | "all">("all");
  const [q, setQ] = useState("");
  const [matchIds, setMatchIds] = useState<Set<string> | null>(null);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const acRef = useRef<HTMLDivElement | null>(null);
  const [onlyMissingPrice, setOnlyMissingPrice] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Row>>(empty);
  const [importOpen, setImportOpen] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const refreshPrice = async (id: string) => {
    setRefreshingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("parse-drug-prices", { body: { catalog_id: id } });
      if (error) throw error;
      const r = data?.results?.[0];
      if (r?.ok) {
        toast({ title: "Цена обновлена", description: `${formatRub(r.price)} · источников: ${r.sources?.length || 0}` });
        await load();
        // Refresh draft if open
        const fresh = await supabase.from("treatment_catalog").select("*").eq("id", id).single();
        if (fresh.data && draft.id === id) setDraft(fresh.data as any);
      } else {
        toast({ title: "Не удалось получить цену", description: r?.error || "источники не вернули цены", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка обновления", description: e.message, variant: "destructive" });
    } finally {
      setRefreshingId(null);
    }
  };

  const refreshAllPrices = async () => {
    setBatchBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-drug-prices", { body: { batch: true, limit: 20 } });
      if (error) throw error;
      const ok = (data?.results || []).filter((r: any) => r.ok).length;
      toast({ title: `Обновлено: ${ok} из ${data?.processed || 0}` });
      load();
    } catch (e: any) {
      toast({ title: "Ошибка batch", description: e.message, variant: "destructive" });
    } finally {
      setBatchBusy(false);
    }
  };

  const exportCsv = async () => {
    const { data, error } = await supabase.from("treatment_catalog").select("*").order("category").order("name");
    if (error) { toast({ title: "Ошибка экспорта", description: error.message, variant: "destructive" }); return; }
    const headers = [...CATALOG_KNOWN_COLUMNS];
    // Append any patient_* keys seen in patient_info
    const patientKeys = new Set<string>();
    (data || []).forEach((r: any) => { if (r.patient_info && typeof r.patient_info === "object") Object.keys(r.patient_info).forEach(k => patientKeys.add(k)); });
    const allHeaders = [...headers, ...Array.from(patientKeys).sort()];
    const flat = (data || []).map((r: any) => {
      const out: any = { ...r };
      if (r.patient_info && typeof r.patient_info === "object") Object.entries(r.patient_info).forEach(([k, v]) => { out[k] = v; });
      return out;
    });
    const csv = serializeCsv(flat, allHeaders, ";");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treatment_catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Экспортировано: ${flat.length}` });
  };

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/treatment-catalog" } });
    }
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    setBusy(true);
    const { data } = await supabase.from("treatment_catalog").select("*").order("category").order("name");
    setRows((data as any) || []);
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("treatment_catalog_search_history");
      if (raw) setHistory(JSON.parse(raw).slice(0, 10));
    } catch { /* ignore */ }
  }, []);

  const pushHistory = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setHistory(prev => {
      const next = [t, ...prev.filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, 10);
      try { localStorage.setItem("treatment_catalog_search_history", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem("treatment_catalog_search_history"); } catch { /* ignore */ }
  };

  // Debounced full-text search → matching ids
  useEffect(() => {
    const term = q.trim();
    if (!term) { setMatchIds(null); setSearching(false); return; }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        // Build a websearch-friendly query: split by space, prefix-match each token
        const fts = term
          .split(/\s+/)
          .filter(Boolean)
          .map(t => t.replace(/[&|!():*]/g, "") + ":*")
          .join(" & ");
        let { data, error } = await supabase
          .from("treatment_catalog")
          .select("id")
          .textSearch("search_vector", fts, { config: "russian" } as any);
        if (error) {
          // Fallback to substring search across already-loaded rows (handled by filter)
          setMatchIds(null);
        } else {
          setMatchIds(new Set((data || []).map((r: any) => r.id)));
        }
      } catch {
        setMatchIds(null);
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => clearTimeout(handle);
  }, [q]);

  // Close autocomplete on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (acRef.current && !acRef.current.contains(e.target as Node)) setAcOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const save = async () => {
    if (!draft.name || !draft.category) { toast({ title: "Название и категория обязательны", variant: "destructive" }); return; }
    const payload: any = { ...draft };
    // Stamp price_updated_at when price_override is being set/changed
    if (draft.price_override != null && draft.price_override !== "" as any) {
      payload.price_updated_at = new Date().toISOString();
      if (!payload.price_currency) payload.price_currency = "RUB";
    }
    if (draft.id) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("treatment_catalog").update(rest).eq("id", id);
      if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("treatment_catalog").insert(payload);
      if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    }
    setEditOpen(false);
    setDraft(empty);
    toast({ title: "Сохранено" });
    load();
  };

  const startEdit = (r: Row) => { setDraft(r); setEditOpen(true); };
  const startNew = () => { setDraft(empty); setEditOpen(true); };

  // Open editor from ?edit=<id> deep-link (e.g. from cost-block "задать цену →")
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && rows.length) {
      const r = rows.find(x => x.id === editId);
      if (r) { startEdit(r); searchParams.delete("edit"); setSearchParams(searchParams, { replace: true }); }
    }
  }, [rows, searchParams, setSearchParams]);

  const qLower = q.trim().toLowerCase();
  const matchesSubstring = (r: Row) => {
    if (!qLower) return true;
    const hay = [r.name, r.inn, r.notes, r.subcategory].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(qLower);
  };

  const filtered = rows.filter(r => {
    if (filter !== "all" && r.category !== filter) return false;
    if (onlyMissingPrice && effectivePrice(r) != null) return false;
    if (qLower) {
      // Prefer FTS match-set if available; otherwise fall back to substring
      if (matchIds) {
        if (!matchIds.has(r.id) && !matchesSubstring(r)) return false;
      } else if (!matchesSubstring(r)) {
        return false;
      }
    }
    return true;
  });

  // Top-5 autocomplete suggestions
  const suggestions = qLower ? filtered.slice(0, 5) : [];

  // Highlight tokens helper
  const renderHighlighted = (text: string | null | undefined) => {
    const s = text || "";
    if (!qLower) return s;
    const tokens = qLower.split(/\s+/).filter(t => t.length >= 2);
    if (!tokens.length) return s;
    const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const splitter = new RegExp(`(${escaped})`, "gi");
    const tester = new RegExp(`^(?:${escaped})$`, "i");
    const parts = s.split(splitter);
    return parts.map((p, i) =>
      tester.test(p)
        ? <mark key={i} className="bg-amber-200/70 dark:bg-amber-500/30 text-inherit rounded px-0.5">{p}</mark>
        : <span key={i}>{p}</span>
    );
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Link to="/admin/treatment-plans" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4"/>К листам назначений
        </Link>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Каталог вмешательств</h1>
            <p className="text-sm text-muted-foreground">{rows.length} позиций · 12 категорий</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={refreshAllPrices} disabled={batchBusy} variant="outline" className="gap-2">
              {batchBusy ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
              Обновить цены (20)
            </Button>
            <Button onClick={() => setImportOpen(true)} variant="outline" className="gap-2"><Upload className="w-4 h-4"/>Импорт CSV</Button>
            <Button onClick={exportCsv} variant="outline" className="gap-2"><Download className="w-4 h-4"/>Экспорт CSV</Button>
            <Button onClick={startNew} className="gap-2"><Plus className="w-4 h-4"/>Новая позиция</Button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex gap-2 flex-wrap items-center">
            <div ref={acRef} className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              <Input
                value={q}
                onChange={e => { setQ(e.target.value); setAcOpen(true); }}
                onFocus={() => setAcOpen(true)}
                onKeyDown={e => {
                  if (e.key === "Enter") { pushHistory(q); setAcOpen(false); }
                  else if (e.key === "Escape") { setAcOpen(false); }
                }}
                placeholder="Поиск: название, МНН, заметки, теги…"
                className="pl-8 pr-8"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => { setQ(""); setAcOpen(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Очистить"
                ><X className="w-4 h-4"/></button>
              )}
              {searching && (
                <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground"/>
              )}
              {acOpen && qLower && suggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                  {suggestions.map(s => {
                    const section = SECTIONS.find(x => x.key === s.category);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className="block w-full text-left px-3 py-2 hover:bg-accent text-sm"
                        onClick={() => { setQ(s.name); pushHistory(s.name); setAcOpen(false); }}
                      >
                        <div className="font-medium truncate">{renderHighlighted(s.name)}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {section?.short}{s.inn ? ` · ${s.inn}` : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Select value={filter} onValueChange={(v: any)=>setFilter(v)}>
              <SelectTrigger className="max-w-xs"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {SECTIONS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={onlyMissingPrice} onCheckedChange={setOnlyMissingPrice}/>
              <Wallet className="w-3.5 h-3.5"/>Только без цены
            </label>
            {qLower && (
              <span className="text-xs text-muted-foreground">Найдено: {filtered.length}</span>
            )}
          </div>
          {history.length > 0 && (
            <div className="flex gap-1.5 flex-wrap items-center text-xs">
              <span className="text-muted-foreground">Недавние:</span>
              {history.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => { setQ(h); setAcOpen(false); }}
                  className="px-2 py-0.5 rounded-full border border-border bg-muted/40 hover:bg-accent transition-colors"
                >{h}</button>
              ))}
              <button
                type="button"
                onClick={clearHistory}
                className="text-muted-foreground hover:text-foreground ml-1"
                title="Очистить историю"
              ><X className="w-3 h-3"/></button>
            </div>
          )}
        </div>

        {busy ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
        ) : (
          <div className="grid gap-2">
            {filtered.map(r => {
              const section = SECTIONS.find(s => s.key === r.category);
              const Icon = section?.icon;
              const pref = r.price_source_preference || "auto";
              const eff = effectivePrice(r);
              const usingAuto = pref !== "manual" && r.price_auto != null;
              const freshSrc = usingAuto ? r.price_auto_updated_at : r.price_updated_at;
              const fr = priceFreshness(freshSrc);
              const frInfo = FRESHNESS_STYLES[fr];
              return (
                <Card key={r.id} className={r.is_active ? "" : "opacity-60"}>
                  <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {Icon && <Icon className="w-4 h-4 text-primary"/>}
                        <span className="font-medium">{r.name}</span>
                        {r.inn && <span className="text-xs text-muted-foreground">({r.inn})</span>}
                        <Badge variant="outline" className="text-[10px]">{section?.short}</Badge>
                        {r.is_rx && <Badge variant="outline" className="text-[10px]">Rx</Badge>}
                        {r.is_off_label && <Badge variant="outline" className="text-[10px] gap-1"><AlertTriangle className="w-2.5 h-2.5"/>off-label</Badge>}
                        {r.light_sensitive && <Sun className="w-3.5 h-3.5 text-amber-500"/>}
                        {r.glucose_only && <Beaker className="w-3.5 h-3.5 text-blue-500"/>}
                        {!r.is_active && <Badge variant="secondary" className="text-[10px]">не активна</Badge>}
                        {eff != null ? (
                          <span title={`${usingAuto ? "Авто" : "Ручная"} · ${frInfo.label}`} className="inline-flex items-center gap-1 text-xs">
                            <span className={`inline-block w-2 h-2 rounded-full ${frInfo.dot}`}/>
                            {usingAuto ? <Bot className="w-3 h-3 text-muted-foreground"/> : <Hand className="w-3 h-3 text-muted-foreground"/>}
                            {formatRub(eff)}
                          </span>
                        ) : (
                          <span title="цена не задана" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <span className={`inline-block w-2 h-2 rounded-full ${frInfo.dot}`}/>
                            без цены
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.form ? `${r.form} · ` : ""}
                        {r.default_dose ? `${r.default_dose} ${r.dose_unit || ""} · ` : ""}
                        {r.default_frequency ? `${r.default_frequency} · ` : ""}
                        {r.default_duration_days ? `${r.default_duration_days} дн.` : ""}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={()=>startEdit(r)}><Pencil className="w-4 h-4"/></Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>{draft.id ? "Редактировать позицию" : "Новая позиция"}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label>Категория *</Label>
              <Select value={draft.category} onValueChange={(v: any)=>setDraft(d=>({...d, category: v}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{SECTIONS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Название *</Label><Input value={draft.name ?? ""} onChange={e=>setDraft(d=>({...d, name: e.target.value}))}/></div>
              <div><Label>МНН</Label><Input value={draft.inn ?? ""} onChange={e=>setDraft(d=>({...d, inn: e.target.value}))}/></div>
              <div><Label>Подкатегория</Label><Input value={draft.subcategory ?? ""} onChange={e=>setDraft(d=>({...d, subcategory: e.target.value}))}/></div>
              <div><Label>Форма</Label><Input value={draft.form ?? ""} onChange={e=>setDraft(d=>({...d, form: e.target.value}))}/></div>
              <div><Label>Доза</Label><Input type="number" step="any" value={draft.default_dose ?? ""} onChange={e=>setDraft(d=>({...d, default_dose: e.target.value === "" ? null : Number(e.target.value)}))}/></div>
              <div><Label>Ед.</Label><Input value={draft.dose_unit ?? ""} onChange={e=>setDraft(d=>({...d, dose_unit: e.target.value}))}/></div>
              <div><Label>Разведение, мл</Label><Input type="number" value={draft.default_dilution_volume ?? ""} onChange={e=>setDraft(d=>({...d, default_dilution_volume: e.target.value === "" ? null : Number(e.target.value)}))}/></div>
              <div><Label>Растворитель</Label><Input value={draft.default_dilution_solvent ?? ""} onChange={e=>setDraft(d=>({...d, default_dilution_solvent: e.target.value}))}/></div>
              <div><Label>Кратность</Label><Input value={draft.default_frequency ?? ""} onChange={e=>setDraft(d=>({...d, default_frequency: e.target.value}))}/></div>
              <div><Label>Дней</Label><Input type="number" value={draft.default_duration_days ?? ""} onChange={e=>setDraft(d=>({...d, default_duration_days: e.target.value === "" ? null : Number(e.target.value)}))}/></div>
              <div className="col-span-2"><Label>Скорость инфузии</Label><Input value={draft.infusion_rate ?? ""} onChange={e=>setDraft(d=>({...d, infusion_rate: e.target.value}))}/></div>
            </div>
            <div><Label>Заметка / инструкция</Label><Textarea value={draft.notes ?? ""} onChange={e=>setDraft(d=>({...d, notes: e.target.value}))} rows={2}/></div>

            {/* 💰 Стоимость (Фаза 3A) */}
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Wallet className="w-4 h-4 text-primary"/>💰 Стоимость
                {draft.price_updated_at && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                    <span className={`inline-block w-2 h-2 rounded-full ${FRESHNESS_STYLES[priceFreshness(draft.price_updated_at)].dot}`}/>
                    обновлено {new Date(draft.price_updated_at).toLocaleDateString("ru-RU")}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Цена за упаковку, ₽</Label>
                  <Input
                    type="number" step="any"
                    value={draft.price_override ?? ""}
                    onChange={e=>setDraft(d=>({...d, price_override: e.target.value === "" ? null : Number(e.target.value)}))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Единиц в упаковке</Label>
                  <Input
                    type="number" step="any"
                    placeholder="напр. 30 (таб.)"
                    value={draft.pack_size_num ?? ""}
                    onChange={e=>setDraft(d=>({...d, pack_size_num: e.target.value === "" ? null : Number(e.target.value)}))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Единиц на приём</Label>
                  <Input
                    type="number" step="any"
                    placeholder="обычно 1"
                    value={draft.units_per_dose_num ?? ""}
                    onChange={e=>setDraft(d=>({...d, units_per_dose_num: e.target.value === "" ? null : Number(e.target.value)}))}
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Источник цены (примечание)</Label>
                  <Input
                    placeholder="напр. apteka.ru, средняя по Москве"
                    value={draft.price_source_note ?? ""}
                    onChange={e=>setDraft(d=>({...d, price_source_note: e.target.value}))}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Цена используется в расчёте ориентировочной стоимости курса. Поле «единиц на приём» помогает корректно посчитать число упаковок при делении/удвоении доз.
              </p>

              {/* Автоцена (Фаза 4) */}
              <div className="rounded-md border border-border/60 bg-background p-2 space-y-2 mt-2">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Bot className="w-3.5 h-3.5 text-primary"/>Источник цены
                </div>
                <RadioGroup
                  value={(draft.price_source_preference as any) || "auto"}
                  onValueChange={(v: any) => setDraft(d => ({ ...d, price_source_preference: v }))}
                  className="flex gap-4"
                >
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <RadioGroupItem value="auto" id="src-auto"/>
                    <span>🤖 Авто (парсинг)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <RadioGroupItem value="manual" id="src-manual"/>
                    <span>✋ Ручная цена</span>
                  </label>
                </RadioGroup>
                <div>
                  <Label className="text-xs">Поисковый запрос (по умолчанию — название)</Label>
                  <Input
                    placeholder={draft.name || "напр. Виагра 50 мг 4 таб."}
                    value={draft.parse_query ?? ""}
                    onChange={e => setDraft(d => ({ ...d, parse_query: e.target.value || null }))}
                  />
                </div>
                {draft.price_auto != null && (
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Автоцена:</span>
                      <span>{formatRub(draft.price_auto)}</span>
                      {draft.price_auto_updated_at && (
                        <span className="text-muted-foreground">
                          · {new Date(draft.price_auto_updated_at).toLocaleDateString("ru-RU")}
                        </span>
                      )}
                    </div>
                    {Array.isArray(draft.price_auto_sources) && draft.price_auto_sources.length > 0 && (
                      <details className="text-[11px] text-muted-foreground">
                        <summary className="cursor-pointer">Источники ({draft.price_auto_sources.length})</summary>
                        <ul className="pl-3 mt-1 space-y-0.5">
                          {draft.price_auto_sources.map((s, i) => (
                            <li key={i}>
                              {s.source}: {formatRub(s.price)}
                              {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="ml-1 underline">↗</a>}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
                {draft.id && (
                  <Button
                    size="sm" variant="outline" type="button"
                    onClick={() => refreshPrice(draft.id!)}
                    disabled={refreshingId === draft.id}
                    className="gap-1.5 text-xs h-7"
                  >
                    {refreshingId === draft.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>}
                    Обновить автоцену сейчас
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm"><Switch checked={draft.is_rx ?? false} onCheckedChange={v=>setDraft(d=>({...d, is_rx: v}))}/>Rx (рецептурное)</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={draft.is_off_label ?? false} onCheckedChange={v=>setDraft(d=>({...d, is_off_label: v}))}/>Off-label</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={draft.light_sensitive ?? false} onCheckedChange={v=>setDraft(d=>({...d, light_sensitive: v}))}/>Защищать от света</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={draft.glucose_only ?? false} onCheckedChange={v=>setDraft(d=>({...d, glucose_only: v}))}/>Только на глюкозе</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={draft.is_active ?? true} onCheckedChange={v=>setDraft(d=>({...d, is_active: v}))}/>Активна</label>
            </div>
          </div>
          <SheetFooter><Button onClick={save}>Сохранить</Button></SheetFooter>
        </SheetContent>
      </Sheet>

      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} onComplete={load}/>
    </div>
  );
}
