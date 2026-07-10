import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RepeatWithLabsData } from "@/lib/visits/protocolSchemas";
import { LocalStatusAndrologySection } from "../sections/LocalStatusAndrology";
import { SmartFieldLabel } from "../SmartTemplates";
import { ClinicalHistorySection } from "../sections/ClinicalHistorySection";

interface Props {
  data: RepeatWithLabsData;
  onChange: (patch: Partial<RepeatWithLabsData>) => void;
  patientId?: string | null;
  currentVisitId?: string | null;
}

export function RepeatWithLabsForm({ data, onChange, patientId, currentVisitId }: Props) {
  return (
    <div className="space-y-6">
      <ClinicalHistorySection
        data={data as any}
        onChange={(p) => onChange(p as any)}
        rows={4}
        patientId={patientId}
        currentVisitId={currentVisitId}
      />


      <Card><CardHeader><CardTitle className="text-sm">Лабораторные данные</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><SmartFieldLabel value={data.cbc || ""} onSet={(v) => onChange({ cbc: v })}>Общий анализ крови</SmartFieldLabel>
            <Textarea rows={2} value={data.cbc || ""} onChange={(e) => onChange({ cbc: e.target.value })} />
          </div>
          <div className="space-y-1"><SmartFieldLabel value={data.urinalysis || ""} onSet={(v) => onChange({ urinalysis: v })}>Общий анализ мочи</SmartFieldLabel>
            <Textarea rows={2} value={data.urinalysis || ""} onChange={(e) => onChange({ urinalysis: e.target.value })} />
          </div>
          <div className="space-y-1"><SmartFieldLabel value={data.biochem || ""} onSet={(v) => onChange({ biochem: v })}>Биохимия крови</SmartFieldLabel>
            <Textarea rows={2} value={data.biochem || ""} onChange={(e) => onChange({ biochem: e.target.value })} />
          </div>
          <div className="space-y-1"><SmartFieldLabel value={data.hormones || ""} onSet={(v) => onChange({ hormones: v })}>Гормональный профиль</SmartFieldLabel>
            <Textarea rows={2} value={data.hormones || ""} onChange={(e) => onChange({ hormones: e.target.value })} />
          </div>
          <div className="space-y-1"><SmartFieldLabel value={data.other_labs || ""} onSet={(v) => onChange({ other_labs: v })}>Другие исследования</SmartFieldLabel>
            <Textarea rows={2} value={data.other_labs || ""} onChange={(e) => onChange({ other_labs: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-sm">Локальный статус</CardTitle></CardHeader>
        <CardContent><LocalStatusAndrologySection data={data.local_status || {}} onChange={(p) => onChange({ local_status: { ...(data.local_status || {}), ...p } })} /></CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1"><SmartFieldLabel fieldKey="conclusion">Заключение по обследованию</SmartFieldLabel>
          <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
        </div>
        <div className="space-y-1"><SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>
    </div>
  );
}
