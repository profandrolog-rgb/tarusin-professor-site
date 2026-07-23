import { useMemo, useState } from "react";
import { CODE_NODE_MAP } from "@/lib/metabolic/codeNodeMap";
import { computeMappingStats } from "@/lib/metabolic/mappingStats";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Row {
  id: string;
  test_name: string | null;
  test_code: string | null;
  value: number | null;
  unit: string | null;
}

interface Props {
  labRows: Row[];
  labCodesById: Map<string, string>;
}

export function UnaccountedLabsList({ labRows, labCodesById }: Props) {
  const [open, setOpen] = useState(false);

  const mappedCodes = useMemo(() => {
    const s = new Set<string>();
    for (const codeMap of Object.values(CODE_NODE_MAP)) {
      for (const c of Object.keys(codeMap)) s.add(c.toUpperCase());
    }
    return s;
  }, []);

  const items = useMemo(() => {
    const out: Array<{ id: string; name: string; value: string; reason: string }> = [];
    for (const l of labRows) {
      const code = labCodesById.get(l.id);
      let reason: string | null = null;
      if (!code) reason = "нет кода в каталоге";
      else if (!mappedCodes.has(code.toUpperCase())) reason = "не привязан ни к одному пути";
      if (!reason) continue;
      const v = l.value == null ? "" : String(l.value);
      const u = l.unit ? ` ${l.unit}` : "";
      out.push({
        id: l.id,
        name: l.test_name || l.test_code || "—",
        value: `${v}${u}`.trim() || "—",
        reason,
      });
    }
    return out;
  }, [labRows, labCodesById, mappedCodes]);

  const stats = useMemo(
    () => computeMappingStats(labRows, labCodesById),
    [labRows, labCodesById],
  );

  if (items.length === 0) return null;

  return (
    <div className="rounded-md border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium hover:bg-muted/50"
      >
        <span className="flex items-center gap-1">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          Не попали в раскладку: {items.length}
          <span className="font-normal text-muted-foreground">
            (без кода: {stats.noCatalogCode}, без пути: {stats.noPath})
          </span>
        </span>
      </button>
      {open && (
        <ul className="px-3 pb-3 space-y-1 text-xs">
          {items.map((it) => (
            <li key={it.id} className="flex items-baseline justify-between gap-2 border-t border-dashed pt-1">
              <span className="truncate"><span className="font-medium">{it.name}</span>{it.value !== "—" && <span className="text-muted-foreground"> · {it.value}</span>}</span>
              <span className="text-muted-foreground shrink-0">{it.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
