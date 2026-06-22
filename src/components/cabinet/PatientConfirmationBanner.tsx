import { User, UserX, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PatientPickerPopover, type PatientSelection } from "./PatientPickerPopover";
import { Button } from "@/components/ui/button";
import type { ActivePatientContext } from "@/lib/protocolBridge";

/**
 * Shown at the top of action dialogs (Rx, Plan) to make the patient binding
 * explicit before the data leaves the chat. Never blocks confirmation —
 * just surfaces the target and lets the user change it.
 */
export function PatientConfirmationBanner({
  boundPatient,
  activeContext,
  onPatientChange,
}: {
  boundPatient: PatientSelection;
  activeContext?: ActivePatientContext | null;
  onPatientChange?: (sel: PatientSelection) => void;
}) {
  const tabId = activeContext?.patientId ?? null;
  const tabName = activeContext?.patientName ?? null;
  const mismatch = !!boundPatient.id && !!tabId && boundPatient.id !== tabId;
  const noBinding = !boundPatient.id;
  const tone = noBinding ? "warn" : mismatch ? "warn" : "ok";

  const toneClasses =
    tone === "ok"
      ? "bg-green-500/10 border-green-500/30 text-green-900 dark:text-green-100"
      : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100";

  const Trigger = (
    <Button variant="outline" size="sm" className="h-7 text-xs">
      {boundPatient.id ? "Сменить" : "Выбрать пациента"}
    </Button>
  );

  return (
    <div className={`border rounded-md p-2.5 flex items-center gap-2 text-sm ${toneClasses}`}>
      {tone === "ok" ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {boundPatient.id ? (
          <>
            Назначения уйдут пациенту:{" "}
            <span className="font-semibold">{boundPatient.name}</span>
            {mismatch && (
              <div className="text-xs mt-0.5 opacity-80">
                В соседней вкладке открыт другой пациент: <b>{tabName}</b>.
              </div>
            )}
          </>
        ) : tabId ? (
          <>
            Чат без привязки. В соседней вкладке открыт:{" "}
            <span className="font-semibold">{tabName}</span> — назначения уйдут ему.
          </>
        ) : (
          <>Чат без привязки к пациенту. Назначения будут в общей очереди.</>
        )}
      </div>
      {onPatientChange && (
        <div className="flex gap-1 shrink-0">
          {mismatch && tabId && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onPatientChange({ id: tabId, name: tabName })}
              title="Привязать к пациенту из соседней вкладки"
            >
              Взять из вкладки
            </Button>
          )}
          <PatientPickerPopover value={boundPatient} onChange={onPatientChange} align="end">
            {Trigger}
          </PatientPickerPopover>
        </div>
      )}
    </div>
  );
}
