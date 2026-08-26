import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Loader2, Plus, Stethoscope, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { calcAgeText, DEFAULT_MEMO_BODY, plannedDateText } from "@/lib/surgery/referral";

interface Props {
  patientId?: string | null;
  patientName?: string | null;
  birthDate?: string | null;
  visitId?: string | null;
  /** данные текущего протокола — для подстановки диагноза/заключения */
  protocolData?: any;
}

interface ExamRow {
  id: string;
  name: string;
  note?: string | null;
  group_name?: string | null;
  valid_days?: number | null;
  is_default: boolean;
  sort_order: number;
  checked: boolean;
  custom?: boolean;
}

const toIso = (d?: Date) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null);

export function SurgeryReferralDialog({ patientId, patientName, birthDate, visitId, protocolData }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(patientName || "");
  const [bd, setBd] = useState(birthDate || "");
  const [ageText, setAgeText] = useState(calcAgeText(birthDate));
  const [diagnosis, setDiagnosis] = useState("");
  const [operationName, setOperationName] = useState("");
  const [rangeMode, setRangeMode] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [newExam, setNewExam] = useState("");
  const [memoTitle, setMemoTitle] = useState("Памятка пациенту, которому предстоит оперативное лечение");
  const [memoBody, setMemoBody] = useState(DEFAULT_MEMO_BODY);
  const [coordName, setCoordName] = useState("Надежда Александровна");
  const [coordPhone, setCoordPhone] = useState("+7 903 005-61-11");
  const [coordInstruction, setCoordInstruction] = useState(
    "По этому номеру в Telegram, WhatsApp или MAX нужно переслать первый лист путёвки."
  );
  const [operations, setOperations] = useState<string[]>([]);

  const protocolDiagnosis = useMemo(() => {
    const d = protocolData || {};
    return [d.diagnosis, d.working_diagnosis, d.conclusion, d.icd10_name]
      .filter((x) => typeof x === "string" && x.trim())
      .join("\n");
  }, [protocolData]);

  /** Явно указанная в протоколе операция */
  const protocolOperation = useMemo(() => {
    const d = protocolData || {};
    const direct = [d.operation_name, d.planned_operation, d.surgery_name, d.operation]
      .find((x) => typeof x === "string" && x.trim());
    return (direct as string | undefined)?.trim() || "";
  }, [protocolData]);

  /** Текст протокола, в котором ищем операцию из каталога (план, рекомендации, заключение) */
  const protocolText = useMemo(() => {
    const d = protocolData || {};
    return [d.recommendations, d.conclusion, d.exam_plan, d.treatment_plan, d.consultation_notes, d.diagnosis]
      .filter((x) => typeof x === "string" && x.trim())
      .join("\n")
      .toLowerCase();
  }, [protocolData]);

  useEffect(() => {
    if (!open) return;
    setFullName(patientName || "");
    setBd(birthDate || "");
    setAgeText(calcAgeText(birthDate));
    setDiagnosis(protocolDiagnosis);
    // Путёвка обычно выдаётся в день консультации — подставляем сегодняшнюю дату
    setDateFrom((prev) => prev || new Date());
    if (protocolOperation) setOperationName(protocolOperation);
    (async () => {
      const [{ data: catalog }, { data: memo }, { data: ops }] = await Promise.all([
        supabase.from("surgery_exam_catalog").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("surgery_memo_templates").select("*").eq("is_active", true).maybeSingle(),
        supabase.from("surgery_catalog").select("name").order("name").limit(300),
      ]);
      setExams(
        (catalog || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          note: c.note,
          group_name: c.group_name,
          valid_days: c.valid_days,
          is_default: c.is_default,
          sort_order: c.sort_order,
          checked: !!c.is_default,
        }))
      );
      if (memo) {
        setMemoTitle(memo.title || memoTitle);
        setMemoBody(memo.body || DEFAULT_MEMO_BODY);
        setCoordName(memo.coordinator_name || coordName);
        setCoordPhone(memo.coordinator_phone || coordPhone);
        setCoordInstruction(memo.coordinator_instruction || coordInstruction);
      }
      const opNames = ((ops || []) as any[]).map((o) => o.name).filter(Boolean) as string[];
      setOperations(opNames);
      // Синхронизация с консультацией: если операция явно не указана,
      // ищем в тексте протокола название операции из каталога (берём самое длинное совпадение)
      if (!protocolOperation && protocolText) {
        const match = opNames
          .filter((n) => n.length > 3 && protocolText.includes(n.toLowerCase()))
          .sort((a, b) => b.length - a.length)[0];
        if (match) setOperationName(match);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const groups = useMemo(() => {
    const map = new Map<string, ExamRow[]>();
    for (const e of exams) {
      const key = e.group_name || "Прочее";
      map.set(key, [...(map.get(key) || []), e]);
    }
    return Array.from(map.entries());
  }, [exams]);

  const addCustomExam = () => {
    const name = newExam.trim();
    if (!name) return;
    setExams((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name,
        group_name: "Дополнительно",
        is_default: false,
        sort_order: 999,
        checked: true,
        custom: true,
      },
    ]);
    setNewExam("");
  };

  const save = async () => {
    if (!fullName.trim()) {
      toast.error("Укажите ФИО пациента");
      return;
    }
    if (!operationName.trim()) {
      toast.error("Укажите название операции", {
        description: "Без названия операции путёвку выдавать нельзя.",
      });
      return;
    }
    if (!dateFrom) {
      toast.error("Укажите дату операции", {
        description: rangeMode
          ? "Заполните начало диапазона сроков операции."
          : "Выберите дату операции или включите диапазон сроков.",
      });
      return;
    }
    if (rangeMode && !dateTo) {
      toast.error("Укажите конец диапазона сроков операции");
      return;
    }
    if (rangeMode && dateTo && dateTo < dateFrom) {
      toast.error("Конец диапазона раньше начала — проверьте сроки операции");
      return;
    }
    const chosen = exams.filter((e) => e.checked);
    if (chosen.length === 0) {
      toast.error("Отметьте хотя бы одно обследование");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: ref, error } = await supabase
        .from("surgery_referrals")
        .insert({
          patient_id: patientId || null,
          visit_id: visitId || null,
          full_name: fullName.trim(),
          birth_date: bd || null,
          age_text: ageText || null,
          diagnosis: diagnosis || null,
          operation_name: operationName || null,
          planned_date_from: toIso(dateFrom),
          planned_date_to: rangeMode ? toIso(dateTo) : toIso(dateFrom),
          status: "issued",
          memo_title: memoTitle,
          memo_body: memoBody,
          coordinator_name: coordName,
          coordinator_phone: coordPhone,
          coordinator_instruction: coordInstruction,
          created_by: userData?.user?.id || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: itemsErr } = await supabase.from("surgery_referral_items").insert(
        chosen.map((e, i) => ({
          referral_id: ref.id,
          name: e.name,
          note: e.note || null,
          valid_days: e.valid_days ?? null,
          sort_order: i,
        }))
      );
      if (itemsErr) throw itemsErr;

      await supabase.from("surgery_referral_events").insert({
        referral_id: ref.id,
        event_type: "issued",
        status: "issued",
        comment: "Путёвка выдана из протокола осмотра",
        actor: userData?.user?.id || null,
      });

      toast.success("Путёвка создана");
      setOpen(false);
      navigate(`/admin/surgery-referrals/${ref.id}/print`);
    } catch (e: any) {
      toast.error("Не удалось создать путёвку", { description: e?.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Stethoscope className="h-4 w-4" /> Выдать путёвку на операцию
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Путёвка на оперативное лечение</DialogTitle>
          <DialogDescription>
            Поля заполнены из текущего протокола — проверьте и при необходимости отредактируйте.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2 space-y-1">
              <Label>Фамилия, имя, отчество</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Дата рождения</Label>
              <Input
                type="date"
                value={bd || ""}
                onChange={(e) => {
                  setBd(e.target.value);
                  setAgeText(calcAgeText(e.target.value));
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Возраст</Label>
              <Input value={ageText} onChange={(e) => setAgeText(e.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>Название операции <span className="text-destructive">*</span></Label>
              <Input
                value={operationName}
                onChange={(e) => setOperationName(e.target.value)}
                list="surgery-ops-list"
                placeholder="например, лапароскопическая варикоцелэктомия"
              />
              <datalist id="surgery-ops-list">
                {operations.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
              {operations.length ? (
                <Select value={operations.includes(operationName) ? operationName : ""} onValueChange={setOperationName}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Выбрать из каталога операций" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {operations.map((o) => (
                      <SelectItem key={o} value={o} className="text-xs">
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Диагноз / заключение</Label>
              {protocolDiagnosis ? (
                <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={() => setDiagnosis(protocolDiagnosis)}>
                  <Wand2 className="h-3.5 w-3.5" /> Взять из протокола
                </Button>
              ) : null}
            </div>
            <Textarea rows={3} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Label>Ориентировочный срок операции <span className="text-destructive">*</span></Label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={rangeMode} onCheckedChange={(v) => setRangeMode(v === true)} />
                интервал дат
              </label>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start gap-2", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4" />
                    {plannedDateText(toIso(dateFrom), rangeMode ? toIso(dateTo) : toIso(dateFrom))}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {rangeMode ? (
                    <Calendar
                      mode="range"
                      selected={{ from: dateFrom, to: dateTo }}
                      onSelect={(r: any) => {
                        setDateFrom(r?.from);
                        setDateTo(r?.to);
                      }}
                      numberOfMonths={2}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  ) : (
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  )}
                </PopoverContent>
              </Popover>
              {dateFrom ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                >
                  Сбросить
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <Label>Перечень обследований</Label>
            <ScrollArea className="h-64 pr-3">
              <div className="space-y-3">
                {groups.map(([group, rows]) => (
                  <div key={group} className="space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">{group}</div>
                    {rows.map((row) => (
                      <div key={row.id} className="flex items-start gap-2">
                        <Checkbox
                          className="mt-0.5"
                          checked={row.checked}
                          onCheckedChange={(v) =>
                            setExams((prev) => prev.map((e) => (e.id === row.id ? { ...e, checked: v === true } : e)))
                          }
                        />
                        <div className="flex-1 text-sm">
                          {row.name}
                          {row.note ? <span className="text-muted-foreground"> — {row.note}</span> : null}
                          {row.valid_days ? (
                            <span className="text-xs text-muted-foreground"> (действует {row.valid_days} дн.)</span>
                          ) : null}
                        </div>
                        {row.custom ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setExams((prev) => prev.filter((e) => e.id !== row.id))}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
                {exams.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Справочник обследований пуст — добавьте пункты ниже или заполните его в админке.
                  </div>
                ) : null}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                value={newExam}
                onChange={(e) => setNewExam(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomExam();
                  }
                }}
                placeholder="Добавить обследование"
              />
              <Button variant="outline" onClick={addCustomExam} className="gap-1">
                <Plus className="h-4 w-4" /> Добавить
              </Button>
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <Label>Памятка пациенту (редактируется в админке — раздел «Путёвки на операцию»)</Label>
            <Input value={memoTitle} onChange={(e) => setMemoTitle(e.target.value)} />
            <Textarea rows={6} value={memoBody} onChange={(e) => setMemoBody(e.target.value)} />
            <div className="grid gap-2 md:grid-cols-2">
              <Input value={coordName} onChange={(e) => setCoordName(e.target.value)} placeholder="Координатор" />
              <Input value={coordPhone} onChange={(e) => setCoordPhone(e.target.value)} placeholder="Телефон" />
            </div>
            <Textarea rows={2} value={coordInstruction} onChange={(e) => setCoordInstruction(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={save} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Создать и печатать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
