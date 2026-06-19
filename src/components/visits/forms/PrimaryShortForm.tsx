// Label rendered via SmartFieldLabel
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrimaryShortData } from "@/lib/visits/protocolSchemas";
import { SomaticStatusSection } from "../sections/SomaticStatus";
import { SexualFormulaSection } from "../sections/SexualFormula";
import { SexualConstitutionSection } from "../sections/SexualConstitution";
import { OrthoStatusSection } from "../sections/OrthoStatus";
import { NeuroStatusSection } from "../sections/NeuroStatus";
import { PsychStatusSection } from "../sections/PsychStatus";
import { SmartFieldLabel } from "../SmartTemplates";
import { CollapsibleField } from "../CollapsibleField";
import { Button } from "@/components/ui/button";
import { Zap, RotateCcw } from "lucide-react";

const SCROTUM_DEFAULT =
  "Яичко в мошонке, положение правильное, размеры по возрасту, тургор достаточный, эластичность обычная, пальпация безболезненная. Придаток яичка: положение правильное, форма типичная, подвижность обычная, пальпация безболезненная, гидатиды не пальпируются, кист головки придатка нет.";

interface Props {
  data: PrimaryShortData;
  onChange: (patch: Partial<PrimaryShortData>) => void;
  birthDate?: string | null;
}

export function PrimaryShortForm({ data, onChange, birthDate }: Props) {

  // Backfill external_genitalia from legacy "fields" import on first render data shape
  const importedFields = ((data as any).fields || {}) as Record<string, string>;
  if (!data.local_status?.external_genitalia && (importedFields["Локальный статус на момент осмотра"] || importedFields["Локальный статус"])) {
    // non-mutating soft default — actual write happens when user edits
  }



  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-1"><SmartFieldLabel fieldKey="complaints">Жалобы</SmartFieldLabel>
          <Textarea rows={4} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
        </div>
        <div className="space-y-1"><SmartFieldLabel fieldKey="anamnesis">Анамнез</SmartFieldLabel>
          <Textarea rows={4} value={data.anamnesis || ""} onChange={(e) => onChange({ anamnesis: e.target.value })} />
        </div>
        <div className="space-y-1">
          <SmartFieldLabel value={(data as any).dynamics || ""} onSet={(v) => onChange({ dynamics: v } as any)}>Динамика</SmartFieldLabel>
          <Textarea rows={4} value={(data as any).dynamics || ""} onChange={(e) => onChange({ dynamics: e.target.value } as any)} placeholder="Если первичный визит — оставьте пустым" />
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
          </div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-sm">Половая конституция</CardTitle></CardHeader>
        <CardContent>
          <SexualConstitutionSection
            value={data.sexual_constitution}
            onChange={(v) => onChange({ sexual_constitution: v })}
          />
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-sm">Локальный статус</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* 1. Наружные половые органы */}
          <div className="space-y-1">
            <SmartFieldLabel
              fieldKey="local_status"
              value={data.local_status?.external_genitalia || ""}
              onSet={(v) => onChange({ local_status: { ...(data.local_status || {}), external_genitalia: v } })}
            >
              Наружные половые органы
            </SmartFieldLabel>
            <Textarea
              rows={2}
              value={data.local_status?.external_genitalia || ""}
              onChange={(e) => onChange({ local_status: { ...(data.local_status || {}), external_genitalia: e.target.value } })}
            />
          </div>

          {/* 2. Органы мошонки — Справа | Слева */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Органы мошонки</div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() =>
                    onChange({
                      local_status: {
                        ...(data.local_status || {}),
                        scrotum_right: SCROTUM_DEFAULT,
                        scrotum_left: SCROTUM_DEFAULT,
                      },
                    })
                  }
                >
                  <Zap className="h-3 w-3" /> Шаблон обе
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs gap-1"
                  disabled={!data.local_status?.scrotum_right && !data.local_status?.scrotum_left}
                  onClick={() =>
                    onChange({
                      local_status: {
                        ...(data.local_status || {}),
                        scrotum_right: "",
                        scrotum_left: "",
                      },
                    })
                  }
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
                        rows={6}
                        className="min-h-[140px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={data.local_status?.scrotum_right || ""}
                        onChange={(e) => onChange({ local_status: { ...(data.local_status || {}), scrotum_right: e.target.value } })}
                      />
                    </td>
                    <td className="p-0 align-top">
                      <Textarea
                        rows={6}
                        className="min-h-[140px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={data.local_status?.scrotum_left || ""}
                        onChange={(e) => onChange({ local_status: { ...(data.local_status || {}), scrotum_left: e.target.value } })}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Общий локальный статус — Справа | Слева */}
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
                      rows={6}
                      className="min-h-[140px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={data.local_status?.right || ""}
                      onChange={(e) => onChange({ local_status: { ...(data.local_status || {}), right: e.target.value } })}
                    />
                  </td>
                  <td className="p-0 align-top">
                    <Textarea
                      rows={6}
                      className="min-h-[140px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={data.local_status?.left || ""}
                      onChange={(e) => onChange({ local_status: { ...(data.local_status || {}), left: e.target.value } })}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Половой член / 5. Промежность */}
          <div className="grid md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>


      <div className="grid md:grid-cols-2 gap-3">
        <CollapsibleField hasValue={!!data.neuro_status} label="Неврологический статус">
          <SmartFieldLabel fieldKey="neuro_status" value={data.neuro_status || ""} onSet={(v) => onChange({ neuro_status: v })}>Неврологический статус</SmartFieldLabel>
          <Textarea rows={2} value={data.neuro_status || ""} onChange={(e) => onChange({ neuro_status: e.target.value })} />
        </CollapsibleField>
        <div className="md:col-span-2">
          <OrthoStatusSection value={data.ortho_status} onChange={(v) => onChange({ ortho_status: v })} />
        </div>
        <div className="md:col-span-2">
          <NeuroStatusSection value={data.neuro_status_full} onChange={(v) => onChange({ neuro_status_full: v })} />
        </div>
        <div className="md:col-span-2">
          <PsychStatusSection value={data} onChange={onChange} birthDate={birthDate} />
        </div>

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
