import { Textarea } from "@/components/ui/textarea";
import { SmartFieldLabel } from "../SmartTemplates";

/**
 * Универсальный блок "Жалобы / Анамнез / Динамика".
 * Используется во всех протоколах, где этих полей нет.
 * Пустые поля не выводятся на печать — см. ProtocolPrintLayout.
 */
export interface ClinicalHistoryData {
  complaints?: string;
  anamnesis?: string;
  dynamics?: string;
}

interface Props {
  data: ClinicalHistoryData;
  onChange: (patch: Partial<ClinicalHistoryData>) => void;
  /** Какие из трёх полей показать. По умолчанию все три. */
  show?: { complaints?: boolean; anamnesis?: boolean; dynamics?: boolean };
  /** Высота textarea в строках */
  rows?: number;
}

export function ClinicalHistorySection({ data, onChange, show, rows = 3 }: Props) {
  const s = {
    complaints: show?.complaints ?? true,
    anamnesis: show?.anamnesis ?? true,
    dynamics: show?.dynamics ?? true,
  };
  const cols = [s.complaints, s.anamnesis, s.dynamics].filter(Boolean).length;
  const gridCls = cols >= 3 ? "md:grid-cols-3" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <div className={`grid ${gridCls} gap-4`}>
      {s.complaints && (
        <div className="space-y-1">
          <SmartFieldLabel fieldKey="complaints">Жалобы</SmartFieldLabel>
          <Textarea
            rows={rows}
            value={data.complaints || ""}
            onChange={(e) => onChange({ complaints: e.target.value })}
          />
        </div>
      )}
      {s.anamnesis && (
        <div className="space-y-1">
          <SmartFieldLabel fieldKey="anamnesis" value={data.anamnesis || ""} onSet={(v) => onChange({ anamnesis: v })}>
            Анамнез
          </SmartFieldLabel>
          <Textarea
            rows={rows}
            value={data.anamnesis || ""}
            onChange={(e) => onChange({ anamnesis: e.target.value })}
          />
        </div>
      )}
      {s.dynamics && (
        <div className="space-y-1">
          <SmartFieldLabel value={data.dynamics || ""} onSet={(v) => onChange({ dynamics: v })}>
            Динамика
          </SmartFieldLabel>
          <Textarea
            rows={rows}
            value={data.dynamics || ""}
            onChange={(e) => onChange({ dynamics: e.target.value })}
            placeholder="Если первичный визит — оставьте пустым, на печать не попадёт"
          />
        </div>
      )}
    </div>
  );
}
