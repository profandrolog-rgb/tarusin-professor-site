import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

export interface VenousFlowSide {
  v_dir?: string;
  v_red?: string;
  v_rev?: string;
  t_ref?: string;
  acc_ref?: string;
  diameter?: string;
}

export interface VenousFlowData {
  right?: VenousFlowSide;
  left?: VenousFlowSide;
}

export interface PenisExamData {
  structure?: string;
  right_cavernous_diameter?: string;
  left_cavernous_diameter?: string;
  spongious_diameter?: string;
  tunica?: string;
  dorsal_bundle?: string;
  dorsal_artery_vmax?: string;
  cavernous_arteries?: string;
  right_cavernous_artery?: string;
  left_cavernous_artery?: string;
  urethra?: string;
  conclusion?: string;
}

export interface ParaprostaticVeinsData {
  diameter?: string;
  reflux?: string;
}

export interface ProstateExamData {
  position?: string;
  syntopy?: string;
  pelvic_effusion?: string;
  prostate_volume?: string;
  middle_lobe_volume?: string;
  parenchyma?: string;
  capsule?: string;
  infravesical_obstruction?: string;
  urethra_internal_opening?: string;
  elastography_right?: string;
  elastography_left?: string;
  bladder_volume?: string;
  micturition_urge?: string;
  residual_urine_volume?: string;
  residual_urine_percent?: string;
  paraprostatic_veins?: ParaprostaticVeinsData;
  conclusion?: string;
}

export interface AortoMesentericData {
  aorta_structure?: string;
  sma_origin?: string;
  left_renal_vein_position?: string;
  retroaortic_component?: string;
  diameter_premesenteric?: string;
  diameter_intramesenteric?: string;
  diameter_postmesenteric?: string;
  ratio_pre_intra?: string;
  stenosis_flow_velocity?: string;
  conclusion?: string;
}

export interface IliacMayThurnerData {
  may_thurner_anatomy?: string;
  left_common_iliac_diameter?: string;
  flow_videographically?: string;
  compression_flow_velocity?: string;
  conclusion?: string;
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
  right_epididymis_volume?: string;
  left_epididymis?: string;
  left_epididymis_volume?: string;
  arterial_flow?: ArterialFlowData;
  venous_flow?: VenousFlowData;
  show_penis_exam?: boolean;
  penis_exam?: PenisExamData;
  show_prostate?: boolean;
  prostate?: ProstateExamData;
  aorto_mesenteric?: AortoMesentericData;
  iliac_may_thurner?: IliacMayThurnerData;
  vessels?: string;
  doppler?: string;
  free_fluid?: string;
  conclusion?: string;
}

interface Props {
  data: UziReproductiveData;
  onChange: (patch: Partial<UziReproductiveData>) => void;
}

export const DEFAULT_PENIS_EXAM: PenisExamData = {
  structure:
    "Не нарушена, типичная. Состоит из двух симметричных кавернозных тел и одного спонгиозного тела. Подкожные ткани подвижны под датчиком, мальформаций, адгезий, хорд не выявлено.",
  tunica:
    "Структура белочной оболочки непрерывная, не слоистая, бляшек, уплотнений, надрывов не выявлено. Толщина белочной оболочки --- мм.",
  dorsal_bundle:
    "Типичного состава, дорзальная вена компримируема, расширений, тромбозов нет. Дорзальная артерия проходима.",
  cavernous_arteries: "Кавернозные артерии проходимы.",
  urethra: "Структура не нарушена, проходима. Стенки не утолщены.",
};

export const DEFAULT_PROSTATE: ProstateExamData = {
  position: "нормативное",
  syntopy: "не изменена",
  pelvic_effusion: "нет",
  parenchyma: "не изменена",
  capsule: "не выражена",
  infravesical_obstruction: "нет",
  urethra_internal_opening: "симптом скобы не отмечается",
  paraprostatic_veins: { diameter: "", reflux: "нет" },
};

