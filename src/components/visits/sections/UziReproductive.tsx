import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export interface ArterialFlowSide {
  vmax?: string;
  vmin?: string;
  vmed?: string;
  ri?: string;
  pi?: string;
  acc?: string;
}

export interface ArterialFlowData {
  right?: ArterialFlowSide;
  left?: ArterialFlowSide;
}

export interface VenousFlowData {
  v_dir?: string;
  v_red?: string;
  v_rev?: string;
  t_ref?: string;
  acc_ref?: string;
  diameter_right?: string;
  diameter_left?: string;
}

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
  arterial_flow?: ArterialFlowData;
  venous_flow?: VenousFlowData;
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

const ARTERIAL_NORM: ArterialFlowData = {
  right: { vmax: "4-8", vmin: "1-3", vmed: "", ri: "0.62-0.72", pi: "0.9-1.2", acc: "" },
  left: { vmax: "4-8", vmin: "1-3", vmed: "", ri: "0.62-0.72", pi: "0.9-1.2", acc: "" },
};

const VENOUS_NORM: VenousFlowData = {
  v_dir: "0", v_red: "0", v_rev: "0", t_ref: "0", acc_ref: "0",
  diameter_right: "< 3", diameter_left: "< 3",
};

const ARTERIAL_PARAMS: { key: keyof ArterialFlowSide; label: string }[] = [
  { key: "vmax", label: "Vmax (см/с)" },
  { key: "vmin", label: "Vmin (см/с)" },
  { key: "vmed", label: "Vmed/T (см/с)" },
  { key: "ri", label: "RI" },
  { key: "pi", label: "PI" },
  { key: "acc", label: "Acc (см/с²)" },
];

const VENOUS_PARAMS: { key: keyof VenousFlowData; label: string }[] = [
  { key: "v_dir", label: "V dir — прямой (см/с)" },
  { key: "v_red", label: "V red — редуцированный (см/с)" },
  { key: "v_rev", label: "V rev — ретроградный, Вальсальва (см/с)" },
  { key: "t_ref", label: "T ref — время рефлюкса (сек)" },
  { key: "acc_ref", label: "Acc ref — ускорение рефлюкса (см/с²)" },
];

export function UziReproductiveSection({ data, onChange }: Props) {
  const arterial = data.arterial_flow || {};
  const venous = data.venous_flow || {};

  const setArt = (side: "right" | "left", key: keyof ArterialFlowSide, val: string) => {
    onChange({
      arterial_flow: {
        ...arterial,
        [side]: { ...(arterial[side] || {}), [key]: val },
      },
    });
  };
  const setVen = (key: keyof VenousFlowData, val: string) => {
    onChange({ venous_flow: { ...venous, [key]: val } });
  };

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
        </div>
        <div className="space-y-2 p-3 border rounded-md">
          <div className="font-medium text-sm">Левое яичко</div>
          <Input placeholder="Размеры (мм)" value={data.left_testis_size || ""} onChange={(e) => onChange({ left_testis_size: e.target.value })} />
          <Input placeholder="Объём (мл)" value={data.left_testis_volume || ""} onChange={(e) => onChange({ left_testis_volume: e.target.value })} />
          <Textarea rows={2} placeholder="Структура" value={data.left_testis_structure || ""} onChange={(e) => onChange({ left_testis_structure: e.target.value })} />
        </div>
      </div>

      {/* Артериальный кровоток */}
      <div className="p-3 border rounded-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">Артериальный кровоток</div>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ arterial_flow: ARTERIAL_NORM })}>
            <Zap className="h-3 w-3 mr-1" /> Норма
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left font-medium py-1 pr-2">Параметр</th>
                <th className="text-left font-medium py-1 px-2">Справа</th>
                <th className="text-left font-medium py-1 pl-2">Слева</th>
              </tr>
            </thead>
            <tbody>
              {ARTERIAL_PARAMS.map((p) => (
                <tr key={p.key} className="border-b last:border-b-0">
                  <td className="py-1 pr-2 text-muted-foreground">{p.label}</td>
                  <td className="py-1 px-2">
                    <Input className="h-8" value={arterial.right?.[p.key] || ""} onChange={(e) => setArt("right", p.key, e.target.value)} />
                  </td>
                  <td className="py-1 pl-2">
                    <Input className="h-8" value={arterial.left?.[p.key] || ""} onChange={(e) => setArt("left", p.key, e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Венозный кровоток */}
      <div className="p-3 border rounded-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">Венозный кровоток</div>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({ venous_flow: VENOUS_NORM })}>
            <Zap className="h-3 w-3 mr-1" /> Норма
          </Button>
        </div>
        <div className="space-y-2">
          {VENOUS_PARAMS.map((p) => (
            <div key={p.key} className="grid grid-cols-[1fr_auto] items-center gap-2">
              <Label className="text-xs text-muted-foreground">{p.label}</Label>
              <Input className="h-8 w-32" value={(venous[p.key] as string) || ""} onChange={(e) => setVen(p.key, e.target.value)} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <Label className="text-xs">Диаметр вен справа (мм)</Label>
              <Input className="h-8" value={venous.diameter_right || ""} onChange={(e) => setVen("diameter_right", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Диаметр вен слева (мм)</Label>
              <Input className="h-8" value={venous.diameter_left || ""} onChange={(e) => setVen("diameter_left", e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2 p-3 border rounded-md">
          <div className="font-medium text-sm">Правый придаток</div>
          <Textarea rows={2} value={data.right_epididymis || ""} onChange={(e) => onChange({ right_epididymis: e.target.value })} />
        </div>
        <div className="space-y-2 p-3 border rounded-md">
          <div className="font-medium text-sm">Левый придаток</div>
          <Textarea rows={2} value={data.left_epididymis || ""} onChange={(e) => onChange({ left_epididymis: e.target.value })} />
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
