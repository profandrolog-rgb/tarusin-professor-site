import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export interface LocalStatusData {
  external_genitalia?: string;
  penis?: string;
  scrotum?: string;
  right_testis?: string;
  left_testis?: string;
  right_testis_volume?: string;
  left_testis_volume?: string;
  epididymis?: string;
  spermatic_cord?: string;
  inguinal_rings?: string;
  notes?: string;
}

interface Props {
  data: LocalStatusData;
  onChange: (patch: Partial<LocalStatusData>) => void;
}

export const DEFAULT_LOCAL_STATUS: LocalStatusData = {
  external_genitalia: "Наружные половые органы сформированы правильно, по мужскому типу.",
  penis: "Половой член сформирован правильно. Крайняя плоть свободно смещается, головка обнажается полностью. Наружное отверстие уретры в типичном месте.",
  scrotum: "Мошонка сформирована правильно, симметрична, кожа без изменений.",
  right_testis: "В мошонке, эластической консистенции, безболезненно при пальпации.",
  left_testis: "В мошонке, эластической консистенции, безболезненно при пальпации.",
  epididymis: "Придатки яичек не увеличены, безболезненны.",
  spermatic_cord: "Семенные канатики не утолщены, варикозного расширения вен не определяется.",
  inguinal_rings: "Наружные паховые кольца не расширены, грыжевых выпячиваний нет.",
};

export function LocalStatusAndrologySection({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1"><Label>Наружные половые органы</Label><Textarea rows={2} value={data.external_genitalia || ""} onChange={(e) => onChange({ external_genitalia: e.target.value })} /></div>
      <div className="space-y-1"><Label>Половой член</Label><Textarea rows={3} value={data.penis || ""} onChange={(e) => onChange({ penis: e.target.value })} /></div>
      <div className="space-y-1"><Label>Мошонка</Label><Textarea rows={2} value={data.scrotum || ""} onChange={(e) => onChange({ scrotum: e.target.value })} /></div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Правое яичко</Label>
          <Textarea rows={2} value={data.right_testis || ""} onChange={(e) => onChange({ right_testis: e.target.value })} />
          <Input placeholder="Объём, мл" value={data.right_testis_volume || ""} onChange={(e) => onChange({ right_testis_volume: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Левое яичко</Label>
          <Textarea rows={2} value={data.left_testis || ""} onChange={(e) => onChange({ left_testis: e.target.value })} />
          <Input placeholder="Объём, мл" value={data.left_testis_volume || ""} onChange={(e) => onChange({ left_testis_volume: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1"><Label>Придатки</Label><Textarea rows={2} value={data.epididymis || ""} onChange={(e) => onChange({ epididymis: e.target.value })} /></div>
      <div className="space-y-1"><Label>Семенные канатики</Label><Textarea rows={2} value={data.spermatic_cord || ""} onChange={(e) => onChange({ spermatic_cord: e.target.value })} /></div>
      <div className="space-y-1"><Label>Паховые кольца</Label><Textarea rows={2} value={data.inguinal_rings || ""} onChange={(e) => onChange({ inguinal_rings: e.target.value })} /></div>
      <div className="space-y-1"><Label>Дополнительно</Label><Textarea rows={2} value={data.notes || ""} onChange={(e) => onChange({ notes: e.target.value })} /></div>
    </div>
  );
}
