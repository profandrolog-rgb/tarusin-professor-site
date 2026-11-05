import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AbdominalUziSection } from "../sections/AbdominalUziSection";
import { ClinicalHistorySection } from "../sections/ClinicalHistorySection";
import type { AbdominalUziData } from "@/lib/visits/abdominalUzi";

export function AbdominalUziForm({ data, onChange, patientId, currentVisitId }: {
  data: { complaints?: string; anamnesis?: string; dynamics?: string; indications?: string; device?: string; recommendations?: string; abdominal_uzi?: AbdominalUziData };
  onChange: (patch: Partial<typeof data>) => void;
  patientId?: string | null;
  currentVisitId?: string | null;
}) {
  return <div className="space-y-4">
    <ClinicalHistorySection data={data} onChange={onChange} rows={3} patientId={patientId} currentVisitId={currentVisitId} />
    <div className="space-y-1"><Label>Показания к исследованию</Label>
      <Textarea rows={2} value={data.indications || ""} onChange={(e) => onChange({ indications: e.target.value })} />
    </div>
    <div className="space-y-1"><Label>Аппарат / датчик</Label>
      <Input value={data.device || ""} onChange={(e) => onChange({ device: e.target.value })} />
    </div>
    <AbdominalUziSection standalone data={data.abdominal_uzi} onChange={(v) => onChange({ abdominal_uzi: v })} />
    <div className="space-y-1"><Label>Рекомендации</Label>
      <Textarea rows={3} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
    </div>
  </div>;
}
