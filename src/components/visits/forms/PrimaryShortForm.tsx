// Label rendered via SmartFieldLabel
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrimaryShortData } from "@/lib/visits/protocolSchemas";
import { SomaticStatusSection } from "../sections/SomaticStatus";
import { SexualFormulaSection } from "../sections/SexualFormula";
import { SmartFieldLabel } from "../SmartTemplates";
import { CollapsibleField } from "../CollapsibleField";

interface Props {
  data: PrimaryShortData;
  onChange: (patch: Partial<PrimaryShortData>) => void;
}

export function PrimaryShortForm({ data, onChange }: Props) {
  const importedFields = ((data as any).fields || {}) as Record<string, string>;
  const hasSplitLocalStatus = !!(data.local_status?.right || data.local_status?.left);
  const fallbackLocalStatus =
    (data.local_status?.external_genitalia as string) ||
    importedFields["Локальный статус на момент осмотра"] ||
    importedFields["Локальный статус"] ||
    "";

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1"><SmartFieldLabel fieldKey="complaints">Жалобы</SmartFieldLabel>
          <Textarea rows={4} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
        </div>
        <div className="space-y-1"><SmartFieldLabel fieldKey="anamnesis">Анамнез</SmartFieldLabel>
          <Textarea rows={4} value={data.anamnesis || ""} onChange={(e) => onChange({ anamnesis: e.target.value })} />
        </div>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Соматический статус</CardTitle></CardHeader>
        <CardContent><SomaticStatusSection data={data.somatic || {}} onChange={(p) => onChange({ somatic: { ...(data.somatic || {}), ...p } })} /></CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-sm">Половая формула</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SexualFormulaSection data={data.sexual_formula || {}} onChange={(p) => onChange({ sexual_formula: { ...(data.sexual_formula || {}), ...p } })} />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1"><SmartFieldLabel value={data.sexual_formula_text || ""} onSet={(v) => onChange({ sexual_formula_text: v })}>Половая формула (текст)</SmartFieldLabel>
              <Textarea rows={2} value={data.sexual_formula_text || ""} onChange={(e) => onChange({ sexual_formula_text: e.target.value })} />
            </div>
            <div className="space-y-1"><SmartFieldLabel value={data.sexual_constitution || ""} onSet={(v) => onChange({ sexual_constitution: v })}>Половая конституция</SmartFieldLabel>
              <Textarea rows={2} value={data.sexual_constitution || ""} onChange={(e) => onChange({ sexual_constitution: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-sm">Локальный статус</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {hasSplitLocalStatus ? (
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="w-1/2 border-b border-r p-2 text-left font-medium">
                          <SmartFieldLabel
                            fieldKey="local_status_right"
                            value={data.local_status?.right || ""}
                            onSet={(v) => onChange({ local_status: { ...(data.local_status || {}), right: v } })}
                          >
                            Справа
                          </SmartFieldLabel>
                        </th>
                        <th className="w-1/2 border-b p-2 text-left font-medium">
                          <SmartFieldLabel
                            fieldKey="local_status_left"
                            value={data.local_status?.left || ""}
                            onSet={(v) => onChange({ local_status: { ...(data.local_status || {}), left: v } })}
                          >
                            Слева
                          </SmartFieldLabel>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border-r p-0 align-top">
                          <Textarea
                            rows={8}
                            className="min-h-[180px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            value={data.local_status?.right || ""}
                            onChange={(e) => onChange({ local_status: { ...(data.local_status || {}), right: e.target.value } })}
                          />
                        </td>
                        <td className="p-0 align-top">
                          <Textarea
                            rows={8}
                            className="min-h-[180px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                            value={data.local_status?.left || ""}
                            onChange={(e) => onChange({ local_status: { ...(data.local_status || {}), left: e.target.value } })}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
          ) : fallbackLocalStatus ? (
              <div className="space-y-1">
                <SmartFieldLabel
                  fieldKey="local_status"
                  value={fallbackLocalStatus}
                  onSet={(v) => onChange({ local_status: { ...(data.local_status || {}), right: v, external_genitalia: undefined } })}
                >
                  Локальный статус
                </SmartFieldLabel>
                <Textarea
                  rows={8}
                  className="min-h-[180px]"
                  value={fallbackLocalStatus}
                  onChange={(e) => onChange({ local_status: { ...(data.local_status || {}), right: e.target.value, external_genitalia: undefined } })}
                />
              </div>
          ) : null}
          {(data.local_status?.penis || data.local_status?.perineum) ? <div className="grid md:grid-cols-2 gap-4">
            {data.local_status?.penis ? (
            <div className="space-y-1">
              <SmartFieldLabel
                fieldKey="local_status_penis"
                value={data.local_status?.penis || ""}
                onSet={(v) => onChange({ local_status: { ...(data.local_status || {}), penis: v } })}
              >
                Половой член
              </SmartFieldLabel>
              <Textarea
                rows={3}
                value={data.local_status?.penis || ""}
                onChange={(e) => onChange({ local_status: { ...(data.local_status || {}), penis: e.target.value } })}
              />
            </div>
            ) : null}
            {data.local_status?.perineum ? (
            <div className="space-y-1">
              <SmartFieldLabel
                fieldKey="local_status_perineum"
                value={data.local_status?.perineum || ""}
                onSet={(v) => onChange({ local_status: { ...(data.local_status || {}), perineum: v } })}
              >
                Промежность
              </SmartFieldLabel>
              <Textarea
                rows={3}
                value={data.local_status?.perineum || ""}
                onChange={(e) => onChange({ local_status: { ...(data.local_status || {}), perineum: e.target.value } })}
              />
            </div>
            ) : null}
          </div> : null}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <CollapsibleField hasValue={!!data.ortho_status} label="Ортопедический статус">
          <SmartFieldLabel value={data.ortho_status || ""} onSet={(v) => onChange({ ortho_status: v })}>Ортопедический статус</SmartFieldLabel>
          <Textarea rows={2} value={data.ortho_status || ""} onChange={(e) => onChange({ ortho_status: e.target.value })} />
        </CollapsibleField>
        <CollapsibleField hasValue={!!data.neuro_status} label="Неврологический статус">
          <SmartFieldLabel fieldKey="neuro_status" value={data.neuro_status || ""} onSet={(v) => onChange({ neuro_status: v })}>Неврологический статус</SmartFieldLabel>
          <Textarea rows={2} value={data.neuro_status || ""} onChange={(e) => onChange({ neuro_status: e.target.value })} />
        </CollapsibleField>
        <CollapsibleField hasValue={!!data.psych_status} label="Психологический статус">
          <SmartFieldLabel fieldKey="psych_status" value={data.psych_status || ""} onSet={(v) => onChange({ psych_status: v })}>Психологический статус</SmartFieldLabel>
          <Textarea rows={2} value={data.psych_status || ""} onChange={(e) => onChange({ psych_status: e.target.value })} />
        </CollapsibleField>
        <CollapsibleField hasValue={!!data.working_diagnosis} label="Рабочая формулировка диагноза">
          <SmartFieldLabel value={data.working_diagnosis || ""} onSet={(v) => onChange({ working_diagnosis: v })}>Рабочая формулировка диагноза</SmartFieldLabel>
          <Textarea rows={2} value={data.working_diagnosis || ""} onChange={(e) => onChange({ working_diagnosis: e.target.value })} />
        </CollapsibleField>
      </div>

      <div className="space-y-1"><SmartFieldLabel fieldKey="conclusion">Заключение / Диагноз</SmartFieldLabel>
        <Textarea
          rows={3}
          value={data.diagnosis ?? data.conclusion ?? ""}
          onChange={(e) => onChange({ diagnosis: e.target.value, conclusion: e.target.value })}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <CollapsibleField hasValue={!!data.exam_plan} label="План обследования">
          <SmartFieldLabel value={data.exam_plan || ""} onSet={(v) => onChange({ exam_plan: v })}>План обследования</SmartFieldLabel>
          <Textarea rows={4} value={data.exam_plan || ""} onChange={(e) => onChange({ exam_plan: e.target.value })} />
        </CollapsibleField>
        <div className="space-y-1"><SmartFieldLabel fieldKey="recommendations">Рекомендации</SmartFieldLabel>
          <Textarea rows={4} value={data.recommendations || ""} onChange={(e) => onChange({ recommendations: e.target.value })} />
        </div>
      </div>


    </div>
  );
}