export const DEFAULT_AORTO_MESENTERIC: AortoMesentericData = {
  aorta_structure: "нормативный ход",
  sma_origin: "нормативное",
  left_renal_vein_position: "типичная интерпозиция",
  retroaortic_component: "нет",
  conclusion: "Признаков аорто-мезентериальной компрессии не выявлено.",
};

export const DEFAULT_ILIAC_MAY_THURNER: IliacMayThurnerData = {
  may_thurner_anatomy: "типичная",
  flow_videographically: "поток не изменён",
  conclusion: "Данных за конфликт Мей–Тернера не получено.",
};

export const DEFAULT_UZI_REPRODUCTIVE: UziReproductiveData = {
  device: "УЗ-сканер с линейным датчиком 7,5–12 МГц",
  right_testis_structure: "Эхоструктура однородная, эхогенность не изменена. Образований не выявлено.",
  left_testis_structure: "Эхоструктура однородная, эхогенность не изменена. Образований не выявлено.",
  right_epididymis: "Не увеличен, структура однородная.",
  left_epididymis: "Не увеличен, структура однородная.",
  show_penis_exam: true,
  penis_exam: DEFAULT_PENIS_EXAM,
  show_prostate: true,
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
  right: { v_dir: "0", v_red: "0", v_rev: "0", t_ref: "0", acc_ref: "0", diameter: "< 3" },
  left: { v_dir: "0", v_red: "0", v_rev: "0", t_ref: "0", acc_ref: "0", diameter: "< 3" },
};

const ARTERIAL_PARAMS: { key: keyof ArterialFlowSide; label: string }[] = [
  { key: "vmax", label: "Vmax (см/с)" },
  { key: "vmin", label: "Vmin (см/с)" },
  { key: "vmed", label: "Vmed/T (см/с)" },
  { key: "ri", label: "RI" },
  { key: "pi", label: "PI" },
  { key: "acc", label: "Acc (см/с²)" },
];

const VENOUS_PARAMS: { key: keyof VenousFlowSide; label: string }[] = [
  { key: "v_dir", label: "V dir (см/с)" },
  { key: "v_red", label: "V red (см/с)" },
  { key: "v_rev", label: "V rev / Вальсальва (см/с)" },
  { key: "t_ref", label: "T ref (сек)" },
  { key: "acc_ref", label: "Acc ref (см/с²)" },
  { key: "diameter", label: "Диаметр вен (мм)" },
];

