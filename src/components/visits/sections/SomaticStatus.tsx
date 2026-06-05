import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SmartFieldLabel } from "../SmartTemplates";

export interface SomaticStatusData {
  full_text?: string;
  general?: string;
  skin?: string;
  lymph_nodes?: string;
  respiratory?: string;
  cardiovascular?: string;
  abdomen?: string;
  kidneys?: string;
  physiological?: string;
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
  general:
    "Самочувствие хорошее. Общее состояние удовлетворительное. В сознании, контактен, адекватен, ориентирован в месте и времени, критичен, фон настроения ровный. Двигательная активность нормативная, не ограничена. Шкала Глазго = 15 баллов.",
  skin:
    "Кожные покровы и видимые слизистые оболочки обычной окраски, чистые. Язык влажный, чистый.",
  lymph_nodes:
    "Периферические лимфатические узлы не увеличены, безболезненны.",
  respiratory:
    "Носовое дыхание свободное. Зев не гиперемирован. Миндалины не увеличены. Дыхание везикулярное, проводится во все отделы, хрипов нет. ЧДД 16 в минуту.",
  cardiovascular:
    "Тоны сердца ясные, ритмичные. ЧСС соответствует пульсу. Дополнительных сердечных шумов не выслушивается. Границы сердца не расширены.",
  abdomen:
    "Живот спокойный, участвует в дыхании, мягкий, безболезненный во всех отделах. Симптомы раздражения брюшины при осмотре не выявлено. Печень и селезёнка не увеличены.",
  kidneys:
    "Область почек не изменена. Симптом поколачивания отрицательный с обеих сторон.",
  physiological:
    "Мочится свободно, стул регулярный, оформленный.",
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
      {data.full_text ? (
        <div className="space-y-1">
          <SmartFieldLabel fieldKey="somatic_full_text" value={data.full_text || ""} onSet={(v) => onChange({ full_text: v })}>Полный соматический статус</SmartFieldLabel>
          <Textarea rows={5} value={data.full_text || ""} onChange={(e) => onChange({ full_text: e.target.value })} />
        </div>
      ) : null}
      <div className="space-y-1"><SmartFieldLabel fieldKey="general_status" value={data.general || ""} onSet={(v) => onChange({ general: v })}>Общее состояние</SmartFieldLabel><Textarea rows={3} value={data.general || ""} onChange={(e) => onChange({ general: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_skin" value={data.skin || ""} onSet={(v) => onChange({ skin: v })}>Кожные покровы и слизистые</SmartFieldLabel><Textarea rows={2} value={data.skin || ""} onChange={(e) => onChange({ skin: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_lymph_nodes" value={data.lymph_nodes || ""} onSet={(v) => onChange({ lymph_nodes: v })}>Лимфатические узлы</SmartFieldLabel><Textarea rows={2} value={data.lymph_nodes || ""} onChange={(e) => onChange({ lymph_nodes: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_respiratory" value={data.respiratory || ""} onSet={(v) => onChange({ respiratory: v })}>Органы дыхания</SmartFieldLabel><Textarea rows={2} value={data.respiratory || ""} onChange={(e) => onChange({ respiratory: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_cardiovascular" value={data.cardiovascular || ""} onSet={(v) => onChange({ cardiovascular: v })}>Сердечно-сосудистая система</SmartFieldLabel><Textarea rows={2} value={data.cardiovascular || ""} onChange={(e) => onChange({ cardiovascular: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_abdomen" value={data.abdomen || ""} onSet={(v) => onChange({ abdomen: v })}>Живот</SmartFieldLabel><Textarea rows={2} value={data.abdomen || ""} onChange={(e) => onChange({ abdomen: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_kidneys" value={data.kidneys || ""} onSet={(v) => onChange({ kidneys: v })}>Область почек</SmartFieldLabel><Textarea rows={2} value={data.kidneys || ""} onChange={(e) => onChange({ kidneys: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="somatic_physiological" value={data.physiological || ""} onSet={(v) => onChange({ physiological: v })}>Физиологические отправления</SmartFieldLabel><Textarea rows={2} value={data.physiological || ""} onChange={(e) => onChange({ physiological: e.target.value })} /></div>
    </div>
  );
}
