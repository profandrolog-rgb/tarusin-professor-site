import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Phone,
  Printer,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
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