export function UziReproductiveSection({ data, onChange }: Props) {
  const arterial = data.arterial_flow || {};
  const venous = data.venous_flow || {};
  const penis = data.penis_exam || {};

  const setArt = (side: "right" | "left", key: keyof ArterialFlowSide, val: string) => {
    onChange({
      arterial_flow: {
        ...arterial,
        [side]: { ...(arterial[side] || {}), [key]: val },
      },
    });
  };
  const setVen = (side: "right" | "left", key: keyof VenousFlowSide, val: string) => {
    onChange({
      venous_flow: {
        ...venous,
        [side]: { ...(venous[side] || {}), [key]: val },
      },
    });
  };
  const setPenis = (key: keyof PenisExamData, val: string) => {
    onChange({ penis_exam: { ...penis, [key]: val } });
  };

  // Tab-навигация по столбцам: сначала все «справа», затем все «слева»
  const handleFlowTab = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Tab") return;
    const target = e.currentTarget;
    const tbody = target.closest("tbody");
    if (!tbody) return;
    const rights = Array.from(tbody.querySelectorAll<HTMLInputElement>('input[data-flow-col="right"]'));
    const lefts = Array.from(tbody.querySelectorAll<HTMLInputElement>('input[data-flow-col="left"]'));
    const order = [...rights, ...lefts];
    const idx = order.indexOf(target);
    if (idx === -1) return;
    const nextIdx = e.shiftKey ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= order.length) return; // выпускаем фокус из таблицы
    e.preventDefault();
    order[nextIdx].focus();
    order[nextIdx].select();
  };

  const prostate = data.prostate || {};
  const setProstate = (key: keyof ProstateExamData, val: string) => {
    const next: ProstateExamData = { ...prostate, [key]: val };
    if (key === "residual_urine_volume" || key === "bladder_volume") {
      const bladder = parseFloat((key === "bladder_volume" ? val : prostate.bladder_volume || "").replace(",", "."));
      const residual = parseFloat((key === "residual_urine_volume" ? val : prostate.residual_urine_volume || "").replace(",", "."));
      if (isFinite(bladder) && bladder > 0 && isFinite(residual) && residual >= 0) {
        next.residual_urine_percent = ((residual / bladder) * 100).toFixed(1);
      }
    }
    onChange({ prostate: next });
  };
  const setParaVeins = (key: keyof ParaprostaticVeinsData, val: string) => {
    onChange({
      prostate: {
        ...prostate,
        paraprostatic_veins: { ...(prostate.paraprostatic_veins || {}), [key]: val },
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1"><Label>Аппарат</Label>
        <Input value={data.device || ""} onChange={(e) => onChange({ device: e.target.value })} />
      </div>

      {/* Яички */}
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

      {/* Придатки */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2 p-3 border rounded-md">
          <div className="font-medium text-sm">Правый придаток</div>
          <Input placeholder="Объём придатка (см³)" value={data.right_epididymis_volume || ""} onChange={(e) => onChange({ right_epididymis_volume: e.target.value })} />
          <Textarea rows={2} placeholder="Описание" value={data.right_epididymis || ""} onChange={(e) => onChange({ right_epididymis: e.target.value })} />
        </div>
        <div className="space-y-2 p-3 border rounded-md">
          <div className="font-medium text-sm">Левый придаток</div>
          <Input placeholder="Объём придатка (см³)" value={data.left_epididymis_volume || ""} onChange={(e) => onChange({ left_epididymis_volume: e.target.value })} />
          <Textarea rows={2} placeholder="Описание" value={data.left_epididymis || ""} onChange={(e) => onChange({ left_epididymis: e.target.value })} />
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
              {ARTERIAL_PARAMS.map((p, idx) => (
                <tr key={p.key} className="border-b last:border-b-0">
                  <td className="py-1 pr-2 text-muted-foreground">{p.label}</td>
                  <td className="py-1 px-2">
                    <Input className="h-8" data-flow-col="right" data-flow-row={idx} onKeyDown={handleFlowTab} value={arterial.right?.[p.key] || ""} onChange={(e) => setArt("right", p.key, e.target.value)} />
                  </td>
                  <td className="py-1 pl-2">
                    <Input className="h-8" data-flow-col="left" data-flow-row={idx} onKeyDown={handleFlowTab} value={arterial.left?.[p.key] || ""} onChange={(e) => setArt("left", p.key, e.target.value)} />
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
              {VENOUS_PARAMS.map((p, idx) => (
                <tr key={p.key} className="border-b last:border-b-0">
                  <td className="py-1 pr-2 text-muted-foreground">{p.label}</td>
                  <td className="py-1 px-2">
                    <Input className="h-8" data-flow-col="right" data-flow-row={idx} onKeyDown={handleFlowTab} value={venous.right?.[p.key] || ""} onChange={(e) => setVen("right", p.key, e.target.value)} />
                  </td>
                  <td className="py-1 pl-2">
                    <Input className="h-8" data-flow-col="left" data-flow-row={idx} onKeyDown={handleFlowTab} value={venous.left?.[p.key] || ""} onChange={(e) => setVen("left", p.key, e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Сосуды / ЦДК / свободная жидкость */}
      <div className="space-y-1"><Label>Сосудистый рисунок</Label>
        <Textarea rows={2} value={data.vessels || ""} onChange={(e) => onChange({ vessels: e.target.value })} />
      </div>
      <div className="space-y-1"><Label>ЦДК / допплер</Label>
        <Textarea rows={2} value={data.doppler || ""} onChange={(e) => onChange({ doppler: e.target.value })} />
      </div>
      <div className="space-y-1"><Label>Свободная жидкость</Label>
        <Textarea rows={2} value={data.free_fluid || ""} onChange={(e) => onChange({ free_fluid: e.target.value })} />
      </div>

      {/* Исследование полового члена */}
      <div className="p-3 border rounded-md space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-penis-exam"
              checked={data.show_penis_exam !== false}
              onCheckedChange={(v) => onChange({ show_penis_exam: v === true })}
            />
            <Label htmlFor="show-penis-exam" className="font-medium text-sm cursor-pointer">
              Выводить «Исследование полового члена» в протоколе
            </Label>
          </div>
          {data.show_penis_exam !== false && (
            <Button type="button" variant="outline" size="sm" onClick={() => onChange({ penis_exam: { ...penis, ...DEFAULT_PENIS_EXAM } })}>
              <Zap className="h-3 w-3 mr-1" /> Стандарт
            </Button>
          )}
        </div>

        {data.show_penis_exam !== false && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Структура полового члена</Label>
              <Textarea rows={3} value={penis.structure || ""} onChange={(e) => setPenis("structure", e.target.value)} />
            </div>

            <div className="grid md:grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Ø правого кавернозного тела (мм)</Label>
                <Input className="h-8" value={penis.right_cavernous_diameter || ""} onChange={(e) => setPenis("right_cavernous_diameter", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ø левого кавернозного тела (мм)</Label>
                <Input className="h-8" value={penis.left_cavernous_diameter || ""} onChange={(e) => setPenis("left_cavernous_diameter", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ø спонгиозного тела (мм)</Label>
                <Input className="h-8" value={penis.spongious_diameter || ""} onChange={(e) => setPenis("spongious_diameter", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Белочная оболочка и фасции</Label>
              <Textarea rows={2} value={penis.tunica || ""} onChange={(e) => setPenis("tunica", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Дорзальный пучок</Label>
              <Textarea rows={2} value={penis.dorsal_bundle || ""} onChange={(e) => setPenis("dorsal_bundle", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Дорзальная артерия, Vmax (см/с)</Label>
              <Input className="h-8" value={penis.dorsal_artery_vmax || ""} onChange={(e) => setPenis("dorsal_artery_vmax", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Кавернозные артерии</Label>
              <Textarea rows={2} value={penis.cavernous_arteries || ""} onChange={(e) => setPenis("cavernous_arteries", e.target.value)} />
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Правая кавернозная артерия</Label>
                <Textarea rows={2} value={penis.right_cavernous_artery || ""} onChange={(e) => setPenis("right_cavernous_artery", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Левая кавернозная артерия</Label>
                <Textarea rows={2} value={penis.left_cavernous_artery || ""} onChange={(e) => setPenis("left_cavernous_artery", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Уретра</Label>
              <Textarea rows={2} value={penis.urethra || ""} onChange={(e) => setPenis("urethra", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Заключение по половому члену</Label>
              <Textarea rows={3} placeholder="Если оставить пустым — не будет напечатано" value={penis.conclusion || ""} onChange={(e) => setPenis("conclusion", e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Предстательная железа */}
      <div className="p-3 border rounded-md space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-prostate"
              checked={data.show_prostate !== false}
              onCheckedChange={(v) => onChange({ show_prostate: v === true })}
            />
            <Label htmlFor="show-prostate" className="font-medium text-sm cursor-pointer">
              Выводить «УЗИ предстательной железы» в протоколе
            </Label>
          </div>
          {data.show_prostate !== false && (
            <Button type="button" variant="outline" size="sm" onClick={() => onChange({ prostate: { ...prostate, ...DEFAULT_PROSTATE } })}>
              <Zap className="h-3 w-3 mr-1" /> Стандарт
            </Button>
          )}
        </div>

        {data.show_prostate !== false && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Положение</Label>
                <Input className="h-8" value={prostate.position || ""} onChange={(e) => setProstate("position", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Синтопия с органами таза</Label>
                <Input className="h-8" value={prostate.syntopy || ""} onChange={(e) => setProstate("syntopy", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Выпот в углублениях таза</Label>
              <Input className="h-8" value={prostate.pelvic_effusion || ""} onChange={(e) => setProstate("pelvic_effusion", e.target.value)} />
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Объём предстательной железы (см³)</Label>
                <Input className="h-8" value={prostate.prostate_volume || ""} onChange={(e) => setProstate("prostate_volume", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Средняя доля, объём (см³)</Label>
                <Input className="h-8" value={prostate.middle_lobe_volume || ""} onChange={(e) => setProstate("middle_lobe_volume", e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Паренхима</Label>
                <Input
                  className="h-8"
                  value={prostate.parenchyma ?? "не изменена"}
                  onChange={(e) => setProstate("parenchyma", e.target.value)}
                  placeholder="не изменена"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Капсула</Label>
                <Input
                  className="h-8"
                  value={prostate.capsule ?? "не выражена"}
                  onChange={(e) => setProstate("capsule", e.target.value)}
                  placeholder="не выражена"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Косвенные признаки инфравезикальной обструкции</Label>
              <Textarea rows={2} value={prostate.infravesical_obstruction || ""} onChange={(e) => setProstate("infravesical_obstruction", e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Внутреннее отверстие уретры</Label>
              <Input className="h-8" value={prostate.urethra_internal_opening || ""} onChange={(e) => setProstate("urethra_internal_opening", e.target.value)} />
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Эластография — правая доля</Label>
                <Textarea rows={2} value={prostate.elastography_right || ""} onChange={(e) => setProstate("elastography_right", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Эластография — левая доля</Label>
                <Textarea rows={2} value={prostate.elastography_left || ""} onChange={(e) => setProstate("elastography_left", e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Объём мочевого пузыря при исследовании (мл)</Label>
                <Input className="h-8" value={prostate.bladder_volume || ""} onChange={(e) => setProstate("bladder_volume", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Позыв на микцию (баллов)</Label>
                <Input className="h-8" value={prostate.micturition_urge || ""} onChange={(e) => setProstate("micturition_urge", e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Объём остаточной мочи (мл)</Label>
                <Input className="h-8" value={prostate.residual_urine_volume || ""} onChange={(e) => setProstate("residual_urine_volume", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Остаточная моча (% от исходного объёма)</Label>
                <Input className="h-8" placeholder="рассчитывается автоматически" value={prostate.residual_urine_percent || ""} onChange={(e) => setProstate("residual_urine_percent", e.target.value)} />
              </div>
            </div>

            <div className="p-2 border rounded space-y-2">
              <div className="text-xs font-medium">Парапростатические вены</div>
              <div className="grid md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Диаметр (мм)</Label>
                  <Input className="h-8" value={prostate.paraprostatic_veins?.diameter || ""} onChange={(e) => setParaVeins("diameter", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Наличие рефлюкса</Label>
                  <Input className="h-8" value={prostate.paraprostatic_veins?.reflux || ""} onChange={(e) => setParaVeins("reflux", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Заключение по предстательной железе</Label>
              <Textarea rows={3} placeholder="Если оставить пустым — не будет напечатано" value={prostate.conclusion || ""} onChange={(e) => setProstate("conclusion", e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Зона аорто-мезентериального конфликта */}
      {(() => {
        const am = data.aorto_mesenteric || {};
        const setAm = (key: keyof AortoMesentericData, val: string) => {
          const next: AortoMesentericData = { ...am, [key]: val };
          if (key === "diameter_premesenteric" || key === "diameter_intramesenteric") {
            const pre = parseFloat(((key === "diameter_premesenteric" ? val : am.diameter_premesenteric) || "").replace(",", "."));
            const intra = parseFloat(((key === "diameter_intramesenteric" ? val : am.diameter_intramesenteric) || "").replace(",", "."));
            if (isFinite(pre) && isFinite(intra) && intra > 0) {
              next.ratio_pre_intra = (pre / intra).toFixed(2);
            }
          }
          onChange({ aorto_mesenteric: next });
        };
        return (
          <div className="p-3 border rounded-md space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="font-medium text-sm">Зона аорто-мезентериального конфликта</div>
              <Button type="button" variant="outline" size="sm" onClick={() => onChange({ aorto_mesenteric: { ...am, ...DEFAULT_AORTO_MESENTERIC } })}>
                <Zap className="h-3 w-3 mr-1" /> Стандарт
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Структура и ход аорты</Label>
                <Input className="h-8" value={am.aorta_structure || ""} onChange={(e) => setAm("aorta_structure", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Отхождение верхней брыжеечной артерии</Label>
                <Input className="h-8" value={am.sma_origin || ""} onChange={(e) => setAm("sma_origin", e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Положение левой почечной вены</Label>
                <Input className="h-8" value={am.left_renal_vein_position || ""} onChange={(e) => setAm("left_renal_vein_position", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ретроаортальный компонент ЛПВ (есть/нет)</Label>
                <Input className="h-8" value={am.retroaortic_component || ""} onChange={(e) => setAm("retroaortic_component", e.target.value)} />
              </div>
            </div>

            <div className="text-xs font-medium pt-1">Диаметры левой почечной вены (мм)</div>
            <div className="grid md:grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Премезентериальный</Label>
                <Input className="h-8" value={am.diameter_premesenteric || ""} onChange={(e) => setAm("diameter_premesenteric", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Интрамезентериальный</Label>
                <Input className="h-8" value={am.diameter_intramesenteric || ""} onChange={(e) => setAm("diameter_intramesenteric", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Постмезентериальный</Label>
                <Input className="h-8" value={am.diameter_postmesenteric || ""} onChange={(e) => setAm("diameter_postmesenteric", e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Соотношение премезентериальный : интрамезентериальный</Label>
                <Input className="h-8" placeholder="рассчитывается автоматически" value={am.ratio_pre_intra || ""} onChange={(e) => setAm("ratio_pre_intra", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Скорость потока в зоне сужения (см/с)</Label>
                <Input className="h-8" value={am.stenosis_flow_velocity || ""} onChange={(e) => setAm("stenosis_flow_velocity", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Заключение</Label>
              <Textarea rows={2} placeholder="Если оставить пустым — не будет напечатано" value={am.conclusion || ""} onChange={(e) => setAm("conclusion", e.target.value)} />
            </div>
          </div>
        );
      })()}

      {/* Зона илиакального конфликта (Мей–Тернера) */}
      {(() => {
        const mt = data.iliac_may_thurner || {};
        const setMt = (key: keyof IliacMayThurnerData, val: string) => {
          onChange({ iliac_may_thurner: { ...mt, [key]: val } });
        };
        return (
          <div className="p-3 border rounded-md space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="font-medium text-sm">Зона илиакального конфликта (Мей–Тернера)</div>
              <Button type="button" variant="outline" size="sm" onClick={() => onChange({ iliac_may_thurner: { ...mt, ...DEFAULT_ILIAC_MAY_THURNER } })}>
                <Zap className="h-3 w-3 mr-1" /> Стандарт
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Анатомия зоны Мей–Тернера</Label>
                <Input className="h-8" value={mt.may_thurner_anatomy || ""} onChange={(e) => setMt("may_thurner_anatomy", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Диаметр левой общей подвздошной вены (мм)</Label>
                <Input className="h-8" value={mt.left_common_iliac_diameter || ""} onChange={(e) => setMt("left_common_iliac_diameter", e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Видеографически</Label>
                <Input className="h-8" value={mt.flow_videographically || ""} onChange={(e) => setMt("flow_videographically", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Скорость потока в зоне компрессии (см/с)</Label>
                <Input className="h-8" value={mt.compression_flow_velocity || ""} onChange={(e) => setMt("compression_flow_velocity", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Заключение</Label>
              <Textarea rows={2} placeholder="Если оставить пустым — не будет напечатано" value={mt.conclusion || ""} onChange={(e) => setMt("conclusion", e.target.value)} />
            </div>
          </div>
        );
      })()}


      <div className="space-y-1"><Label>Заключение УЗИ</Label>
        <Textarea rows={3} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
      </div>
    </div>
  );
}
