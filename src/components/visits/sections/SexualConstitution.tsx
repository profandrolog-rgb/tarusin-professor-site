import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AgeCombobox } from "@/components/visits/AgeCombobox";

export interface SexualConstitutionData {
  start?: number | string | null;
  pub?: number | string | null;
  er?: "+" | "++" | "+++" | "";
  mast?: "+" | "-" | "";
  ej?: "+" | "-" | "";
  ejage?: number | string | null;
  mast_fr?: number | null;
  sx?: "+" | "-" | "";
  sxage?: number | string | null;
  sx_fr?: number | null;
  part?: number | null;
  prev?: number | null;
  score?: number;
  no_interview?: boolean;
  legacy_text?: string;
}

export const DEFAULT_SEXUAL_CONSTITUTION: SexualConstitutionData = {
  start: null,
  pub: null,
  er: "",
  mast: "",
  ej: "",
  ejage: null,
  mast_fr: null,
  sx: "",
  sxage: null,
  sx_fr: null,
  part: null,
  prev: null,
  score: 0,
  no_interview: false,
};

const AGES = [9, 10, 11, 12, 13, 14, 15, 16, 17];

function plusScore(v?: string) {
  if (v === "+") return 1;
  if (v === "++") return 2;
  if (v === "+++") return 3;
  return 0;
}

export function computeScConstitutionScore(d: SexualConstitutionData): number {
  return (
    plusScore(d.er) +
    plusScore(d.mast) +
    plusScore(d.ej) +
    plusScore(d.sx) +
    (typeof d.mast_fr === "number" ? d.mast_fr : 0) +
    (typeof d.sx_fr === "number" ? d.sx_fr : 0) +
    (typeof d.part === "number" ? d.part : 0)
  );
}

interface Props {
  /** value may be the new object, a legacy string, or undefined. */
  value?: SexualConstitutionData | string;
  onChange: (next: SexualConstitutionData) => void;
}

function toObject(value?: SexualConstitutionData | string): SexualConstitutionData {
  if (!value) return { ...DEFAULT_SEXUAL_CONSTITUTION };
  if (typeof value === "string") {
    return { ...DEFAULT_SEXUAL_CONSTITUTION, legacy_text: value };
  }
  return { ...DEFAULT_SEXUAL_CONSTITUTION, ...value };
}

