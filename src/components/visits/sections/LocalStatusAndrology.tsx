import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SmartFieldLabel } from "../SmartTemplates";

export interface LocalStatusData {
  external_genitalia?: string;
  penis?: string;
  perineum?: string;
  right?: string;
  left?: string;
  scrotum?: string;
  scrotum_right?: string;
  scrotum_left?: string;
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
  const hasSplitStatus = !!(data.right || data.left);

  return (
    <div className="space-y-4">
      {hasSplitStatus ? (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="w-1/2 border-b border-r p-2 text-left font-medium">
                  <SmartFieldLabel fieldKey="local_status_right" value={data.right || ""} onSet={(v) => onChange({ right: v })}>Справа</SmartFieldLabel>
                </th>
                <th className="w-1/2 border-b p-2 text-left font-medium">
                  <SmartFieldLabel fieldKey="local_status_left" value={data.left || ""} onSet={(v) => onChange({ left: v })}>Слева</SmartFieldLabel>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-r p-0 align-top">
                  <Textarea rows={8} className="min-h-[180px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0" value={data.right || ""} onChange={(e) => onChange({ right: e.target.value })} />
                </td>
                <td className="p-0 align-top">
                  <Textarea rows={8} className="min-h-[180px] resize-y border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0" value={data.left || ""} onChange={(e) => onChange({ left: e.target.value })} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="space-y-1"><SmartFieldLabel fieldKey="local_status" value={data.external_genitalia || ""} onSet={(v) => onChange({ external_genitalia: v })}>Наружные половые органы</SmartFieldLabel><Textarea rows={2} value={data.external_genitalia || ""} onChange={(e) => onChange({ external_genitalia: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="local_status_penis" value={data.penis || ""} onSet={(v) => onChange({ penis: v })}>Половой член</SmartFieldLabel><Textarea rows={3} value={data.penis || ""} onChange={(e) => onChange({ penis: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="local_status_scrotum" value={data.scrotum || ""} onSet={(v) => onChange({ scrotum: v })}>Мошонка</SmartFieldLabel><Textarea rows={2} value={data.scrotum || ""} onChange={(e) => onChange({ scrotum: e.target.value })} /></div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <SmartFieldLabel fieldKey="local_status_right_testis" value={data.right_testis || ""} onSet={(v) => onChange({ right_testis: v })}>Правое яичко</SmartFieldLabel>
          <Textarea rows={2} value={data.right_testis || ""} onChange={(e) => onChange({ right_testis: e.target.value })} />
          <Input placeholder="Объём, мл" value={data.right_testis_volume || ""} onChange={(e) => onChange({ right_testis_volume: e.target.value })} />
        </div>
        <div className="space-y-1">
          <SmartFieldLabel fieldKey="local_status_left_testis" value={data.left_testis || ""} onSet={(v) => onChange({ left_testis: v })}>Левое яичко</SmartFieldLabel>
          <Textarea rows={2} value={data.left_testis || ""} onChange={(e) => onChange({ left_testis: e.target.value })} />
          <Input placeholder="Объём, мл" value={data.left_testis_volume || ""} onChange={(e) => onChange({ left_testis_volume: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="local_status_epididymis" value={data.epididymis || ""} onSet={(v) => onChange({ epididymis: v })}>Придатки</SmartFieldLabel><Textarea rows={2} value={data.epididymis || ""} onChange={(e) => onChange({ epididymis: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="local_status_spermatic_cord" value={data.spermatic_cord || ""} onSet={(v) => onChange({ spermatic_cord: v })}>Семенные канатики</SmartFieldLabel><Textarea rows={2} value={data.spermatic_cord || ""} onChange={(e) => onChange({ spermatic_cord: e.target.value })} /></div>
      <div className="space-y-1"><SmartFieldLabel fieldKey="local_status_inguinal_rings" value={data.inguinal_rings || ""} onSet={(v) => onChange({ inguinal_rings: v })}>Паховые кольца</SmartFieldLabel><Textarea rows={2} value={data.inguinal_rings || ""} onChange={(e) => onChange({ inguinal_rings: e.target.value })} /></div>
      {data.perineum ? <div className="space-y-1"><SmartFieldLabel fieldKey="local_status_perineum" value={data.perineum || ""} onSet={(v) => onChange({ perineum: v })}>Промежность</SmartFieldLabel><Textarea rows={2} value={data.perineum || ""} onChange={(e) => onChange({ perineum: e.target.value })} /></div> : null}
      <div className="space-y-1"><Label>Дополнительно</Label><Textarea rows={2} value={data.notes || ""} onChange={(e) => onChange({ notes: e.target.value })} /></div>
    </div>
  );
}
