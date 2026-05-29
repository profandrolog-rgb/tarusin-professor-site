import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UltrashortData } from "@/lib/visits/protocolSchemas";

interface Props {
  data: UltrashortData;
  onChange: (patch: Partial<UltrashortData>) => void;
}

export function UltrashortForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Жалобы</Label>
        <Textarea rows={3} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Заключение / краткое резюме консультации</Label>
        <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Рекомендации</Label>
        <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
      </div>
    </div>
  );
}
