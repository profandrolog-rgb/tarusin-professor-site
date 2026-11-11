import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Phone,
  Pencil,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Trash2,

} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calcAgeText } from "@/lib/surgery/referral";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferralEffectiveness } from "@/components/surgery/ReferralEffectiveness";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ACTIVE_STATUSES,
  REFERRAL_STATUSES,
  daysSince,
  formatRuDate,
  overdueLevel,
  plannedDateText,
  statusColor,
  statusLabel,
} from "@/lib/surgery/referral";

const levelStyles: Record<string, string> = {
  ok: "",
  warn: "bg-amber-50 dark:bg-amber-950/30",
  bad: "bg-orange-50 dark:bg-orange-950/30",
  critical: "bg-rose-50 dark:bg-rose-950/30",
};

export default function AdminSurgeryReferrals() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [notifyBusy, setNotifyBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("surgery_referrals")
      .select("*, items:surgery_referral_items(id, is_done)")
      .order("created_at", { ascending: false });
    if (error) toast.error("Не удалось загрузить путёвки", { description: error.message });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "active" && !ACTIVE_STATUSES.includes(r.status)) return false;
      if (statusFilter !== "active" && statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!term) return true;
      return (
        (r.full_name || "").toLowerCase().includes(term) ||
        (r.operation_name || "").toLowerCase().includes(term) ||
        (r.diagnosis || "").toLowerCase().includes(term)
      );
    });
  }, [rows, q, statusFilter]);

  const stats = useMemo(() => {
    const active = rows.filter((r) => ACTIVE_STATUSES.includes(r.status));
    const overdue = active.filter((r) => (daysSince(r.last_contact_at || r.created_at) ?? 0) >= 14);
    const lost = active.filter((r) => (daysSince(r.last_contact_at || r.created_at) ?? 0) >= 60);
    const soon = active.filter((r) => {
      if (!r.planned_date_from) return false;
      const d = (new Date(r.planned_date_from).getTime() - Date.now()) / 86400000;
      return d >= 0 && d <= 7;
    });
    return { active: active.length, overdue: overdue.length, lost: lost.length, soon: soon.length };
  }, [rows]);

  const setStatus = async (row: any, status: string, comment?: string) => {
    const { error } = await supabase
      .from("surgery_referrals")
      .update({ status, last_contact_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) {
      toast.error("Не удалось обновить статус", { description: error.message });
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("surgery_referral_events").insert({
      referral_id: row.id,
      event_type: "status_change",
      status,
      comment: comment || null,
      actor: u?.user?.id || null,
    });
    toast.success(`Статус: ${statusLabel(status)}`);
    load();
  };

  const logCall = async (row: any, comment: string) => {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("surgery_referral_events").insert({
      referral_id: row.id,
      event_type: "call",
      comment: comment || "Связались с пациентом",
      actor: u?.user?.id || null,
    });
    await supabase
      .from("surgery_referrals")
      .update({ last_contact_at: new Date().toISOString() })
      .eq("id", row.id);
    toast.success("Контакт зафиксирован");
    load();
  };

  const removeReferral = async (row: any) => {
    const ok = window.confirm(
      `Удалить путёвку «${row.full_name}» (выдана ${formatRuDate(row.created_at)})?\n\nБудут удалены перечень обследований и журнал по этой путёвке. Действие необратимо.`
    );
    if (!ok) return;
    const { error } = await supabase.from("surgery_referrals").delete().eq("id", row.id);
    if (error) {
      toast.error("Не удалось удалить путёвку", { description: error.message });
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== row.id));
    toast.success("Путёвка удалена");
  };

  const runNotify = async () => {
    setNotifyBusy(true);

    try {
      const { data, error } = await supabase.functions.invoke("surgery-referral-notify", { body: { manual: true } });
      if (error) throw error;
      toast.success("Напоминания разосланы", {
        description: `Пациентам: ${data?.patient_reminders ?? 0}, сводка координатору: ${data?.digest_sent ? "да" : "нет"}`,
      });
      load();
    } catch (e: any) {
      toast.error("Не удалось отправить напоминания", { description: e?.message || String(e) });
    } finally {
      setNotifyBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 mr-1" /> Админ-панель
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={runNotify} disabled={notifyBusy} className="gap-1">
              {notifyBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Разослать напоминания
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-1">
              <Link to="/admin/surgery-referrals/settings">
                <Settings className="h-4 w-4" /> Настройки и памятка
              </Link>
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold">Путёвки на операцию</h1>
          <p className="text-sm text-muted-foreground">
            Мониторинг предоперационных пациентов: подготовка, сроки, напоминания.
          </p>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Все путёвки</TabsTrigger>
            <TabsTrigger value="effectiveness">Анализ эффективности</TabsTrigger>
          </TabsList>
          <TabsContent value="effectiveness" className="mt-4">
            {loading ? null : <ReferralEffectiveness referrals={rows} onDelete={removeReferral} />}
          </TabsContent>
          <TabsContent value="list" className="mt-4 space-y-4">

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Активные путёвки", value: stats.active, icon: CheckCircle2 },
            { label: "Без движения ≥ 14 дней", value: stats.overdue, icon: AlertTriangle },
            { label: "Пропали ≥ 60 дней", value: stats.lost, icon: AlertTriangle },
            { label: "Операция в течение 7 дней", value: stats.soon, icon: Printer },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{s.value}</CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Поиск по ФИО, операции, диагнозу" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Только активные</SelectItem>
              <SelectItem value="all">Все статусы</SelectItem>
              {REFERRAL_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Путёвок нет. Выдайте путёвку из протокола осмотра.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => {
              const days = daysSince(r.last_contact_at || r.created_at);
              const level = overdueLevel(days);
              const total = (r.items || []).length;
              const done = (r.items || []).filter((i: any) => i.is_done).length;
              return (
                <Card key={r.id} className={levelStyles[level]}>
                  <CardContent className="py-3 flex gap-3 flex-wrap items-center">
                    <div className="flex-1 min-w-[220px]">
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.operation_name || "операция не указана"} · срок:{" "}
                        {plannedDateText(r.planned_date_from, r.planned_date_to)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Выдана {formatRuDate(r.created_at)} · обследования {done}/{total} · без движения{" "}
                        {days ?? 0} дн.
                      </div>
                    </div>
                    <Badge className={`${statusColor(r.status)} text-white`}>{statusLabel(r.status)}</Badge>
                    <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
                      <SelectTrigger className="w-[190px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERRAL_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ReferralEditDialog row={r} onSaved={(updated) => setRows((prev) => prev.map((item) => item.id === r.id ? { ...item, ...updated } : item))} />
                    <CallDialog onSave={(c) => logCall(r, c)} />
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/surgery-referrals/${r.id}/print`}>
                        <Printer className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/s/${r.public_hash}`} target="_blank" rel="noreferrer">
                        Ссылка пациента
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/40 hover:bg-destructive/10"
                      onClick={() => removeReferral(r)}
                      title="Удалить путёвку"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CallDialog({ onSave }: { onSave: (comment: string) => void }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Phone className="h-4 w-4" /> Звонок
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Зафиксировать контакт с пациентом</DialogTitle>
        </DialogHeader>
        <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Что обсудили" />
        <DialogFooter>
          <Button
            onClick={() => {
              onSave(comment);
              setComment("");
              setOpen(false);
            }}
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReferralEditDialog({ row, onSaved }: { row: any; onSaved: (updated: any) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const fields = [
    ["full_name", "ФИО пациента"], ["birth_date", "Дата рождения"],
    ["diagnosis", "Диагноз"], ["operation_name", "Планируемая операция"],
    ["coordinator_name", "Координатор"], ["coordinator_phone", "Телефон координатора"],
    ["patient_email", "Электронная почта пациента"], ["coordinator_instruction", "Инструкция для связи"],
    ["internal_notes", "Внутренние примечания"],
  ];
  const save = async () => {
    if (!draft.full_name?.trim()) { toast.error("Укажите ФИО пациента"); return; }
    if (draft.planned_date_to && (!draft.planned_date_from || draft.planned_date_to < draft.planned_date_from)) {
      toast.error("Конец интервала не может быть раньше начала"); return;
    }
    setSaving(true);
    try {
      const update: Record<string, any> = Object.fromEntries(fields.map(([key]) => [key, draft[key]?.trim() || null]));
      update.age_text = calcAgeText(draft.birth_date);
      update.status = draft.status;
      update.planned_date_from = draft.planned_date_from || null;
      update.planned_date_to = draft.planned_date_to || null;
      const { data, error } = await supabase.from("surgery_referrals").update(update).eq("id", row.id).select().single();
      if (error) throw error;
      onSaved(data); setOpen(false); toast.success("Путёвка сохранена");
    } catch { toast.error("Не удалось сохранить путёвку"); }
    finally { setSaving(false); }
  };
  return <Dialog open={open} onOpenChange={(value) => { if (saving) return; if (value) setDraft({ ...row }); setOpen(value); }}>
    <DialogTrigger asChild><Button variant="outline" size="sm" title="Редактировать путёвку" aria-label={`Редактировать путёвку ${row.full_name}`}><Pencil className="h-4 w-4" /></Button></DialogTrigger>
    <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Редактировать путёвку</DialogTitle></DialogHeader>
      {fields.map(([key, label]) => <label key={key} className="grid gap-1 text-sm">{label}
        {["diagnosis", "internal_notes", "coordinator_instruction"].includes(key)
          ? <Textarea value={draft[key] || ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
          : <Input type={key === "birth_date" ? "date" : key === "patient_email" ? "email" : "text"} value={draft[key] || ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />}
      </label>)}
      <label className="grid gap-1 text-sm">Статус<Select value={draft.status} onValueChange={(status) => setDraft({ ...draft, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REFERRAL_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></label>
      {[['planned_date_from', 'Дата операции / начало интервала'], ['planned_date_to', 'Конец интервала']].map(([key, label]) => <div key={key} className="grid gap-1 text-sm">{label}<div className="flex gap-2">
        <Input aria-label={label} type="date" value={draft[key] || ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
        <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" aria-label={`Календарь: ${label}`}>{draft[key] ? formatRuDate(draft[key]) : "Дата"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="end" side="bottom" collisionPadding={12}><Calendar mode="single" fixedWeeks selected={draft[key] ? new Date(draft[key] + "T00:00:00") : undefined} defaultMonth={draft.planned_date_from ? new Date(draft.planned_date_from + "T00:00:00") : undefined} onSelect={(date) => setDraft({ ...draft, [key]: date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}` : "" })} /></PopoverContent></Popover>
      </div></div>)}
      <DialogFooter><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Отмена</Button><Button disabled={saving} onClick={save}>{saving ? "Сохранение…" : "Сохранить"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
