import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PostOpDay7Data } from "@/lib/visits/protocolSchemas";
import { SmartFieldLabel } from "../SmartTemplates";


interface Props {
  data: PostOpDay7Data;
  onChange: (patch: Partial<PostOpDay7Data>) => void;
}

export function PostOpDay7Form({ data, onChange }: Props) {
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
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="general_status">Общее состояние</SmartFieldLabel>
        <Textarea rows={2} value={data.general_status || ""} onChange={(e) => onChange({ general_status: e.target.value })} />
      </div>
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="wound_status">Состояние раны</SmartFieldLabel>
        <Textarea rows={3} value={data.wound_status || ""} onChange={(e) => onChange({ wound_status: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Заживление</Label>
        <Input value={data.healing || ""} onChange={(e) => onChange({ healing: e.target.value })} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="sutures_removed"
          checked={!!data.sutures_removed}
          onCheckedChange={(v) => onChange({ sutures_removed: !!v })}
        />
        <Label htmlFor="sutures_removed" className="cursor-pointer">Швы сняты</Label>
      </div>
      <div className="space-y-1">
        <Label>Жалобы</Label>
        <Textarea rows={2} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
      </div>
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
        <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
      </div>
    </div>
  );
}
