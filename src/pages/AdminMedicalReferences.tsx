import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, Search } from "lucide-react";

type FieldSpec = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number";
  placeholder?: string;
};

interface CatalogConfig {
  key: string;
  title: string;
  description: string;
  table: string;
  select: string;
  displayField: string;
  searchFields: string[];
  fields: FieldSpec[];
  hasIsActive?: boolean;
  orderBy?: string;
  ascending?: boolean;
}

const CATALOGS: CatalogConfig[] = [
  {
    key: "medications",
    title: "Препараты",
    description: "Справочник медикаментов для назначений",
    table: "medications",
    select: "id, latin_name, trade_name, dosage_form, dosage",
    displayField: "latin_name",
    searchFields: ["latin_name", "trade_name", "dosage_form"],
    fields: [
      { key: "latin_name", label: "Латинское название", type: "text" },
      { key: "trade_name", label: "Торговое название", type: "text" },
      { key: "dosage_form", label: "Форма выпуска", type: "text", placeholder: "табл., капс., р-р…" },
      { key: "dosage", label: "Дозировка", type: "text", placeholder: "50 мг" },
    ],
    orderBy: "latin_name",
    ascending: true,
  },
  {
    key: "surgery_catalog",
    title: "Операции",
    description: "Список названий операций для назначения оперативного лечения",
    table: "surgery_catalog",
    select: "id, name, short_code, indications, description, notes, sort_order, is_active",
    displayField: "name",
    searchFields: ["name", "short_code", "indications"],
    fields: [
      { key: "name", label: "Название операции", type: "text" },
      { key: "short_code", label: "Короткий код / шифр", type: "text" },
      { key: "indications", label: "Показания", type: "textarea" },
      { key: "description", label: "Описание", type: "textarea" },
      { key: "notes", label: "Примечания", type: "textarea" },
      { key: "sort_order", label: "Порядок сортировки", type: "number" },
    ],
    hasIsActive: true,
    orderBy: "sort_order",
    ascending: true,
  },
  {
    key: "physical_activity_programs",
    title: "Физическая нагрузка",
    description: "Программы ЛФК / кардио / реабилитации",
    table: "physical_activity_programs",
    select: "id, name, category, age_range, description, weekly_plan, restrictions, sort_order, is_active",
    displayField: "name",
    searchFields: ["name", "category", "age_range"],
    fields: [
      { key: "name", label: "Название программы", type: "text" },
      { key: "category", label: "Категория", type: "text", placeholder: "ЛФК / Кардио / После операции" },
      { key: "age_range", label: "Возраст", type: "text", placeholder: "5-10 лет" },
      { key: "description", label: "Описание", type: "textarea" },
      { key: "weekly_plan", label: "Недельный план", type: "textarea" },
      { key: "restrictions", label: "Ограничения", type: "textarea" },
      { key: "sort_order", label: "Порядок сортировки", type: "number" },
    ],
    hasIsActive: true,
    orderBy: "sort_order",
    ascending: true,
  },
  {
    key: "diet_recommendations",
    title: "Диеты",
    description: "Пункты диетических рекомендаций",
    table: "diet_recommendations",
    select: "id, diet_type, diet_label, category, item_text, is_recommended, sort_order",
    displayField: "item_text",
    searchFields: ["diet_type", "diet_label", "item_text", "category"],
    fields: [
      { key: "diet_type", label: "Ключ диеты", type: "text", placeholder: "low_carb, no_dairy, …" },
      { key: "diet_label", label: "Название диеты", type: "text" },
      { key: "category", label: "Категория", type: "text", placeholder: "рекомендуется / ограничить / исключить / режим" },
      { key: "item_text", label: "Текст пункта", type: "textarea" },
      { key: "sort_order", label: "Порядок сортировки", type: "number" },
    ],
    orderBy: "sort_order",
    ascending: true,
  },
];

