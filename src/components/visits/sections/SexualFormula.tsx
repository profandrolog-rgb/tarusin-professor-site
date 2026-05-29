import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface SexualFormulaData {
  P?: string; // Pubis
  Ax?: string; // Axillae
  F?: string; // Facial hair
  L?: string; // Larynx (voice break)
  G?: string; // Genitalia (Tanner)
  formula_note?: string;
}

interface Props {
  data: SexualFormulaData;
  onChange: (patch: Partial<SexualFormulaData>) => void;
}

export const DEFAULT_SEXUAL_FORMULA: SexualFormulaData = {
  P: "0", Ax: "0", F: "0", L: "0", G: "1",
};

const STAGES = ["0", "1", "2", "3", "4", "5"];

function Field({ label, hint, value, onChange }: { label: string; hint: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label>{label} <span className="text-xs text-muted-foreground font-normal">({hint})</span></Label>
      <select
        value={value || "0"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
      >
        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

export function SexualFormulaSection({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Field label="P" hint="лобковое оволосение" value={data.P} onChange={(v) => onChange({ P: v })} />
        <Field label="Ax" hint="подмышки" value={data.Ax} onChange={(v) => onChange({ Ax: v })} />
        <Field label="F" hint="лицо" value={data.F} onChange={(v) => onChange({ F: v })} />
        <Field label="L" hint="гортань / голос" value={data.L} onChange={(v) => onChange({ L: v })} />
        <Field label="G" hint="гениталии (Tanner)" value={data.G} onChange={(v) => onChange({ G: v })} />
      </div>
      <div className="space-y-1">
        <Label>Примечание</Label>
        <Textarea rows={2} value={data.formula_note || ""} onChange={(e) => onChange({ formula_note: e.target.value })} />
      </div>
    </div>
  );
}

export function formatSexualFormula(d?: SexualFormulaData) {
  if (!d) return "";
  return `P${d.P ?? 0} Ax${d.Ax ?? 0} F${d.F ?? 0} L${d.L ?? 0} G${d.G ?? 0}`;
}
