import { useId } from "react";

interface Props {
  value: number | string | null | undefined;
  onChange: (v: number | string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** include the "нет" option */
  allowNone?: boolean;
}

/**
 * Combobox для возраста: список 9–17 (+ опционально «нет»), но можно ввести
 * любое число вручную. Хранит number, либо строку ("нет" или произвольное).
 */
export function AgeCombobox({ value, onChange, placeholder = "возраст", disabled, allowNone }: Props) {
  const listId = useId();
  const display = value === null || value === undefined ? "" : String(value);

  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        list={listId}
        value={display}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (raw === "") return onChange(null);
          if (raw === "нет") return onChange("нет");
          const n = Number(raw.replace(",", "."));
          if (Number.isFinite(n) && String(n) === raw) return onChange(n);
          onChange(raw);
        }}
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
      />
      <datalist id={listId}>
        {[9, 10, 11, 12, 13, 14, 15, 16, 17].map((n) => (
          <option key={n} value={String(n)} />
        ))}
        {allowNone ? <option value="нет" /> : null}
      </datalist>
    </>
  );
}
