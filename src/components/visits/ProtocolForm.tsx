import { ProtocolType } from "@/lib/visits/protocolTypes";
import { UltrashortForm } from "./forms/UltrashortForm";
import { PostOpDay3Form } from "./forms/PostOpDay3Form";
import { PostOpDay7Form } from "./forms/PostOpDay7Form";
import { PrimaryShortForm } from "./forms/PrimaryShortForm";
import { RepeatWithLabsForm } from "./forms/RepeatWithLabsForm";
import { UziReproductiveForm, UziUrinaryForm, DynamicWithUziForm, RepeatWithUziForm } from "./forms/UziForms";

interface Props {
  type: ProtocolType;
  data: any;
  onChange: (data: any) => void;
}

export function ProtocolForm({ type, data, onChange }: Props) {
  const patch = (p: any) => onChange({ ...(data || {}), ...p });
  switch (type) {
    case "ultrashort":
      return <UltrashortForm data={data || {}} onChange={patch} />;
    case "postop_day3":
      return <PostOpDay3Form data={data || {}} onChange={patch} />;
    case "postop_day7":
      return <PostOpDay7Form data={data || {}} onChange={patch} />;
    case "primary_short":
      return <PrimaryShortForm data={data || {}} onChange={patch} />;
    case "repeat_with_labs":
      return <RepeatWithLabsForm data={data || {}} onChange={patch} />;
    case "uzi_reproductive":
      return <UziReproductiveForm data={data || {}} onChange={patch} />;
    case "uzi_urinary":
      return <UziUrinaryForm data={data || {}} onChange={patch} />;
    case "dynamic_with_uzi":
      return <DynamicWithUziForm data={data || {}} onChange={patch} />;
    case "repeat_with_uzi":
      return <RepeatWithUziForm data={data || {}} onChange={patch} />;
    default:
      return (
        <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-md">
          Форма для этого типа протокола будет реализована на следующем этапе.
        </div>
      );
  }
}
