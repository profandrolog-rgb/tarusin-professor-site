import { User, UserX, ChevronDown } from "lucide-react";
import { PatientPickerPopover, type PatientSelection } from "./PatientPickerPopover";

export function ThreadPatientBadge({
  value,
  onChange,
  variant = "header",
}: {
  value: PatientSelection;
  onChange: (sel: PatientSelection) => void;
  variant?: "header" | "inline";
}) {
  if (variant === "inline") {
    return (
      <PatientPickerPopover value={value} onChange={onChange}>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          title="Привязать чат к пациенту"
        >
          {value.id ? (
            <>
              <User className="w-3 h-3 text-primary" />
              <span>Контекст: <span className="text-foreground font-medium">{value.name}</span></span>
            </>
          ) : (
            <>
              <UserX className="w-3 h-3" />
              <span>Без привязки к пациенту</span>
            </>
          )}
          <span className="underline underline-offset-2">сменить</span>
        </button>
      </PatientPickerPopover>
    );
  }

  return (
    <PatientPickerPopover value={value} onChange={onChange}>
      <button
        type="button"
        className={
          value.id
            ? "text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            : "text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed text-muted-foreground hover:bg-accent"
        }
        title="Привязка чата к пациенту"
      >
        {value.id ? <User className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
        <span className="font-medium truncate max-w-[180px]">
          {value.id ? value.name : "Без пациента"}
        </span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
    </PatientPickerPopover>
  );
}
