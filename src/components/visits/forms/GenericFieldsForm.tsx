import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

/**
 * Универсальная форма для протоколов произвольной структуры
 * (типы unknown / dynamic / postop_day10 / online_consult).
 * Рендерит все ключи из data.fields как textarea и позволяет
 * добавлять/удалять произвольные поля.
 */
interface Props {
  data: any;
  onChange: (patch: any) => void;
}

export function GenericFieldsForm({ data, onChange }: Props) {
  const fields: Record<string, any> = (data && typeof data.fields === "object" && data.fields) || {};
  const keys = useMemo(() => Object.keys(fields), [fields]);
  const [newKey, setNewKey] = useState("");

  const setField = (k: string, v: string) => {
    onChange({ fields: { ...fields, [k]: v } });
  };
  const removeField = (k: string) => {
    const next = { ...fields };
    delete next[k];
    onChange({ fields: next });
  };
  const addField = () => {
    const k = newKey.trim();
    if (!k) return;
    if (fields[k] !== undefined) return;
    onChange({ fields: { ...fields, [k]: "" } });
    setNewKey("");
  };

  return (
    <div className="space-y-4">
      {keys.length === 0 && (
        <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
          Поля не заданы. Добавьте первое поле ниже.
        </div>
      )}
      {keys.map((k) => (
        <div key={k} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm">{k}</Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-destructive"
              onClick={() => removeField(k)}
            >
              <Trash2 className="h-3 w-3 mr-1" /> удалить
            </Button>
          </div>
          <Textarea
            rows={3}
            value={typeof fields[k] === "string" ? fields[k] : JSON.stringify(fields[k], null, 2)}
            onChange={(e) => setField(k, e.target.value)}
          />
        </div>
      ))}

      <div className="flex items-end gap-2 pt-2 border-t">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Новое поле</Label>
          <Input
            placeholder="Например: Жалобы"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addField();
              }
            }}
          />
        </div>
        <Button type="button" variant="outline" onClick={addField} disabled={!newKey.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Добавить
        </Button>
      </div>
    </div>
  );
}
