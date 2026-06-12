import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, FlaskConical, AlertTriangle } from "lucide-react";

export interface Peptide {
  id: string;
  name: string;
  group_name: string | null;
  target_organ: string | null;
  composition: string | null;
  indications: string | null;
  typical_schedule: string | null;
  course_duration: string | null;
  expected_effect: string | null;
  monitoring: string | null;
  side_effects: string | null;
  onco_risk: string | null;
  evidence_level: string | null;
  rf_status: string | null;
  notes: string | null;
}

export interface PeptideProgramItem {
  peptide_id: string;
  name: string;
  group_name?: string | null;
  target_organ?: string | null;
  schedule: string;
  duration: string;
  monitoring?: string;
  notes?: string;
  // snapshot for warnings/print
  onco_risk?: string | null;
  evidence_level?: string | null;
  rf_status?: string | null;
}

export interface PeptideProgramData {
  program_title?: string;
  goal?: string;
  start_date?: string;
  control_date?: string;
  items?: PeptideProgramItem[];
  conclusion?: string;
  recommendations?: string;
}

export const DEFAULT_PEPTIDE_PROGRAM: PeptideProgramData = {
  program_title: "Пептидная программа",
  goal: "",
  items: [],
  conclusion: "",
  recommendations:
    "Контроль переносимости. Контрольный визит / анализы — в указанную дату. При появлении нежелательных реакций — отмена и связь с врачом.",
};

interface Props {
  data: PeptideProgramData;
  onChange: (patch: Partial<PeptideProgramData>) => void;
}

function statusBadge(p: Pick<Peptide, "rf_status" | "evidence_level" | "onco_risk">) {
  const tags: { label: string; tone: "ok" | "warn" | "alert" | "muted" }[] = [];
  const rf = (p.rf_status || "").toLowerCase();
  if (rf.includes("зарегистрирован")) tags.push({ label: "ЛС РФ", tone: "ok" });
  else if (rf.includes("бад")) tags.push({ label: "БАД", tone: "warn" });
  else if (rf.includes("research")) tags.push({ label: "Research", tone: "alert" });
  else if (rf) tags.push({ label: "Статус ?", tone: "muted" });
  const ev = (p.evidence_level || "").toUpperCase();
  if (ev) {
    const tone: "ok" | "warn" | "alert" =
      ev.startsWith("A") || ev.startsWith("B") ? "ok" : ev.startsWith("C") ? "warn" : "alert";
    tags.push({ label: `Дока: ${ev}`, tone });
  }
  const onco = (p.onco_risk || "").toLowerCase();
  if (onco && !onco.includes("не описан") && !onco.includes("нет данных")) {
    tags.push({ label: "Онкориск", tone: "alert" });
  }
  return tags;
}

const toneClass = (t: "ok" | "warn" | "alert" | "muted") =>
  t === "ok"
    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
    : t === "warn"
    ? "bg-amber-100 text-amber-800 border-amber-300"
    : t === "alert"
    ? "bg-red-100 text-red-800 border-red-300"
    : "bg-muted text-muted-foreground";

