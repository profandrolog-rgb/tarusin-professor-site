import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { ArrowLeft, Plus, Loader2, Pencil, RefreshCw, Bot, FlaskConical, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatRub, priceFreshness } from "@/lib/treatment/cost";

interface PriceSource { source: string; url: string; price: number; fetched_at: string }

interface LabRow {
  id: string;
  name: string;
  short_name: string | null;
  category: string | null;
  unit: string | null;
  ref_range_male: string | null;
  is_active: boolean;
  notes: string | null;
  kdl_slug: string | null;
  price_avg: number | null;
  price_auto: number | null;
  price_auto_updated_at: string | null;
  price_auto_sources: PriceSource[] | null;
}

const empty: Partial<LabRow> = { is_active: true, category: "Гормоны" };

const FRESHNESS_STYLES: Record<string, { dot: string; label: string }> = {
  fresh:   { dot: "bg-emerald-500", label: "цена свежая (≤30 дн.)" },
  stale:   { dot: "bg-amber-500",   label: "цена устарела (30–90 дн.)" },
  old:     { dot: "bg-red-500",     label: "цена давно не обновлялась (>90 дн.)" },
  missing: { dot: "bg-muted-foreground/30", label: "цена не задана" },
};

export default function AdminLabTestsCatalog() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<LabRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<LabRow>>(empty);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/lab-tests-catalog" } });
    }
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    setBusy(true);
    const { data } = await supabase
      .from("lab_tests_catalog")
      .select("id, name, short_name, category, unit, ref_range_male, is_active, notes, kdl_slug, price_avg, price_auto, price_auto_updated_at, price_auto_sources")
      .order("category", { nullsFirst: true })
      .order("name");
    setRows((data as any) || []);
    setBusy(false);
  };
  useEffect(() => { load(); }, []);

  const categories = Array.from(new Set(rows.map(r => r.category).filter(Boolean) as string[])).sort();

  const refreshPrice = async (id: string) => {
    setRefreshingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("parse-lab-prices", { body: { lab_id: id } });
      if (error) throw error;
      const r = data?.results?.[0];
      if (r?.ok) {
        toast({ title: "Цена обновлена", description: `${formatRub(r.price)} · источников: ${r.sources?.length || 0}` });
        await load();
        if (draft.id === id) {
          const { data: fresh } = await supabase.from("lab_tests_catalog").select("*").eq("id", id).single();
          if (fresh) setDraft(fresh as any);
        }
      } else {
        toast({ title: "Не удалось получить цену", description: r?.error || "источники не вернули цены", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка обновления", description: e.message, variant: "destructive" });
    } finally {
      setRefreshingId(null);
    }
  };

  const refreshAll = async () => {
    setBatchBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-lab-prices", { body: { batch: true, limit: 20 } });
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

  const save = async () => {
    if (!draft.name) { toast({ title: "Название обязательно", variant: "destructive" }); return; }
    const payload: any = { ...draft };
    if (draft.id) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("lab_tests_catalog").update(rest).eq("id", id);
      if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("lab_tests_catalog").insert(payload);
      if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    }
    setEditOpen(false);
    setDraft(empty);
    toast({ title: "Сохранено" });
    load();
  };

  const startEdit = (r: LabRow) => { setDraft(r); setEditOpen(true); };
  const startNew = () => { setDraft(empty); setEditOpen(true); };

  const filtered = rows.filter(r => {
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (q && !(r.name.toLowerCase().includes(q.toLowerCase()) || (r.short_name || "").toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

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
            <h1 className="text-2xl font-bold flex items-center gap-2"><FlaskConical className="w-6 h-6 text-primary"/>Каталог лабораторных анализов</h1>
            <p className="text-sm text-muted-foreground">{rows.length} анализов · цены с kdlmed.ru</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={refreshAll} disabled={batchBusy} variant="outline" className="gap-2">
              {batchBusy ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
              Обновить цены (20)
            </Button>
            <Button onClick={startNew} className="gap-2"><Plus className="w-4 h-4"/>Новый анализ</Button>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск..." className="max-w-xs"/>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">Все категории</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {busy ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary"/></div>
        ) : (
          <div className="grid gap-2">
            {filtered.map(r => {
              const eff = r.price_auto ?? r.price_avg ?? null;
              const usingAuto = r.price_auto != null;
              const fr = priceFreshness(usingAuto ? r.price_auto_updated_at : null);
              const frInfo = FRESHNESS_STYLES[fr];
              return (
                <Card key={r.id} className={r.is_active ? "" : "opacity-60"}>
                  <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{r.name}</span>
                        {r.short_name && <span className="text-xs text-muted-foreground">({r.short_name})</span>}
                        {r.category && <Badge variant="outline" className="text-[10px]">{r.category}</Badge>}
                        {r.unit && <Badge variant="secondary" className="text-[10px]">{r.unit}</Badge>}
                        {!r.is_active && <Badge variant="secondary" className="text-[10px]">не активен</Badge>}
                        {eff != null ? (
                          <span title={`${usingAuto ? "Автоцена (KDL)" : "Средняя цена"} · ${frInfo.label}`} className="inline-flex items-center gap-1 text-xs">
                            <span className={`inline-block w-2 h-2 rounded-full ${frInfo.dot}`}/>
                            {usingAuto && <Bot className="w-3 h-3 text-muted-foreground"/>}
                            {formatRub(eff)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <span className={`inline-block w-2 h-2 rounded-full ${frInfo.dot}`}/>
                            без цены
                          </span>
                        )}
                      </div>
                      {r.ref_range_male && (
                        <div className="text-xs text-muted-foreground mt-1">Норма: {r.ref_range_male}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => refreshPrice(r.id)}
                      disabled={refreshingId === r.id}
                      title="Обновить автоцену"
                    >
                      {refreshingId === r.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={()=>startEdit(r)}><Pencil className="w-4 h-4"/></Button>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">Ничего не найдено</div>
            )}
          </div>
        )}
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>{draft.id ? "Редактировать анализ" : "Новый анализ"}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><Label>Название *</Label><Input value={draft.name ?? ""} onChange={e=>setDraft(d=>({...d, name: e.target.value}))}/></div>
              <div><Label>Короткое имя</Label><Input value={draft.short_name ?? ""} onChange={e=>setDraft(d=>({...d, short_name: e.target.value}))} placeholder="Т общий"/></div>
              <div><Label>Категория</Label><Input value={draft.category ?? ""} onChange={e=>setDraft(d=>({...d, category: e.target.value}))} placeholder="Гормоны"/></div>
              <div><Label>Ед. измерения</Label><Input value={draft.unit ?? ""} onChange={e=>setDraft(d=>({...d, unit: e.target.value}))} placeholder="нмоль/л"/></div>
              <div><Label>Норма (мужчины)</Label><Input value={draft.ref_range_male ?? ""} onChange={e=>setDraft(d=>({...d, ref_range_male: e.target.value}))} placeholder="12.0–35.0"/></div>
              <div className="col-span-2"><Label>Заметка</Label><Textarea value={draft.notes ?? ""} onChange={e=>setDraft(d=>({...d, notes: e.target.value}))} rows={2}/></div>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Bot className="w-4 h-4 text-primary"/>💰 Цена и автопарсинг (KDL)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Средняя цена, ₽</Label>
                  <Input
                    type="number" step="any"
                    value={draft.price_avg ?? ""}
                    onChange={e=>setDraft(d=>({...d, price_avg: e.target.value === "" ? null : Number(e.target.value)}))}
                  />
                </div>
                <div>
                  <Label className="text-xs">KDL slug или URL</Label>
                  <Input
                    placeholder="testosteron-obshchii"
                    value={draft.kdl_slug ?? ""}
                    onChange={e=>setDraft(d=>({...d, kdl_slug: e.target.value || null}))}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Slug — последняя часть URL на kdlmed.ru (например, для <code>kdlmed.ru/patsientam/vse-issledovaniya/testosteron-obshchii</code> укажите <code>testosteron-obshchii</code>). Если не задан — будет использован поиск по названию.
              </p>
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
                            {s.url && (
                              <a href={s.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 underline">
                                <ExternalLink className="w-2.5 h-2.5"/>
                              </a>
                            )}
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

            <label className="flex items-center gap-2 text-sm pt-1">
              <Switch checked={draft.is_active ?? true} onCheckedChange={v=>setDraft(d=>({...d, is_active: v}))}/>
              Активен
            </label>
          </div>
          <SheetFooter><Button onClick={save}>Сохранить</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
