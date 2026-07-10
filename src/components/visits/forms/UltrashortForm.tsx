import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, RotateCcw } from "lucide-react";
import { UltrashortData } from "@/lib/visits/protocolSchemas";
import { SmartFieldLabel } from "../SmartTemplates";
import { SomaticStatusSection } from "../sections/SomaticStatus";
import { SexualFormulaSection } from "../sections/SexualFormula";
import { SexualConstitutionSection } from "../sections/SexualConstitution";
import type { LocalStatusData } from "../sections/LocalStatusAndrology";
import { ClinicalHistorySection } from "../sections/ClinicalHistorySection";

interface Props {
  data: UltrashortData;
  onChange: (patch: Partial<UltrashortData>) => void;
  patientId?: string | null;
  currentVisitId?: string | null;
}

const SCROTUM_DEFAULT =
  "Яичко в мошонке, положение правильное, размеры по возрасту, тургор достаточный, эластичность обычная, пальпация безболезненная. Придаток яичка: положение правильное, форма типичная, подвижность обычная, пальпация безболезненная, гидатиды не пальпируются, кист головки придатка нет.";

export function UltrashortForm({ data, onChange, patientId, currentVisitId }: Props) {
  // Backward compat: если local_status — строка (legacy), миграция при первом изменении
  const ls: LocalStatusData =
    data.local_status && typeof data.local_status === "object"
      ? (data.local_status as LocalStatusData)
      : ({} as LocalStatusData);
  const legacyLsText = typeof data.local_status === "string" ? data.local_status : "";
  const patchLs = (p: Partial<LocalStatusData>) =>
    onChange({ local_status: { ...ls, ...p } });

  return (
    <div className="space-y-6">
      <ClinicalHistorySection
        data={data as any}
        onChange={(p) => onChange(p as any)}
        rows={4}
        patientId={patientId}
        currentVisitId={currentVisitId}
      />

      {/* Общий (соматический) статус */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Общий осмотр (соматический статус)</CardTitle></CardHeader>
        <CardContent>
          <SomaticStatusSection
            data={data.somatic || {}}
            onChange={(p) => onChange({ somatic: { ...(data.somatic || {}), ...p } })}
          />
        </CardContent>
      </Card>

      {/* Пубертат — шкала Таннера (половая формула) */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Сведения о пубертате (шкала Таннера)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SexualFormulaSection
            data={data.sexual_formula || {}}
            onChange={(p) => onChange({ sexual_formula: { ...(data.sexual_formula || {}), ...p } })}
          />
          <div className="space-y-1">
            <SmartFieldLabel value={data.sexual_formula_text || ""} onSet={(v) => onChange({ sexual_formula_text: v })}>
              Половая формула (текст)
            </SmartFieldLabel>
            <Textarea
              rows={2}
              value={data.sexual_formula_text || ""}
              onChange={(e) => onChange({ sexual_formula_text: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Половая жизнь / сведения о консультации */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Половая жизнь / сведения о консультации</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SexualConstitutionSection
            value={data.sexual_constitution}
            onChange={(v) => onChange({ sexual_constitution: v })}
          />
          <div className="space-y-1">
            <SmartFieldLabel value={data.consultation_notes || ""} onSet={(v) => onChange({ consultation_notes: v })}>
              Сведения о консультации (активность, ход беседы)
            </SmartFieldLabel>
            <Textarea
              rows={3}
              value={data.consultation_notes || ""}
              onChange={(e) => onChange({ consultation_notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Локальный статус — как в основном протоколе */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Локальный осмотр</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {legacyLsText && (
            <div className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
              Старая запись локального статуса (текстом): «{legacyLsText}». Перенесите вручную в нужные поля ниже.
            </div>
          )}

          <div className="space-y-1">
            <SmartFieldLabel
              fieldKey="local_status"
              value={ls.external_genitalia || ""}
              onSet={(v) => patchLs({ external_genitalia: v })}
            >
              Наружные половые органы
            </SmartFieldLabel>
            <Textarea
              rows={2}
              value={ls.external_genitalia || ""}
              onChange={(e) => patchLs({ external_genitalia: e.target.value })}
            />
          </div>

          {/* Яички / придатки — Справа | Слева */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Яички и придатки (органы мошонки)</div>
              <div className="flex items-center gap-1">
                <Button
                  type="button" size="sm" variant="outline"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => patchLs({ scrotum_right: SCROTUM_DEFAULT, scrotum_left: SCROTUM_DEFAULT })}
                >
                  <Zap className="h-3 w-3" /> Шаблон обе
                </Button>
                <Button
                  type="button" size="sm" variant="ghost"
                  className="h-7 px-2 text-xs gap-1"
                  disabled={!ls.scrotum_right && !ls.scrotum_left}
                  onClick={() => patchLs({ scrotum_right: "", scrotum_left: "" })}
                >
                  <RotateCcw className="h-3 w-3" /> Сброс
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full table-fixed border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="w-1/2 border-b border-r p-2 text-left font-medium">Справа</th>
                    <th className="w-1/2 border-b p-2 text-left font-medium">Слева</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-r p-0 align-top">
                      <Textarea
                        rows={5}
                        className="min-h-[120px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={ls.scrotum_right || ""}
                        onChange={(e) => patchLs({ scrotum_right: e.target.value })}
                      />
                    </td>
                    <td className="p-0 align-top">
                      <Textarea
                        rows={5}
                        className="min-h-[120px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={ls.scrotum_left || ""}
                        onChange={(e) => patchLs({ scrotum_left: e.target.value })}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1">
            <SmartFieldLabel
              fieldKey="local_status_penis"
              value={ls.penis || ""}
              onSet={(v) => patchLs({ penis: v })}
            >
              Половой член
            </SmartFieldLabel>
            <Textarea
              rows={3}
              value={ls.penis || ""}
              onChange={(e) => patchLs({ penis: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Заключение и рекомендации */}
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="conclusion">Заключение / краткое резюме консультации</SmartFieldLabel>
        <Textarea rows={4} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
      </div>
      <div className="space-y-1">
        <SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
        <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
      </div>
    </div>
  );
}