function Sel({
  value,
  onChange,
  options,
  disabled,
}: {
  value: any;
  onChange: (v: any) => void;
  options: { v: any; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return onChange(null);
        const num = Number(raw);
        onChange(Number.isFinite(num) && String(num) === raw ? num : raw);
      }}
      disabled={disabled}
      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={String(o.v)} value={String(o.v)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SexualConstitutionSection({ value, onChange }: Props) {
  const d = toObject(value);
  const disabled = !!d.no_interview;
  const score = computeScConstitutionScore(d);

  const patch = (p: Partial<SexualConstitutionData>) => {
    const next = { ...d, ...p };
    next.score = computeScConstitutionScore(next);
    onChange(next);
  };

  const ageOptions = AGES.map((a) => ({ v: a, label: `${a} лет` }));
  const ageWithNone = [...ageOptions, { v: "нет", label: "нет" }];

  return (
    <div className="space-y-3">
      {d.legacy_text ? (
        <div className="rounded-md border border-dashed bg-muted/40 p-2 text-xs text-muted-foreground">
          Импортировано из старого протокола: <em>{d.legacy_text}</em>
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Start <span className="text-muted-foreground font-normal">(начало)</span></Label>
          <AgeCombobox value={d.start ?? null} onChange={(v) => patch({ start: v as any })} disabled={disabled} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pub <span className="text-muted-foreground font-normal">(пубархе)</span></Label>
          <AgeCombobox value={d.pub ?? null} onChange={(v) => patch({ pub: v as any })} disabled={disabled} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Er <span className="text-muted-foreground font-normal">(эрекции)</span></Label>
          <Sel
            value={d.er || ""}
            onChange={(v) => patch({ er: v || "" })}
            options={[{ v: "+", label: "+" }, { v: "++", label: "++" }, { v: "+++", label: "+++" }]}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mast <span className="text-muted-foreground font-normal">(мастурбация)</span></Label>
          <Sel
            value={d.mast || ""}
            onChange={(v) => patch({ mast: v || "" })}
            options={[{ v: "+", label: "+" }, { v: "-", label: "−" }]}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ej <span className="text-muted-foreground font-normal">(эякуляции)</span></Label>
          <Sel
            value={d.ej || ""}
            onChange={(v) => patch({ ej: v || "" })}
            options={[{ v: "+", label: "+" }, { v: "-", label: "−" }]}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ejage <span className="text-muted-foreground font-normal">(возраст эякуляций)</span></Label>
          <AgeCombobox value={d.ejage ?? null} onChange={(v) => patch({ ejage: v as any })} allowNone disabled={disabled} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">MastFR <span className="text-muted-foreground font-normal">(частота, /нед)</span></Label>
          <Input
            type="number"
            step="0.1"
            min={0}
            value={d.mast_fr ?? ""}
            onChange={(e) => patch({ mast_fr: e.target.value === "" ? null : Number(e.target.value) })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sx <span className="text-muted-foreground font-normal">(половые контакты)</span></Label>
          <Sel
            value={d.sx || ""}
            onChange={(v) => patch({ sx: v || "" })}
            options={[{ v: "+", label: "+" }, { v: "-", label: "−" }]}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sxage <span className="text-muted-foreground font-normal">(возраст начала)</span></Label>
          <AgeCombobox value={d.sxage ?? null} onChange={(v) => patch({ sxage: v as any })} allowNone disabled={disabled} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">SxFR <span className="text-muted-foreground font-normal">(частота, /нед)</span></Label>
          <Input
            type="number"
            step="0.1"
            min={0}
            value={d.sx_fr ?? ""}
            onChange={(e) => patch({ sx_fr: e.target.value === "" ? null : Number(e.target.value) })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Part <span className="text-muted-foreground font-normal">(партнёры, число)</span></Label>
          <Input
            type="number"
            step="1"
            min={0}
            value={d.part ?? ""}
            onChange={(e) => patch({ part: e.target.value === "" ? null : Math.round(Number(e.target.value)) })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Prev <span className="text-muted-foreground font-normal">(превенция, %)</span></Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="1"
              min={0}
              max={100}
              value={d.prev ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? null : Math.max(0, Math.min(100, Math.round(Number(e.target.value))));
                patch({ prev: v });
              }}
              disabled={disabled}
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-sm">
          Сумма баллов: <span className="font-semibold tabular-nums">{score}</span>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={!!d.no_interview}
            onCheckedChange={(c) => patch({ no_interview: !!c })}
          />
          <span>без опроса</span>
        </label>
      </div>
    </div>
  );
}

export function formatSexualConstitution(value?: SexualConstitutionData | string): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value.no_interview) return "без опроса";
  const parts: string[] = [];
  const push = (label: string, v: any, suffix = "") => {
    if (v === null || v === undefined || v === "") return;
    parts.push(`${label} ${v}${suffix}`);
  };
  push("Start", value.start);
  push("Pub", value.pub);
  push("Er", value.er);
  push("Mast", value.mast === "-" ? "−" : value.mast);
  push("Ej", value.ej === "-" ? "−" : value.ej);
  push("Ejage", value.ejage);
  push("MastFR", value.mast_fr, "/нед");
  push("Sx", value.sx === "-" ? "−" : value.sx);
  push("Sxage", value.sxage);
  push("SxFR", value.sx_fr, "/нед");
  if (typeof value.part === "number") push("Part", value.part);
  if (typeof value.prev === "number") push("Prev", value.prev, "%");
  const score = computeScConstitutionScore(value);
  if (score > 0) parts.push(`Σ ${score}`);
  return parts.join(" / ");
}
