import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartFieldLabel } from "../SmartTemplates";
import { SomaticStatusSection } from "../sections/SomaticStatus";
import { ClinicalHistorySection } from "../sections/ClinicalHistorySection";
import { GIRL_LOCAL_FIELDS, GIRL_PELVIS_FIELDS, GirlField } from "@/lib/visits/girlExam";

function FieldsGrid({ fields, value, onChange }: { fields: GirlField[]; value: Record<string, string>; onChange: (p: Record<string, string>) => void }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {fields.map(([k, label]) => (
        <div key={k} className="space-y-1">
          <Label className="text-xs">{label}</Label>
          <Textarea rows={2} value={value?.[k] || ""} onChange={(e) => onChange({ [k]: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

export function GirlUrologyForm({ data, onChange, patientId, currentVisitId }: { data: any; onChange: (p: any) => void; patientId?: string | null; currentVisitId?: string | null }) {
  const noUzi = data?.no_uzi === true;
  return (
    <div className="space-y-6">
      <ClinicalHistorySection data={data} onChange={onChange} rows={4} patientId={patientId} currentVisitId={currentVisitId} />

      <div className="space-y-1">
        <Label>Результаты осмотра гинеколога</Label>
        <Textarea rows={3} value={data.gyn_exam || ""} onChange={(e) => onChange({ gyn_exam: e.target.value })} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Соматический статус</CardTitle></CardHeader>
        <CardContent>
          <SomaticStatusSection data={data.somatic || {}} onChange={(p) => onChange({ somatic: { ...(data.somatic || {}), ...p } })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Локальный осмотр</CardTitle></CardHeader>
        <CardContent>
          <FieldsGrid fields={GIRL_LOCAL_FIELDS} value={data.girl_local || {}} onChange={(p) => onChange({ girl_local: { ...(data.girl_local || {}), ...p } })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-sm">УЗИ органов малого таза</CardTitle>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={noUzi} onCheckedChange={(v) => onChange({ no_uzi: v === true })} />
            Без УЗИ (только консультация)
          </label>
        </CardHeader>
        <CardContent>
          {noUzi ? (
            <div className="text-xs text-muted-foreground">УЗИ не проводилось — раздел не печатается.</div>
          ) : (
            <FieldsGrid fields={GIRL_PELVIS_FIELDS} value={data.pelvis_uzi || {}} onChange={(p) => onChange({ pelvis_uzi: { ...(data.pelvis_uzi || {}), ...p } })} />
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1"><SmartFieldLabel fieldKey="conclusion">Заключение</SmartFieldLabel>
          <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
        </div>
        <div className="space-y-1"><SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
