import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  value?: string;
  onChange: (v: string) => void;
}

/**
 * Универсальное поле "Дополнительно" — доступно во всех протоколах.
 * Сюда пишется всё, что не входит по смыслу ни в одно из штатных полей.
 * Печатается в конце протокола (см. ProtocolPrintLayout, ключ `additional_notes`).
 */
export function AdditionalNotesField({ value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">Дополнительно</Label>
      <Textarea
        rows={4}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Любые сведения, не подходящие под остальные поля протокола (нюансы визита, комментарии, договорённости и т. п.)"
      />
    </div>
  );
}
