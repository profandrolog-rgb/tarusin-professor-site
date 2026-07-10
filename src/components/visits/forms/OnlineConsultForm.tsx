import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";
import { SmartFieldLabel } from "../SmartTemplates";

export interface OnlineConsultData {
  reason?: string;
  complaints?: string;
  anamnesis?: string;
  prior_visit?: "yes" | "no" | "";
  prior_visit_date?: string;
  prior_visit_note?: string;
  current_state?: string;
  external_exam_by_photo?: boolean;
  external_exam_by_video?: boolean;
  external_genitalia?: string;
  interpretation?: string;
  conclusion?: string;
  recommendations?: string;
  channel?: string;
  duration_min?: number | string;
  exam_plan?: string;
  in_person_needed?: "yes" | "no" | "";
  in_person_urgency?: "plan" | "soon" | "urgent" | "";
}

export const EXTERNAL_GENITALIA_DEFAULT =
  "Наружные половые органы развиты по мужскому типу, яички в мошонке, семенные канатики не изменены, область паховых колец не изменена, половой член развит по возрасту, уретра в типичном положении, меатус в типичном положении, крайняя плоть открывается, половое развитие соответствует возрасту.";

interface Props {
  data: OnlineConsultData;
  onChange: (patch: Partial<OnlineConsultData>) => void;
}

export function OnlineConsultForm({ data, onChange }: Props) {
  const set = <K extends keyof OnlineConsultData>(k: K, v: OnlineConsultData[K]) =>
    onChange({ [k]: v } as Partial<OnlineConsultData>);

  return (
    <div className="space-y-5">
      {/* Технические сведения */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Сведения о консультации</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Канал связи</Label>
            <Select value={data.channel || ""} onValueChange={(v) => set("channel", v)}>
              <SelectTrigger><SelectValue placeholder="Выберите канал" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Zoom">Zoom</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp (видео)</SelectItem>
                <SelectItem value="Telegram">Telegram (видео)</SelectItem>
                <SelectItem value="MAX">MAX</SelectItem>
                <SelectItem value="Чат / переписка">Чат / переписка</SelectItem>
                <SelectItem value="Телефон">Телефон</SelectItem>
                <SelectItem value="Другое">Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Длительность, мин</Label>
            <Input type="number" min={0} value={data.duration_min ?? ""}
              onChange={(e) => set("duration_min", e.target.value ? Number(e.target.value) : "")} />
          </div>
          <div className="space-y-1">
            <Label>Повод обращения</Label>
            <Select value={data.reason || ""} onValueChange={(v) => set("reason", v)}>
              <SelectTrigger><SelectValue placeholder="Выберите повод" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Первичная онлайн-консультация">Первичная онлайн-консультация</SelectItem>
                <SelectItem value="Второе мнение">Второе мнение</SelectItem>
                <SelectItem value="Интерпретация анализов и исследований">Интерпретация анализов и исследований</SelectItem>
                <SelectItem value="Послеоперационное наблюдение">Послеоперационное наблюдение</SelectItem>
                <SelectItem value="Динамическое наблюдение">Динамическое наблюдение</SelectItem>
                <SelectItem value="Другое">Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Жалобы / Анамнез / Динамика — вертикально, широкими полями */}
      <ClinicalHistorySection
        data={data as any}
        onChange={(p) => onChange({ ...(data as any), ...(p as any) })}
        rows={4}
        patientId={patientId}
        currentVisitId={currentVisitId}
      />

      {/* Очный осмотр ранее */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Наличие очного осмотра профессора ранее</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup
            value={data.prior_visit || ""}
            onValueChange={(v) => set("prior_visit", v as "yes" | "no")}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="prior-yes" />
              <Label htmlFor="prior-yes">Да</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="prior-no" />
              <Label htmlFor="prior-no">Нет</Label>
            </div>
          </RadioGroup>
          {data.prior_visit === "yes" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Дата очного осмотра</Label>
                <Input type="date" value={data.prior_visit_date || ""}
                  onChange={(e) => set("prior_visit_date", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Кратко об осмотре</Label>
                <Input value={data.prior_visit_note || ""}
                  onChange={(e) => set("prior_visit_note", e.target.value)}
                  placeholder="Что было выполнено / выявлено" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Настоящее состояние */}
      <div className="space-y-1">
        <SmartFieldLabel value={data.current_state || ""} onSet={(v) => set("current_state", v)}>
          Настоящее состояние
        </SmartFieldLabel>
        <Textarea rows={4} value={data.current_state || ""}
          onChange={(e) => set("current_state", e.target.value)} />
      </div>

      {/* Состояние НПО */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Состояние наружных половых органов</CardTitle>
            <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs gap-1"
              onClick={() => set("external_genitalia", EXTERNAL_GENITALIA_DEFAULT)}>
              <Zap className="h-3 w-3" /> Стандарт
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox id="exam-photo"
                checked={!!data.external_exam_by_photo}
                onCheckedChange={(c) => set("external_exam_by_photo", c === true)} />
              <Label htmlFor="exam-photo">Осмотр по фото</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="exam-video"
                checked={!!data.external_exam_by_video}
                onCheckedChange={(c) => set("external_exam_by_video", c === true)} />
              <Label htmlFor="exam-video">Осмотр по видеосвязи</Label>
            </div>
          </div>
          <Textarea rows={5} value={data.external_genitalia || ""}
            onChange={(e) => set("external_genitalia", e.target.value)}
            placeholder="Описание состояния НПО — нажмите ⚡ Стандарт для вставки шаблона" />
        </CardContent>
      </Card>

      {/* Интерпретация */}
      <div className="space-y-1">
        <Label>Интерпретация полученных анализов и исследований</Label>
        <Textarea rows={5} value={data.interpretation || ""}
          onChange={(e) => set("interpretation", e.target.value)} />
      </div>

      {/* Заключение */}
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="conclusion">Заключение</SmartFieldLabel>
        <Textarea rows={4} value={data.conclusion || ""}
          onChange={(e) => set("conclusion", e.target.value)} />
      </div>

      {/* План дообследования и очный осмотр */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>План дообследования</Label>
          <Textarea rows={4} value={data.exam_plan || ""}
            onChange={(e) => set("exam_plan", e.target.value)}
            placeholder="Перечень исследований / анализов" />
        </div>
        <Card>
          <CardHeader><CardTitle className="text-sm">Необходимость очного осмотра</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <RadioGroup
              value={data.in_person_needed || ""}
              onValueChange={(v) => set("in_person_needed", v as "yes" | "no")}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="ip-yes" />
                <Label htmlFor="ip-yes">Требуется</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="ip-no" />
                <Label htmlFor="ip-no">Не требуется</Label>
              </div>
            </RadioGroup>
            {data.in_person_needed === "yes" && (
              <div className="space-y-1">
                <Label>Срочность</Label>
                <Select value={data.in_person_urgency || ""}
                  onValueChange={(v) => set("in_person_urgency", v as any)}>
                  <SelectTrigger><SelectValue placeholder="Выберите срочность" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plan">Планово (1–3 мес)</SelectItem>
                    <SelectItem value="soon">В ближайшее время (1–4 нед)</SelectItem>
                    <SelectItem value="urgent">Срочно (в течение недели)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Рекомендации */}
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
        <Textarea rows={4} value={data.recommendations || ""}
          onChange={(e) => set("recommendations", e.target.value)} />
      </div>
    </div>
  );
}