export function PeptideProgramForm({ data, onChange }: Props) {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerGroup, setPickerGroup] = useState<string>("all");
  const [pickerId, setPickerId] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: rows, error } = await supabase
        .from("peptides")
        .select("*")
        .eq("is_active", true)
        .order("group_name", { ascending: true })
        .order("name", { ascending: true });
      if (!alive) return;
      if (!error && rows) setPeptides(rows as Peptide[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const groups = useMemo(() => {
    const s = new Set<string>();
    peptides.forEach((p) => p.group_name && s.add(p.group_name));
    return Array.from(s).sort();
  }, [peptides]);

  const filtered = useMemo(
    () => peptides.filter((p) => pickerGroup === "all" || p.group_name === pickerGroup),
    [peptides, pickerGroup],
  );

  const items = data.items || [];
  const set = <K extends keyof PeptideProgramData>(k: K, v: PeptideProgramData[K]) =>
    onChange({ [k]: v } as Partial<PeptideProgramData>);

  const addItem = () => {
    const p = peptides.find((x) => x.id === pickerId);
    if (!p) return;
    if (items.some((it) => it.peptide_id === p.id)) return;
    const newItem: PeptideProgramItem = {
      peptide_id: p.id,
      name: p.name,
      group_name: p.group_name,
      target_organ: p.target_organ,
      schedule: p.typical_schedule || "",
      duration: p.course_duration || "",
      monitoring: p.monitoring || "",
      notes: "",
      onco_risk: p.onco_risk,
      evidence_level: p.evidence_level,
      rf_status: p.rf_status,
    };
    set("items", [...items, newItem]);
    setPickerId("");
  };

  const updateItem = (idx: number, patch: Partial<PeptideProgramItem>) => {
    set("items", items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeItem = (idx: number) => set("items", items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-5">
      {/* Параметры программы */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> Параметры пептидной программы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-3">
              <Label>Название программы</Label>
              <Input
                value={data.program_title || ""}
                onChange={(e) => set("program_title", e.target.value)}
                placeholder="Например: Anti-age пептидная поддержка / Иммунокоррекция"
              />
            </div>
            <div className="space-y-1">
              <Label>Дата начала курса</Label>
              <Input type="date" value={data.start_date || ""}
                onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Дата контрольного визита / анализов</Label>
              <Input type="date" value={data.control_date || ""}
                onChange={(e) => set("control_date", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Цель программы</Label>
            <Textarea rows={3} value={data.goal || ""}
              onChange={(e) => set("goal", e.target.value)}
              placeholder="Какие задачи решает программа (нейропротекция, иммунокоррекция, anti-age и т. д.)" />
          </div>
        </CardContent>
      </Card>

      {/* Подбор препаратов */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Подбор препаратов</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-[200px_1fr_auto] gap-2 items-end">
            <div className="space-y-1">
              <Label>Группа</Label>
              <Select value={pickerGroup} onValueChange={setPickerGroup}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все группы</SelectItem>
                  {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Препарат</Label>
              <Select value={pickerId} onValueChange={setPickerId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Загрузка…" : "Выберите пептид"} />
                </SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  {filtered.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}{p.group_name ? ` — ${p.group_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={addItem} disabled={!pickerId} className="gap-1">
              <Plus className="h-4 w-4" /> Добавить
            </Button>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Препараты не выбраны.</p>
          )}

          <div className="space-y-3">
            {items.map((it, idx) => {
              const tags = statusBadge({
                rf_status: it.rf_status || null,
                evidence_level: it.evidence_level || null,
                onco_risk: it.onco_risk || null,
              });
              const alert = tags.some((t) => t.tone === "alert");
              return (
                <Card key={`${it.peptide_id}-${idx}`} className={alert ? "border-red-300" : ""}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                          <span>{idx + 1}. {it.name}</span>
                          {it.group_name && (
                            <span className="text-xs text-muted-foreground">· {it.group_name}</span>
                          )}
                        </div>
                        {it.target_organ && (
                          <div className="text-xs text-muted-foreground">Орган-мишень: {it.target_organ}</div>
                        )}
                        <div className="flex gap-1 flex-wrap mt-1">
                          {tags.map((t, i) => (
                            <Badge key={i} variant="outline" className={`text-[10px] ${toneClass(t.tone)}`}>
                              {t.tone === "alert" && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                              {t.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon"
                        onClick={() => removeItem(idx)} className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Схема приёма</Label>
                        <Input value={it.schedule}
                          onChange={(e) => updateItem(idx, { schedule: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Длительность курса</Label>
                        <Input value={it.duration}
                          onChange={(e) => updateItem(idx, { duration: e.target.value })} />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs">Контроль</Label>
                        <Input value={it.monitoring || ""}
                          onChange={(e) => updateItem(idx, { monitoring: e.target.value })} />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs">Комментарий / индивидуальные пометки</Label>
                        <Textarea rows={2} value={it.notes || ""}
                          onChange={(e) => updateItem(idx, { notes: e.target.value })} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Итог */}
      <div className="space-y-1">
        <Label>Заключение по программе</Label>
        <Textarea rows={4} value={data.conclusion || ""}
          onChange={(e) => set("conclusion", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Рекомендации</Label>
        <Textarea rows={4} value={data.recommendations || ""}
          onChange={(e) => set("recommendations", e.target.value)} />
      </div>
    </div>
  );
}
