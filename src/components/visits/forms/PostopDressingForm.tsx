import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DRESSING_LOCAL_FIELDS, DRESSING_ACTION_FIELDS, parseDressingNumber } from "@/lib/visits/postopDressing";

export function PostopDressingForm({ data, onChange }: {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
}) {
  const local = data.dressing_local || {};
  const actions = data.dressing_actions || {};
  const choice = (id: string, label: string, options: readonly string[], value: string, set: (value: string) => void) => (
    <div className="space-y-1" key={id}>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || "empty"} onValueChange={(v) => set(v === "empty" ? "" : v)}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="empty">— не выбрано —</SelectItem>
          {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="dressing-number">№ перевязки по счёту</Label>
          <Input id="dressing-number" type="number" min={1} step={1} value={data.dressing_number ?? ""}
            onChange={(e) => onChange({ dressing_number: parseDressingNumber(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dressing-operation">Название операции</Label>
          <Input id="dressing-operation" value={data.operation_name || ""} onChange={(e) => onChange({ operation_name: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="dressing-complaints">Жалобы</Label>
        <Textarea id="dressing-complaints" rows={3} value={data.complaints || ""} onChange={(e) => onChange({ complaints: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dressing-somatic">Соматический статус</Label>
        <Textarea id="dressing-somatic" rows={4} value={data.general_status || ""} onChange={(e) => onChange({ general_status: e.target.value })} />
      </div>
      <h3 className="font-semibold">Локальный статус</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {DRESSING_LOCAL_FIELDS.map(([key, label, options]) => choice(`dressing-${key}`, label, options, local[key],
          (value) => onChange({ dressing_local: { ...local, [key]: value } })))}
      </div>
      <h3 className="font-semibold">Выполнено</h3>
      {DRESSING_ACTION_FIELDS.filter(([key]) => key !== "recommendations").map(([key, label, options]) => (
        <div className="space-y-2" key={key}>
          {choice(`dressing-${key}`, label, options, actions[key], (value) => onChange({ dressing_actions: { ...actions, [key]: value } }))}
          <Label htmlFor={`dressing-${key}-notes`}>Дополнительно</Label>
          <Textarea id={`dressing-${key}-notes`} rows={2} value={actions[`${key}_notes`] || ""}
            onChange={(e) => onChange({ dressing_actions: { ...actions, [`${key}_notes`]: e.target.value } })} />
        </div>
      ))}
      <div className="space-y-1">
        <Label htmlFor="dressing-conclusion">Заключение</Label>
        <Textarea id="dressing-conclusion" rows={2} value={data.conclusion || ""} onChange={(e) => onChange({ conclusion: e.target.value })} />
      </div>
      {DRESSING_ACTION_FIELDS.filter(([key]) => key === "recommendations").map(([key, label, options]) => (
        <div className="space-y-2" key={key}>
          {choice(`dressing-${key}`, label, options, actions[key], (value) => onChange({ dressing_actions: { ...actions, [key]: value } }))}
          <Label htmlFor="dressing-recommendations-notes">Дополнительные рекомендации</Label>
          <Textarea id="dressing-recommendations-notes" rows={2} value={actions.recommendations_notes || ""}
            onChange={(e) => onChange({ dressing_actions: { ...actions, recommendations_notes: e.target.value } })} />
        </div>
      ))}
    </div>
  );
}
