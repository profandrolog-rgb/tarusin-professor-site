import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface UziReproductiveData {
  device?: string;
  right_testis_size?: string;
  right_testis_volume?: string;
  right_testis_structure?: string;
  left_testis_size?: string;
  left_testis_volume?: string;
  left_testis_structure?: string;
  right_epididymis?: string;
  left_epididymis?: string;
  vessels?: string;
  doppler?: string;
  free_fluid?: string;
  conclusion?: string;
}

interface Props {
  data: UziReproductiveData;
  onChange: (patch: Partial<UziReproductiveData>) => void;
}

export const DEFAULT_UZI_REPRODUCTIVE: UziReproductiveData = {
  device: "УЗ-сканер с линейным датчиком 7,5–12 МГц",
  right_testis_structure: "Эхоструктура однородная, эхогенность не изменена. Образований не выявлено.",
  left_testis_structure: "Эхоструктура однородная, эхогенность не изменена. Образований не выявлено.",
  right_epididymis: "Не увеличен, структура однородная.",
  left_epididymis: "Не увеличен, структура однородная.",
  vessels: "Вены гроздьевидного сплетения не расширены.",
  doppler: "При ЦДК кровоток сохранён, симметричный с обеих сторон.",
  free_fluid: "Свободной жидкости в оболочках яичек не определяется.",
  conclusion: "УЗ-признаков патологии органов мошонки не выявлено.",
};

export function UziReproductiveSection({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1"><Label>Аппарат</Label>
        <Input value={data.device || ""} onChange={(e) => onChange({ device: e.target.value })} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2 p-3 border rounded-md">
          <div className="font-medium text-sm">Правое яичко</div>
          <Input placeholder="Размеры (мм)" value={data.right_testis_size || ""} onChange={(e) => onChange({ right_testis_size: e.target.value })} />
          <Input placeholder="Объём (мл)" value={data.right_testis_volume || ""} onChange={(e) => onChange({ right_testis_volume: e.target.value })} />
          <Textarea rows={2} placeholder="Структура" value={data.right_testis_structure || ""} onChange={(e) => onChange({ right_testis_structure: e.target.value })} />
          <Textarea rows={2} placeholder="Придаток" value={data.right_epididymis || ""} onChange={(e) => onChange({ right_epididymis: e.target.value })} />
        </div>
        <div className="space-y-2 p-3 border rounded-md">
          <div className="font-medium text-sm">Левое яичко</div>
          <Input placeholder="Размеры (мм)" value={data.left_testis_size || ""} onChange={(e) => onChange({ left_testis_size: e.target.value })} />
          <Input placeholder="Объём (мл)" value={data.left_testis_volume || ""} onChange={(e) => onChange({ left_testis_volume: e.target.value })} />
          <Textarea rows={2} placeholder="Структура" value={data.left_testis_structure || ""} onChange={(e) => onChange({ left_testis_structure: e.target.value })} />
          <Textarea rows={2} placeholder="Придаток" value={data.left_epididymis || ""} onChange={(e) => onChange({ left_epididymis: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1"><Label>Сосудистый рисунок</Label>
        <Textarea rows={2} value={data.vessels || ""} onChange={(e) => onChange({ vessels: e.target.value })} />
      </div>
      <div className="space-y-1"><Label>ЦДК / допплер</Label>
        <Textarea rows={2} value={data.doppler || ""} onChange={(e) => onChange({ doppler: e.target.value })} />
      </div>
      <div className="space-y-1"><Label>Свободная жидкость</Label>
        <Textarea rows={2} value={data.free_fluid || ""} onChange={(e) => onChange({ free_fluid: e.target.value })} />
      </div>
      <div className="space-y-1"><Label>Заключение УЗИ</Label>
        <Textarea rows={3} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
      </div>
    </div>
  );
}
