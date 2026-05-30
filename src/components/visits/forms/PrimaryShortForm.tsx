import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrimaryShortData } from "@/lib/visits/protocolSchemas";
import { SomaticStatusSection } from "../sections/SomaticStatus";
import { LocalStatusAndrologySection } from "../sections/LocalStatusAndrology";
import { SexualFormulaSection } from "../sections/SexualFormula";
import { SmartFieldLabel } from "../SmartTemplates";

interface Props {
  data: PrimaryShortData;
  onChange: (patch: Partial<PrimaryShortData>) => void;
}

export function PrimaryShortForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1"><SmartFieldLabel fieldKey="complaints">Жалобы</SmartFieldLabel>
          <Textarea rows={4} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
        </div>
        <div className="space-y-1"><Label>Анамнез</Label>
          <Textarea rows={4} value={data.anamnesis || ""} onChange={(e) => onChange({ anamnesis: e.target.value })} />
        </div>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Соматический статус</CardTitle></CardHeader>
        <CardContent><SomaticStatusSection data={data.somatic || {}} onChange={(p) => onChange({ somatic: { ...(data.somatic || {}), ...p } })} /></CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-sm">Половая формула</CardTitle></CardHeader>
        <CardContent><SexualFormulaSection data={data.sexual_formula || {}} onChange={(p) => onChange({ sexual_formula: { ...(data.sexual_formula || {}), ...p } })} /></CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-sm">Локальный статус (андрологический)</CardTitle></CardHeader>
        <CardContent><LocalStatusAndrologySection data={data.local_status || {}} onChange={(p) => onChange({ local_status: { ...(data.local_status || {}), ...p } })} /></CardContent>
      </Card>

      {(data.sexual_formula_text || data.ortho_status || data.neuro_status || data.psych_status) !== undefined && (
        <div className="grid md:grid-cols-2 gap-4">
          {("sexual_formula_text" in data || data.sexual_formula_text) && (
            <div className="space-y-1"><Label>Половая формула (текст)</Label>
              <Textarea rows={2} value={data.sexual_formula_text || ""} onChange={(e) => onChange({ sexual_formula_text: e.target.value })} />
            </div>
          )}
          <div className="space-y-1"><Label>Ортопедический статус</Label>
            <Textarea rows={2} value={data.ortho_status || ""} onChange={(e) => onChange({ ortho_status: e.target.value })} />
          </div>
          <div className="space-y-1"><Label>Неврологический статус</Label>
            <Textarea rows={2} value={data.neuro_status || ""} onChange={(e) => onChange({ neuro_status: e.target.value })} />
          </div>
          <div className="space-y-1"><Label>Психологический статус</Label>
            <Textarea rows={2} value={data.psych_status || ""} onChange={(e) => onChange({ psych_status: e.target.value })} />
          </div>
        </div>
      )}

      <div className="space-y-1"><SmartFieldLabel fieldKey="conclusion">Заключение / Диагноз</SmartFieldLabel>
        <Textarea rows={3} value={data.diagnosis || ""} onChange={(e) => onChange({ diagnosis: e.target.value })} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1"><Label>План обследования</Label>
          <Textarea rows={4} value={data.exam_plan || ""} onChange={(e) => onChange({ exam_plan: e.target.value })} />
        </div>
        <div className="space-y-1"><SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>

          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
