import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UltrashortData } from "@/lib/visits/protocolSchemas";
import { SmartFieldLabel } from "../SmartTemplates";

interface Props {
  data: UltrashortData;
  onChange: (patch: Partial<UltrashortData>) => void;
}

export function UltrashortForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="complaints">Жалобы</SmartFieldLabel>
        <Textarea rows={3} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
      </div>
      <div className="space-y-1">
        <SmartFieldLabel value={data.local_status || ""} onSet={(v) => onChange({ local_status: v })}>Локальный статус</SmartFieldLabel>
        <Textarea rows={3} value={data.local_status || ""} onChange={(e) => onChange({ local_status: e.target.value })} />
      </div>
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="conclusion">Заключение / краткое резюме консультации</SmartFieldLabel>
        <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
      </div>
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
        <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
      </div>
    </div>
  );
}
