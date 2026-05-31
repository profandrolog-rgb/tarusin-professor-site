import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PostOpDay3Data } from "@/lib/visits/protocolSchemas";
import { SmartFieldLabel } from "../SmartTemplates";


interface Props {
  data: PostOpDay3Data;
  onChange: (patch: Partial<PostOpDay3Data>) => void;
}

export function PostOpDay3Form({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Название операции</Label>
          <Input value={data.operation_name || ""} onChange={(e) => onChange({ operation_name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Дата операции</Label>
          <Input type="date" value={data.operation_date || ""} onChange={(e) => onChange({ operation_date: e.target.value })} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Температура</Label>
          <Input value={data.temperature || ""} onChange={(e) => onChange({ temperature: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Болевой синдром</Label>
          <Input value={data.pain || ""} onChange={(e) => onChange({ pain: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="general_status">Общее состояние</SmartFieldLabel>
        <Textarea rows={2} value={data.general_status || ""} onChange={(e) => onChange({ general_status: e.target.value })} />
      </div>
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="wound_status">Состояние раны</SmartFieldLabel>
        <Textarea rows={3} value={data.wound_status || ""} onChange={(e) => onChange({ wound_status: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Перевязка</Label>
        <Textarea rows={2} value={data.dressing || ""} onChange={(e) => onChange({ dressing: e.target.value })} />
      </div>
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="complaints">Жалобы</SmartFieldLabel>
        <Textarea rows={2} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>УЗИ экспресс</Label>
        <Textarea rows={3} value={data.uzi_express || ""} onChange={(e) => onChange({ uzi_express: e.target.value })} />
      </div>
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
        <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
      </div>
    </div>
  );
}
