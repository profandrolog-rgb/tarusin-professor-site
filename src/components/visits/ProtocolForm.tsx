import { cloneElement, isValidElement, ReactElement } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ProtocolType } from "@/lib/visits/protocolTypes";
import { UltrashortForm } from "./forms/UltrashortForm";
import { PostOpDay3Form } from "./forms/PostOpDay3Form";
import { PostOpDay7Form } from "./forms/PostOpDay7Form";
import { PrimaryShortForm } from "./forms/PrimaryShortForm";
import { RepeatWithLabsForm } from "./forms/RepeatWithLabsForm";
import { UziReproductiveForm, UziUrinaryForm, UziBladderForm, DynamicWithUziForm, RepeatWithUziForm } from "./forms/UziForms";
import { GenericFieldsForm } from "./forms/GenericFieldsForm";
import { OnlineConsultForm } from "./forms/OnlineConsultForm";
import { PeptideProgramForm } from "./forms/PeptideProgramForm";
import {
  SmartTemplatesProvider,
  FillStandardButton,
  OperationTemplateBanner,
} from "./SmartTemplates";
import { DiagnosisRecommendationsPicker } from "./DiagnosisRecommendationsPicker";
import { ExtraUziMpsSection } from "./sections/ExtraUziMps";
import { CycleContextSection, CycleContextData } from "./sections/CycleContext";
import { AdditionalNotesField } from "./AdditionalNotesField";

interface Props {
  type: ProtocolType;
  data: any;
  onChange: (data: any) => void;
  birthDate?: string | null;
  patientSex?: "M" | "F" | null;
  patientId?: string | null;
  patientName?: string | null;
  currentVisitId?: string | null;
}

import { MetabolicMapChecklistDialog } from "@/components/metabolic/MetabolicMapChecklistDialog";

export function ProtocolForm({ type, data, onChange, birthDate, patientSex, patientId, patientName, currentVisitId }: Props) {
  const patch = (p: any) => onChange({ ...(data || {}), ...p });
  const patchCycle = (p: Partial<CycleContextData>) => patch(p);
  const includeConsent = (data?.include_consent as boolean) === true;

  const historyProps = { patientId, currentVisitId };

  const renderForm = () => {
    switch (type) {
      case "ultrashort":
        return <UltrashortForm data={data || {}} onChange={patch} {...historyProps} />;
      case "postop_day3":
        return <PostOpDay3Form data={data || {}} onChange={patch} {...historyProps} />;
      case "postop_day7":
        return <PostOpDay7Form data={data || {}} onChange={patch} {...historyProps} />;
      case "primary_short":
        return <PrimaryShortForm data={data || {}} onChange={patch} birthDate={birthDate} {...historyProps} />;
      case "repeat_with_labs":
        return <RepeatWithLabsForm data={data || {}} onChange={patch} {...historyProps} />;
      case "uzi_reproductive":
        return <UziReproductiveForm data={data || {}} onChange={patch} {...historyProps} />;
      case "uzi_urinary":
        return <UziUrinaryForm data={data || {}} onChange={patch} {...historyProps} />;
      case "uzi_bladder":
        return <UziBladderForm data={data || {}} onChange={patch} />;

      case "dynamic_with_uzi":
        return <DynamicWithUziForm data={data || {}} onChange={patch} birthDate={birthDate} {...historyProps} />;
      case "repeat_with_uzi":
        return <RepeatWithUziForm data={data || {}} onChange={patch} birthDate={birthDate} {...historyProps} />;
      case "online_consult":
        return <OnlineConsultForm data={data || {}} onChange={patch} {...historyProps} />;
      case "peptide_program":
        return <PeptideProgramForm data={data || {}} onChange={patch} {...historyProps} />;


      default:
        return <GenericFieldsForm data={data || {}} onChange={patch} />;
    }
  };

  return (
    <SmartTemplatesProvider protocolType={type} data={data} onChange={patch}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-muted-foreground">
            ⚡ — вставить стандартный текст в поле. Все шаблоны редактируемы.
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DiagnosisRecommendationsPicker
              value={(data?.recommendations as string) || ""}
              onApply={(next) => patch({ recommendations: next })}
            />
            <FillStandardButton />
          </div>
        </div>
        <OperationTemplateBanner />
        {patientSex === "F" ? (
          <CycleContextSection
            data={{
              cycle_mode: data?.cycle_mode,
              repro_status: data?.repro_status,
              cycle_phase: data?.cycle_phase,
              cycle_day: data?.cycle_day,
              last_period_date: data?.last_period_date,
              cycle_length: data?.cycle_length,
              cycle_note: data?.cycle_note,
            }}
            onChange={patchCycle}
          />
        ) : null}
        {renderForm()}
        {/* Универсальный опциональный блок УЗДГ органов МПС */}
        {!["uzi_reproductive", "uzi_urinary", "uzi_bladder", "dynamic_with_uzi", "repeat_with_uzi"].includes(type) ? (
          <ExtraUziMpsSection
            data={data?.extra_uzi_mps}
            onChange={(p) => patch({ extra_uzi_mps: { ...(data?.extra_uzi_mps || {}), ...p } })}
          />
        ) : null}

        {/* Универсальное поле «Дополнительно» — во всех протоколах */}
        <AdditionalNotesField
          value={data?.additional_notes || ""}
          onChange={(v) => patch({ additional_notes: v })}
        />

        {/* Бланк метаболической карты — выбор исследований и печать */}
        <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm">
            <div className="font-medium">🧬 Бланк метаболической карты</div>
            <div className="text-xs text-muted-foreground">
              Отметьте исследования для выдачи пациенту. Выбор сохраняется в визите.
            </div>
          </div>
          <MetabolicMapChecklistDialog
            patientName={patientName || ""}
            birthDate={birthDate}
            value={Array.isArray(data?.metabolic_map_checklist) ? data.metabolic_map_checklist : []}
            onChange={(codes) => patch({ metabolic_map_checklist: codes })}
          />
        </div>

        {/* Переключатель информированного согласия — по умолчанию выключено */}
        <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2">
          <label className="flex items-start gap-2 cursor-pointer text-sm">
            <Checkbox
              checked={includeConsent}
              onCheckedChange={(v) => patch({ include_consent: v === true })}
              className="mt-0.5"
            />
            <span>
              Печатать блок «Информированное добровольное согласие» в конце бланка
              <span className="block text-xs text-muted-foreground mt-0.5">
                По умолчанию не печатается. Включите, если для этого визита нужно приложить согласие к протоколу.
              </span>
            </span>
          </label>
        </div>
      </div>
    </SmartTemplatesProvider>
  );
}
