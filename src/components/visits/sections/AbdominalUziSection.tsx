import { useId } from "react";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ABDOMINAL_GROUPS, fillAbdominalStandard, type AbdominalUziData } from "@/lib/visits/abdominalUzi";

export function AbdominalUziSection({ data, onChange, standalone = false }: {
  data?: AbdominalUziData;
  onChange: (data: AbdominalUziData) => void;
  standalone?: boolean;
}) {
  const id = useId();
  const current = data || {};
  const enabled = current.enabled === true;
  const setValue = (key: string, value: string) => onChange({ ...current, values: { ...current.values, [key]: value } });
  return (
    <section className="space-y-4 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <Checkbox checked={enabled} onCheckedChange={(v) => onChange({ ...current, enabled: v === true })} />
          {standalone ? "Печатать исследование органов брюшной полости" : "УЗИ органов брюшной полости"}
        </label>
        {enabled && <Button type="button" variant="outline" size="sm" onClick={() => onChange(fillAbdominalStandard(current))}>
          <WandSparkles className="mr-2 h-4 w-4" />Заполнить стандарт
        </Button>}
      </div>
      {enabled && <>
        {ABDOMINAL_GROUPS.map((group) => <section key={group.title} className="space-y-3">
          <h3 className="text-sm font-semibold">{group.title}</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {group.fields.map((field) => <div key={field.key} className={field.numeric ? "space-y-1" : "space-y-1 md:col-span-3"}>
              <Label htmlFor={`${id}-${field.key}`}>{field.label}</Label>
              {field.numeric
                ? <DecimalInput id={`${id}-${field.key}`} value={current.values?.[field.key] || ""} onValueChange={(v) => setValue(field.key, v)} />
                : <Textarea id={`${id}-${field.key}`} rows={3} value={current.values?.[field.key] || ""} onChange={(e) => setValue(field.key, e.target.value)} />}
            </div>)}
          </div>
        </section>)}
        <div className="space-y-1">
          <Label htmlFor={`${id}-conclusion`}>Заключение УЗИ брюшной полости</Label>
          <Textarea id={`${id}-conclusion`} rows={3} value={current.conclusion || ""} onChange={(e) => onChange({ ...current, conclusion: e.target.value })} />
        </div>
      </>}
    </section>
  );
}
