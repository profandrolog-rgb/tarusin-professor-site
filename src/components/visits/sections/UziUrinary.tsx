import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface UziUrinaryData {
  device?: string;
  right_kidney_size?: string;
  right_kidney_parenchyma?: string;
  right_kidney_pelvis?: string;
  right_kidney_structure?: string;
  left_kidney_size?: string;
  left_kidney_parenchyma?: string;
  left_kidney_pelvis?: string;
  left_kidney_structure?: string;
  ureters?: string;
  bladder_volume?: string;
  bladder_walls?: string;
  bladder_contents?: string;
  residual_urine?: string;
  conclusion?: string;
}

interface Props {
  data: UziUrinaryData;
  onChange: (patch: Partial<UziUrinaryData>) => void;
}

export const DEFAULT_UZI_URINARY: UziUrinaryData = {
  device: "УЗ-сканер с конвексным датчиком 3,5–5 МГц",
  right_kidney_parenchyma: "Не истончена, эхогенность не изменена. Кортико-медуллярная дифференциация сохранена.",
  right_kidney_pelvis: "Не расширена.",
  right_kidney_structure: "Положение типичное, контуры ровные. Конкрементов не выявлено.",
  left_kidney_parenchyma: "Не истончена, эхогенность не изменена. Кортико-медуллярная дифференциация сохранена.",
  left_kidney_pelvis: "Не расширена.",
  left_kidney_structure: "Положение типичное, контуры ровные. Конкрементов не выявлено.",
  ureters: "Не визуализируются, что соответствует норме.",
  bladder_walls: "Не утолщены, контуры ровные.",
  bladder_contents: "Содержимое однородное, эхо-негативное.",
  residual_urine: "Остаточной мочи нет / клинически незначимая.",
  conclusion: "УЗ-признаков патологии органов мочевыделительной системы не выявлено.",
};

export function UziUrinarySection({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1"><Label>Аппарат</Label>
        <Input value={data.device || ""} onChange={(e) => onChange({ device: e.target.value })} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2 p-3 border rounded-md">
          <div className="font-medium text-sm">Правая почка</div>
          <Input placeholder="Размеры (мм)" value={data.right_kidney_size || ""} onChange={(e) => onChange({ right_kidney_size: e.target.value })} />
          <Textarea rows={2} placeholder="Паренхима" value={data.right_kidney_parenchyma || ""} onChange={(e) => onChange({ right_kidney_parenchyma: e.target.value })} />
          <Textarea rows={2} placeholder="Лоханка" value={data.right_kidney_pelvis || ""} onChange={(e) => onChange({ right_kidney_pelvis: e.target.value })} />
          <Textarea rows={2} placeholder="Структура / положение" value={data.right_kidney_structure || ""} onChange={(e) => onChange({ right_kidney_structure: e.target.value })} />
        </div>
        <div className="space-y-2 p-3 border rounded-md">
          <div className="font-medium text-sm">Левая почка</div>
          <Input placeholder="Размеры (мм)" value={data.left_kidney_size || ""} onChange={(e) => onChange({ left_kidney_size: e.target.value })} />
          <Textarea rows={2} placeholder="Паренхима" value={data.left_kidney_parenchyma || ""} onChange={(e) => onChange({ left_kidney_parenchyma: e.target.value })} />
          <Textarea rows={2} placeholder="Лоханка" value={data.left_kidney_pelvis || ""} onChange={(e) => onChange({ left_kidney_pelvis: e.target.value })} />
          <Textarea rows={2} placeholder="Структура / положение" value={data.left_kidney_structure || ""} onChange={(e) => onChange({ left_kidney_structure: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1"><Label>Мочеточники</Label>
        <Textarea rows={2} value={data.ureters || ""} onChange={(e) => onChange({ ureters: e.target.value })} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Объём мочевого пузыря (мл)</Label>
          <Input value={data.bladder_volume || ""} onChange={(e) => onChange({ bladder_volume: e.target.value })} />
        </div>
        <div className="space-y-1"><Label>Остаточная моча</Label>
          <Input value={data.residual_urine || ""} onChange={(e) => onChange({ residual_urine: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1"><Label>Стенки мочевого пузыря</Label>
        <Textarea rows={2} value={data.bladder_walls || ""} onChange={(e) => onChange({ bladder_walls: e.target.value })} />
      </div>
      <div className="space-y-1"><Label>Содержимое</Label>
        <Textarea rows={2} value={data.bladder_contents || ""} onChange={(e) => onChange({ bladder_contents: e.target.value })} />
      </div>
      <div className="space-y-1"><Label>Заключение УЗИ</Label>
        <Textarea rows={3} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
      </div>
    </div>
  );
}
