import { ProtocolType } from "@/lib/visits/protocolTypes";
import { UltrashortForm } from "./forms/UltrashortForm";
import { PostOpDay3Form } from "./forms/PostOpDay3Form";
import { PostOpDay7Form } from "./forms/PostOpDay7Form";
import { PrimaryShortForm } from "./forms/PrimaryShortForm";
import { RepeatWithLabsForm } from "./forms/RepeatWithLabsForm";
import { UziReproductiveForm, UziUrinaryForm, DynamicWithUziForm, RepeatWithUziForm } from "./forms/UziForms";
import { GenericFieldsForm } from "./forms/GenericFieldsForm";
import { OnlineConsultForm } from "./forms/OnlineConsultForm";
import { PeptideProgramForm } from "./forms/PeptideProgramForm";
import {
  SmartTemplatesProvider,
  FillStandardButton,
  OperationTemplateBanner,
} from "./SmartTemplates";
import { DiagnosisRecommendationsPicker } from "./DiagnosisRecommendationsPicker";

interface Props {
  type: ProtocolType;
  data: any;
  onChange: (data: any) => void;
  birthDate?: string | null;
}

export function ProtocolForm({ type, data, onChange, birthDate }: Props) {
  const patch = (p: any) => onChange({ ...(data || {}), ...p });

  const renderForm = () => {
    switch (type) {
      case "ultrashort":
        return <UltrashortForm data={data || {}} onChange={patch} />;
      case "postop_day3":
        return <PostOpDay3Form data={data || {}} onChange={patch} />;
      case "postop_day7":
        return <PostOpDay7Form data={data || {}} onChange={patch} />;
      case "primary_short":
        return <PrimaryShortForm data={data || {}} onChange={patch} birthDate={birthDate} />;
      case "repeat_with_labs":
        return <RepeatWithLabsForm data={data || {}} onChange={patch} />;
      case "uzi_reproductive":
        return <UziReproductiveForm data={data || {}} onChange={patch} />;
      case "uzi_urinary":
        return <UziUrinaryForm data={data || {}} onChange={patch} />;
      case "dynamic_with_uzi":
        return <DynamicWithUziForm data={data || {}} onChange={patch} birthDate={birthDate} />;
      case "repeat_with_uzi":
        return <RepeatWithUziForm data={data || {}} onChange={patch} birthDate={birthDate} />;
      case "online_consult":
        return <OnlineConsultForm data={data || {}} onChange={patch} />;
      case "peptide_program":
        return <PeptideProgramForm data={data || {}} onChange={patch} />;


      default:
        // unknown / dynamic / postop_day10 / online_consult и любые будущие типы
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
        {renderForm()}
      </div>
    </SmartTemplatesProvider>
  );
}
