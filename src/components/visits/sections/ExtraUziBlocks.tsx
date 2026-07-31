import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UziUrinarySection, DEFAULT_UZI_URINARY, UziUrinaryData } from "./UziUrinary";

/** Общая обёртка: чекбокс включения + содержимое. */
function ExtraBlockShell({
  title,
  hint,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  hint: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-dashed border-2">
      <CardHeader className="pb-2">
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox checked={enabled} onCheckedChange={(v) => onToggle(v === true)} className="mt-1" />
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          </div>
        </label>
      </CardHeader>
      {enabled ? <CardContent>{children}</CardContent> : null}
    </Card>
  );
}

/* ------------------------- УЗИ почек и мочевого пузыря ------------------------- */

export interface ExtraUziKidneysData extends UziUrinaryData {
  enabled?: boolean;
  indications?: string;
}

export function ExtraUziKidneysSection({
  data,
  onChange,
}: {
  data?: ExtraUziKidneysData;
  onChange: (patch: Partial<ExtraUziKidneysData>) => void;
}) {
  const enabled = data?.enabled === true;
  const handleToggle = (v: boolean) => {
    if (v && !data?.device) onChange({ enabled: true, ...DEFAULT_UZI_URINARY });
    else onChange({ enabled: v });
  };
  return (
    <ExtraBlockShell
      title="+ УЗИ почек и мочевого пузыря (опционально к этому протоколу)"
      hint="Добавляет в текущий протокол блок УЗИ органов мочевыделительной системы. Печатается только при установленной галочке."
      enabled={enabled}
      onToggle={handleToggle}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Показания к исследованию</Label>
          <Textarea
            rows={2}
            value={data?.indications || ""}
            onChange={(e) => onChange({ indications: e.target.value })}
          />
        </div>
        <UziUrinarySection data={data || {}} onChange={(p) => onChange(p as Partial<ExtraUziKidneysData>)} />
      </div>
    </ExtraBlockShell>
  );
}

/* ------------- Мочевой пузырь с определением остаточной мочи ------------- */

export interface ExtraUziResidualData {
  enabled?: boolean;
  indications?: string;
  device?: string;
  bladder_volume?: string;
  bladder_walls?: string;
  bladder_contents?: string;
  micturition_urge?: string;
  residual_urine_volume?: string;
  residual_urine_percent?: string;
  residual_urine?: string;
  conclusion?: string;
}

export const DEFAULT_EXTRA_UZI_RESIDUAL: ExtraUziResidualData = {
  indications: "Оценка функции мочеиспускания, определение остаточной мочи.",
  device: "УЗ-сканер с конвексным датчиком 3,5–5 МГц",
  bladder_walls: "Не утолщены, контуры ровные.",
  bladder_contents: "Содержимое однородное, эхо-негативное.",
  micturition_urge: "Позыв на микцию выраженный.",
  residual_urine: "Клинически незначимая.",
  conclusion: "УЗ-признаков патологии мочевого пузыря не выявлено, остаточной мочи нет.",
};

export function ExtraUziResidualSection({
  data,
  onChange,
}: {
  data?: ExtraUziResidualData;
  onChange: (patch: Partial<ExtraUziResidualData>) => void;
}) {
  const enabled = data?.enabled === true;
  const handleToggle = (v: boolean) => {
    if (v && !data?.device) onChange({ enabled: true, ...DEFAULT_EXTRA_UZI_RESIDUAL });
    else onChange({ enabled: v });
  };

  const setField = (key: keyof ExtraUziResidualData, val: string) => {
    const patch: Partial<ExtraUziResidualData> = { [key]: val } as any;
    if (key === "bladder_volume" || key === "residual_urine_volume") {
      const before = parseFloat(
        String(key === "bladder_volume" ? val : data?.bladder_volume || "").replace(",", "."),
      );
      const residual = parseFloat(
        String(key === "residual_urine_volume" ? val : data?.residual_urine_volume || "").replace(",", "."),
      );
      if (Number.isFinite(before) && before > 0 && Number.isFinite(residual)) {
        patch.residual_urine_percent = ((residual / before) * 100).toFixed(1);
      }
    }
    onChange(patch);
  };

  return (
    <ExtraBlockShell
      title="+ Мочевой пузырь с определением остаточной мочи (опционально)"
      hint="Добавляет блок исследования мочевого пузыря до и после микции с расчётом процента остаточной мочи."
      enabled={enabled}
      onToggle={handleToggle}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Показания к исследованию</Label>
          <Textarea rows={2} value={data?.indications || ""} onChange={(e) => setField("indications", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Аппарат / датчик</Label>
          <Input value={data?.device || ""} onChange={(e) => setField("device", e.target.value)} />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Объём до микции (мл)</Label>
            <Input value={data?.bladder_volume || ""} onChange={(e) => setField("bladder_volume", e.target.value)} placeholder="напр. 250" />
          </div>
          <div className="space-y-1">
            <Label>Позыв на микцию</Label>
            <Input value={data?.micturition_urge || ""} onChange={(e) => setField("micturition_urge", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Остаточная моча (мл)</Label>
            <Input value={data?.residual_urine_volume || ""} onChange={(e) => setField("residual_urine_volume", e.target.value)} placeholder="напр. 12" />
          </div>
          <div className="space-y-1">
            <Label>Остаточная моча (% от исходного объёма)</Label>
            <Input value={data?.residual_urine_percent || ""} onChange={(e) => setField("residual_urine_percent", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Стенки мочевого пузыря</Label>
          <Textarea rows={2} value={data?.bladder_walls || ""} onChange={(e) => setField("bladder_walls", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Содержимое мочевого пузыря</Label>
          <Textarea rows={2} value={data?.bladder_contents || ""} onChange={(e) => setField("bladder_contents", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Клиническая оценка остаточной мочи</Label>
          <Input value={data?.residual_urine || ""} onChange={(e) => setField("residual_urine", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Заключение</Label>
          <Textarea rows={2} value={data?.conclusion || ""} onChange={(e) => setField("conclusion", e.target.value)} />
        </div>
      </div>
    </ExtraBlockShell>
  );
}
