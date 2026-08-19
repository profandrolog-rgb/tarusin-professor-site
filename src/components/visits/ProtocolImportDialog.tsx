import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, FileText, Sparkles, Trash2, UserPlus, Check } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PROTOCOL_TYPES, getProtocolLabel, type ProtocolType } from "@/lib/visits/protocolTypes";
import { normalizeImportedProtocolData } from "@/lib/visits/normalizeProtocolData";
import {
  extractProtocolSource, parseProtocolDocument, flattenProtocolData,
  setByPath, deleteByPath, type ParsedProtocol, type FlatField,
} from "@/lib/visits/protocolImport";

interface PatientOption {
  id: string;
  full_name: string;
  birth_date: string | null;
  history_number: string | null;
}

interface VisitOption {
  id: string;
  visit_date: string;
  protocol_type: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Если задан — пациент фиксирован (импорт из карточки пациента). */
  patientId?: string;
  patientName?: string;
  /** Если задан — можно дописать распознанное в открытый протокол. */
  currentVisitId?: string;
  /** Вызывается вместо записи в БД, когда импорт идёт в открытую форму. */
  onApply?: (parsed: ParsedProtocol) => void;
  /** Вызывается после сохранения нового/существующего визита. */
  onSaved?: (visitId: string) => void;
  /** Файл, подставляемый при открытии (массовый импорт). */
  initialFile?: File | null;
}

type Step = "source" | "review";
type Target = "new" | "existing" | "current";