function CatalogEditor({ cfg }: { cfg: CatalogConfig }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let query = supabase.from(cfg.table as any).select(cfg.select);
      if (cfg.orderBy) query = query.order(cfg.orderBy, { ascending: cfg.ascending ?? true });
      const { data, error } = await query.limit(2000);
      if (error) throw error;
      setRows((data as any[]) || []);
    } catch (e: any) {
      toast({ title: "Не удалось загрузить", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [cfg.table]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return rows;
    return rows.filter((r) =>
      cfg.searchFields.some((f) => String(r[f] ?? "").toLowerCase().includes(ql)),
    );
  }, [rows, q, cfg.searchFields]);

  const openNew = () => {
    setEditing(null);
    const empty: any = {};
    for (const f of cfg.fields) empty[f.key] = "";
    if (cfg.hasIsActive) empty.is_active = true;
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    const val: any = {};
    for (const f of cfg.fields) val[f.key] = row[f.key] ?? "";
    if (cfg.hasIsActive) val.is_active = row.is_active !== false;
    setForm(val);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      for (const f of cfg.fields) {
        const raw = form[f.key];
        if (f.type === "number") {
          payload[f.key] = raw === "" || raw == null ? null : Number(raw);
        } else {
          payload[f.key] = raw === "" ? null : raw;
        }
      }
      if (cfg.hasIsActive) payload.is_active = form.is_active !== false;

      if (editing) {
        const { error } = await supabase.from(cfg.table as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Сохранено" });
      } else {
        const { error } = await supabase.from(cfg.table as any).insert(payload);
        if (error) throw error;
        toast({ title: "Добавлено" });
      }
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      toast({ title: "Ошибка сохранения", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: any) => {
    if (!confirm("Удалить запись?")) return;
    try {
      const { error } = await supabase.from(cfg.table as any).delete().eq("id", row.id);
      if (error) throw error;
      toast({ title: "Удалено" });
      await load();
    } catch (e: any) {
      toast({ title: "Ошибка удаления", description: e?.message || String(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">{cfg.description}</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск…"
              className="pl-8 w-64"
            />
          </div>
          <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Добавить</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-12 border border-dashed rounded-md">
          {rows.length === 0 ? "Записей ещё нет — добавьте первую." : "Ничего не найдено"}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="max-h-[65vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Название</th>
                  <th className="text-left px-3 py-2 font-medium">Детали</th>
                  {cfg.hasIsActive && <th className="text-left px-3 py-2 font-medium w-20">Активно</th>}
                  <th className="text-right px-3 py-2 font-medium w-28">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2 align-top font-medium">{row[cfg.displayField] || "—"}</td>
                    <td className="px-3 py-2 align-top text-muted-foreground">
                      {cfg.fields
                        .filter((f) => f.key !== cfg.displayField && row[f.key])
                        .slice(0, 3)
                        .map((f) => (
                          <div key={f.key}><span className="text-xs opacity-70">{f.label}:</span> {String(row[f.key]).slice(0, 100)}</div>
                        ))}
                    </td>
                    {cfg.hasIsActive && (
                      <td className="px-3 py-2 align-top">
                        {row.is_active === false ? <span className="text-xs text-muted-foreground">нет</span> : <span className="text-xs text-emerald-600">да</span>}
                      </td>
                    )}
                    <td className="px-3 py-2 align-top text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(row)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(row)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать" : "Добавить"} — {cfg.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
            {cfg.fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    rows={3}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
            {cfg.hasIsActive && (
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <Checkbox
                  checked={form.is_active !== false}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v === true })}
                />
                <span className="text-sm">Активно (показывать при выборе в протоколе)</span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminMedicalReferences() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>(CATALOGS[0].key);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/medical-references" } });
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Назад к панели администратора
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Медицинские справочники</h1>
          <p className="text-muted-foreground">
            Единое место для редактирования каталогов, которые используются в назначениях протоколов:
            препараты, операции, программы физ. нагрузки, диеты.
          </p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Каталоги</CardTitle></CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-4 flex-wrap h-auto">
                {CATALOGS.map((c) => (
                  <TabsTrigger key={c.key} value={c.key}>{c.title}</TabsTrigger>
                ))}
              </TabsList>
              {CATALOGS.map((c) => (
                <TabsContent key={c.key} value={c.key}>
                  <CatalogEditor cfg={c} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
