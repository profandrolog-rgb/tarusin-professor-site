import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SmartFieldLabel } from "../SmartTemplates";

export interface SomaticStatusData {
  general?: string;
  skin?: string;
  lymph_nodes?: string;
  respiratory?: string;
  cardiovascular?: string;
  abdomen?: string;
  height_cm?: string;
  weight_kg?: string;
  bp?: string;
  pulse?: string;
}

interface Props {
  data: SomaticStatusData;
  onChange: (patch: Partial<SomaticStatusData>) => void;
}

export const DEFAULT_SOMATIC: SomaticStatusData = {
  general: "Состояние удовлетворительное. Сознание ясное. Положение активное.",
  skin: "Кожные покровы и видимые слизистые чистые, обычной окраски.",
  lymph_nodes: "Периферические лимфатические узлы не увеличены, безболезненны.",
  respiratory: "Дыхание везикулярное, проводится во все отделы, хрипов нет. ЧДД 16 в минуту.",
  cardiovascular: "Тоны сердца ясные, ритмичные. ЧСС соответствует пульсу.",
  abdomen: "Живот мягкий, безболезненный во всех отделах. Печень и селезёнка не увеличены.",
};

export function SomaticStatusSection({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1"><Label>Рост, см</Label><Input value={data.height_cm || ""} onChange={(e) => onChange({ height_cm: e.target.value })} /></div>
        <div className="space-y-1"><Label>Вес, кг</Label><Input value={data.weight_kg || ""} onChange={(e) => onChange({ weight_kg: e.target.value })} /></div>
        <div className="space-y-1"><Label>АД</Label><Input value={data.bp || ""} onChange={(e) => onChange({ bp: e.target.value })} placeholder="120/80" /></div>
        <div className="space-y-1"><Label>Пульс</Label><Input value={data.pulse || ""} onChange={(e) => onChange({ pulse: e.target.value })} /></div>
      </div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="general_status" value={data.general || ""} onSet={(v) => onChange({ general: v })}>Общее состояние</SmartFieldLabel><Textarea rows={2} value={data.general || ""} onChange={(e) => onChange({ general: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_skin" value={data.skin || ""} onSet={(v) => onChange({ skin: v })}>Кожные покровы</SmartFieldLabel><Textarea rows={2} value={data.skin || ""} onChange={(e) => onChange({ skin: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_lymph_nodes" value={data.lymph_nodes || ""} onSet={(v) => onChange({ lymph_nodes: v })}>Лимфатические узлы</SmartFieldLabel><Textarea rows={2} value={data.lymph_nodes || ""} onChange={(e) => onChange({ lymph_nodes: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_respiratory" value={data.respiratory || ""} onSet={(v) => onChange({ respiratory: v })}>Органы дыхания</SmartFieldLabel><Textarea rows={2} value={data.respiratory || ""} onChange={(e) => onChange({ respiratory: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_cardiovascular" value={data.cardiovascular || ""} onSet={(v) => onChange({ cardiovascular: v })}>Сердечно-сосудистая система</SmartFieldLabel><Textarea rows={2} value={data.cardiovascular || ""} onChange={(e) => onChange({ cardiovascular: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_abdomen" value={data.abdomen || ""} onSet={(v) => onChange({ abdomen: v })}>Живот</SmartFieldLabel><Textarea rows={2} value={data.abdomen || ""} onChange={(e) => onChange({ abdomen: e.target.value })} /></div>
    </div>
  );
}