export function ProtocolImportDialog({
  open, onOpenChange, patientId, patientName, currentVisitId, onApply, onSaved, initialFile,
}: Props) {
  const [step, setStep] = useState<Step>("source");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedProtocol | null>(null);
  const [protocolType, setProtocolType] = useState<ProtocolType>("primary_short");
  const [visitDate, setVisitDate] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [icdCode, setIcdCode] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [data, setData] = useState<Record<string, any>>({});
  const [unmapped, setUnmapped] = useState("");

  const [target, setTarget] = useState<Target>(currentVisitId ? "current" : "new");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [visitOptions, setVisitOptions] = useState<VisitOption[]>([]);
  const [existingVisitId, setExistingVisitId] = useState("");

  const reset = useCallback(() => {
    setStep("source");
    setPastedText("");
    setFile(null);
    setParsed(null);
    setData({});
    setUnmapped("");
    setDiagnosis("");
    setIcdCode("");
    setNextVisitDate("");
    setPatientSearch("");
    setPatientOptions([]);
    setSelectedPatient(null);
    setExistingVisitId("");
    setTarget(currentVisitId ? "current" : "new");
  }, [currentVisitId]);

  useEffect(() => {
    if (!open) reset();
    else if (initialFile) setFile(initialFile);
  }, [open, reset, initialFile]);


  // Поиск пациента по ФИО (когда пациент не задан извне)
  useEffect(() => {
    if (patientId || !patientSearch.trim() || patientSearch.trim().length < 2) {
      setPatientOptions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data: rows } = await supabase
        .from("patients")
        .select("id, full_name, birth_date, history_number")
        .ilike("full_name", `%${patientSearch.trim()}%`)
        .limit(10);
      if (!cancelled) setPatientOptions((rows as PatientOption[]) || []);
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [patientSearch, patientId]);

  const effectivePatientId = patientId || selectedPatient?.id || "";

  // Список визитов пациента для варианта «дописать в существующий»
  useEffect(() => {
    if (!effectivePatientId || target !== "existing") return;
    (async () => {
      const { data: rows } = await supabase
        .from("patient_visits")
        .select("id, visit_date, protocol_type")
        .eq("patient_id", effectivePatientId)
        .order("visit_date", { ascending: false })
        .limit(50);
      setVisitOptions((rows as VisitOption[]) || []);
    })();
  }, [effectivePatientId, target]);

  const handleParse = async () => {
    if (!file && !pastedText.trim()) {
      toast({ title: "Добавьте файл или вставьте текст протокола", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      let payload: {
        text?: string;
        fileData?: string;
        storageBucket?: string;
        storagePath?: string;
        fileName?: string;
      } = {};
      if (file) {
        const src = await extractProtocolSource(file);
        payload = {
          text: src.text,
          fileData: src.fileData,
          storageBucket: src.storageBucket,
          storagePath: src.storagePath,
          fileName: src.fileName,
        };
        if (pastedText.trim()) {
          payload.text = [payload.text, pastedText.trim()].filter(Boolean).join("\n\n");
        }

      } else {
        payload = { text: pastedText.trim(), fileName: "Вставленный текст" };
      }

      const result = await parseProtocolDocument(payload);
      setParsed(result);
      setProtocolType((result.protocol_type as ProtocolType) || "primary_short");
      setVisitDate(result.visit_date || format(new Date(), "yyyy-MM-dd"));
      setDiagnosis(result.diagnosis || "");
      setIcdCode(result.icd_code || "");
      setNextVisitDate(result.next_visit_date || "");
      setData(result.protocol_data || {});
      setUnmapped(result.unmapped || "");
      if (!patientId && result.patient?.full_name) {
        setPatientSearch(result.patient.full_name);
      }
      setStep("review");
    } catch (e) {
      toast({ title: "Не удалось распознать", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const fields: FlatField[] = useMemo(() => flattenProtocolData(data), [data]);

  const updateField = (path: string, value: string) => {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      setByPath(next, path, value);
      return next;
    });
  };

  const removeField = (path: string) => {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      deleteByPath(next, path);
      return next;
    });
  };

  const createPatientFromParsed = async () => {
    const name = parsed?.patient?.full_name?.trim() || patientSearch.trim();
    if (!name) {
      toast({ title: "В документе не найдено ФИО пациента", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: created, error } = await supabase
        .from("patients")
        .insert({
          full_name: name,
          birth_date: parsed?.patient?.birth_date || null,
          sex: parsed?.patient?.sex === "F" ? "F" : parsed?.patient?.sex === "M" ? "M" : null,
          history_number: parsed?.patient?.history_number || null,
        })
        .select("id, full_name, birth_date, history_number")
        .single();
      if (error) throw error;
      setSelectedPatient(created as PatientOption);
      toast({ title: "Пациент создан" });
    } catch (e) {
      toast({ title: "Не удалось создать пациента", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const normalized = normalizeImportedProtocolData(protocolType, data as any) as Record<string, any>;

    if (target === "current") {
      onApply?.({
        ...parsed,
        protocol_type: protocolType,
        visit_date: visitDate,
        diagnosis,
        icd_code: icdCode,
        next_visit_date: nextVisitDate,
        protocol_data: normalized,
        unmapped,
      });
      onOpenChange(false);
      return;
    }

    if (!effectivePatientId) {
      toast({ title: "Выберите пациента", variant: "destructive" });
      return;
    }
    if (target === "existing" && !existingVisitId) {
      toast({ title: "Выберите визит, в который дописать протокол", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (target === "existing") {
        const { data: current, error: loadErr } = await supabase
          .from("patient_visits")
          .select("protocol_data")
          .eq("id", existingVisitId)
          .single();
        if (loadErr) throw loadErr;
        const merged = { ...((current?.protocol_data as any) || {}), ...normalized };
        if (unmapped.trim()) merged._imported_unmapped = unmapped.trim();
        const { error } = await supabase
          .from("patient_visits")
          .update({
            protocol_data: merged,
            ...(diagnosis ? { diagnosis } : {}),
            ...(icdCode ? { icd_code: icdCode } : {}),
            ...(nextVisitDate ? { next_visit_date: nextVisitDate } : {}),
          })
          .eq("id", existingVisitId);
        if (error) throw error;
        toast({ title: "Протокол дописан в визит" });
        onSaved?.(existingVisitId);
      } else {
        const payload: Record<string, any> = { ...normalized };
        if (unmapped.trim()) payload._imported_unmapped = unmapped.trim();
        const { data: created, error } = await supabase
          .from("patient_visits")
          .insert({
            patient_id: effectivePatientId,
            visit_date: visitDate || format(new Date(), "yyyy-MM-dd"),
            protocol_type: protocolType,
            protocol_data: payload,
            diagnosis: diagnosis || null,
            icd_code: icdCode || null,
            next_visit_date: nextVisitDate || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        toast({ title: "Визит создан из документа" });
        onSaved?.((created as any).id);
      }
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Не удалось сохранить", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confidence = parsed?.confidence ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Импорт протокола из документа
          </DialogTitle>
          <DialogDescription>
            Word (.docx), PDF, скан или просто вставленный текст. Поля подбираются по смыслу — перед сохранением всё можно проверить и поправить.
          </DialogDescription>
        </DialogHeader>

        {step === "source" ? (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) setFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".docx,.pdf,.txt,.md,.rtf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted-foreground">({Math.round(file.size / 1024)} КБ)</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-7 w-7 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Перетащите документ или нажмите для выбора</p>
                  <p className="text-xs text-muted-foreground">.docx, .pdf, фото/скан, .txt — до 20 МБ</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>…или вставьте текст протокола</Label>
              <Textarea
                rows={8}
                placeholder="Вставьте текст старого протокола (можно вместе с таблицами)"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
            </div>

            <SystemReadinessButton label="Проверить готовность системы" />

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
              <Button onClick={handleParse} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Распознать
              </Button>
            </DialogFooter>

          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {confidence !== null && (
                <Badge variant={confidence >= 0.7 ? "default" : "secondary"}>
                  Уверенность: {Math.round(confidence * 100)}%
                </Badge>
              )}
              <Badge variant="outline">{fields.length} распознанных полей</Badge>
              {parsed?.patient?.full_name && (
                <Badge variant="outline">В документе: {parsed.patient.full_name}</Badge>
              )}
            </div>
            {parsed?.notes && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{parsed.notes}</p>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Тип протокола</Label>
                <Select value={protocolType} onValueChange={(v) => setProtocolType(v as ProtocolType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROTOCOL_TYPES.map((p) => (
                      <SelectItem key={p.key} value={p.key}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Дата визита</Label>
                <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Диагноз</Label>
                <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Код МКБ</Label>
                <Input value={icdCode} onChange={(e) => setIcdCode(e.target.value)} />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Куда записать</Label>
              <Select value={target} onValueChange={(v) => setTarget(v as Target)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currentVisitId && <SelectItem value="current">В открытый протокол (заполнить форму)</SelectItem>}
                  <SelectItem value="new">Новый визит</SelectItem>
                  <SelectItem value="existing">Дописать в существующий визит</SelectItem>
                </SelectContent>
              </Select>

              {target !== "current" && (
                patientId ? (
                  <p className="text-sm text-muted-foreground">
                    Пациент: <span className="font-medium text-foreground">{patientName || "выбран"}</span>
                  </p>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs">Пациент</Label>
                    {selectedPatient ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="font-medium">{selectedPatient.full_name}</span>
                        {selectedPatient.birth_date && (
                          <span className="text-muted-foreground">
                            {format(new Date(selectedPatient.birth_date), "dd.MM.yyyy")}
                          </span>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>Изменить</Button>
                      </div>
                    ) : (
                      <>
                        <Input
                          placeholder="Поиск по ФИО"
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                        />
                        {patientOptions.length > 0 && (
                          <div className="border rounded-md divide-y max-h-44 overflow-y-auto">
                            {patientOptions.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPatient(p)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                              >
                                <span className="font-medium">{p.full_name}</span>
                                {p.birth_date && (
                                  <span className="text-muted-foreground ml-2">
                                    {format(new Date(p.birth_date), "dd.MM.yyyy")}
                                  </span>
                                )}
                                {p.history_number && (
                                  <span className="text-muted-foreground ml-2 font-mono">№{p.history_number}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        <Button variant="outline" size="sm" onClick={createPatientFromParsed} disabled={saving}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Создать пациента из документа
                        </Button>
                      </>
                    )}
                  </div>
                )
              )}

              {target === "existing" && effectivePatientId && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Визит</Label>
                  <Select value={existingVisitId} onValueChange={setExistingVisitId}>
                    <SelectTrigger><SelectValue placeholder="Выберите визит" /></SelectTrigger>
                    <SelectContent>
                      {visitOptions.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {format(new Date(v.visit_date), "dd.MM.yyyy")} — {getProtocolLabel(v.protocol_type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Распознанные поля — проверьте перед сохранением</Label>
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">Полей не распознано. Вернитесь назад и добавьте более полный документ.</p>
              ) : (
                fields.map((f) => (
                  <div key={f.path} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs text-muted-foreground">{f.label}</Label>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-destructive" onClick={() => removeField(f.path)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Textarea
                      rows={f.value.length > 120 ? 3 : 1}
                      value={f.value}
                      onChange={(e) => updateField(f.path, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                ))
              )}
            </div>

            {unmapped && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Не разложено по полям (сохранится как примечание)</Label>
                <Textarea rows={4} value={unmapped} onChange={(e) => setUnmapped(e.target.value)} className="text-sm" />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("source")}>Назад</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {target === "current" ? "Заполнить форму" : target === "existing" ? "Дописать в визит" : "Создать визит"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ProtocolImportDialog;
