import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { PROTOCOL_TYPE_MAP, ProtocolType } from "@/lib/visits/protocolTypes";

interface VisitForPrint {
  visit_date: string;
  protocol_type: ProtocolType;
  protocol_data: any;
  diagnosis: string | null;
  icd_code: string | null;
  next_visit_date: string | null;
  patient: { full_name: string; birth_date: string; history_number: string | null } | null;
}

function calcAge(birth: string, ref: Date) {
  const b = new Date(birth);
  let age = ref.getFullYear() - b.getFullYear();
  const m = ref.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < b.getDate())) age--;
  return age;
}

function Row({ label, value }: { label: string; value?: string | null | boolean }) {
  if (value === undefined || value === null || value === "" || value === false) return null;
  const display = typeof value === "boolean" ? "Да" : value;
  return (
    <div style={{ marginBottom: "2mm" }}>
      <strong>{label}:</strong> <span style={{ whiteSpace: "pre-wrap" }}>{display}</span>
    </div>
  );
}

export function VisitPrint({ visit }: { visit: VisitForPrint }) {
  const def = PROTOCOL_TYPE_MAP[visit.protocol_type];
  const data = visit.protocol_data || {};
  const visitDate = new Date(visit.visit_date);
  const age = visit.patient?.birth_date ? calcAge(visit.patient.birth_date, visitDate) : null;

  return (
    <div
      className="visit-print-area"
      style={{
        width: "190mm",
        minHeight: "270mm",
        padding: "10mm 12mm",
        fontFamily: "Times New Roman, serif",
        fontSize: "11pt",
        color: "#000",
        background: "#fff",
        lineHeight: 1.45,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "5mm" }}>
        <div style={{ fontSize: "10pt" }}>Профессор Тарусин Дмитрий Игоревич</div>
        <div style={{ fontSize: "9pt", color: "#444" }}>
          Детский уролог-андролог, доктор медицинских наук
        </div>
      </div>

      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13pt", marginBottom: "4mm" }}>
        {def?.title || visit.protocol_type}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10pt", marginBottom: "4mm" }}>
        <div>№ ИБ: <strong>{visit.patient?.history_number || "—"}</strong></div>
        <div>
          Дата: <strong>{format(visitDate, "dd MMMM yyyy", { locale: ru })} г.</strong>
        </div>
      </div>

      <Row label="Пациент" value={visit.patient?.full_name} />
      {visit.patient?.birth_date && (
        <Row
          label="Дата рождения"
          value={`${format(new Date(visit.patient.birth_date), "dd.MM.yyyy")}${age !== null ? ` (${age} лет)` : ""}`}
        />
      )}

      <div style={{ borderTop: "1px solid #000", margin: "3mm 0" }} />

      {/* Protocol-specific fields */}
      {visit.protocol_type === "ultrashort" && (
        <>
          <Row label="Жалобы" value={data.complaints} />
          <Row label="Заключение" value={data.conclusion} />
        </>
      )}

      {visit.protocol_type === "postop_day3" && (
        <>
          <Row label="Операция" value={data.operation_name} />
          <Row
            label="Дата операции"
            value={data.operation_date ? format(new Date(data.operation_date), "dd.MM.yyyy") : null}
          />
          <Row label="Температура" value={data.temperature} />
          <Row label="Общее состояние" value={data.general_status} />
          <Row label="Состояние раны" value={data.wound_status} />
          <Row label="Перевязка" value={data.dressing} />
          <Row label="Болевой синдром" value={data.pain} />
          <Row label="Жалобы" value={data.complaints} />
        </>
      )}

      {visit.protocol_type === "postop_day7" && (
        <>
          <Row label="Операция" value={data.operation_name} />
          <Row
            label="Дата операции"
            value={data.operation_date ? format(new Date(data.operation_date), "dd.MM.yyyy") : null}
          />
          <Row label="Общее состояние" value={data.general_status} />
          <Row label="Состояние раны" value={data.wound_status} />
          <Row label="Заживление" value={data.healing} />
          <Row label="Швы сняты" value={data.sutures_removed} />
          <Row label="Жалобы" value={data.complaints} />
        </>
      )}

      {(visit.diagnosis || visit.icd_code) && (
        <>
          <div style={{ borderTop: "1px solid #000", margin: "3mm 0" }} />
          <Row label="Диагноз" value={visit.diagnosis} />
          <Row label="Код МКБ-10" value={visit.icd_code} />
        </>
      )}

      {data.recommendations && (
        <>
          <div style={{ borderTop: "1px solid #000", margin: "3mm 0" }} />
          <Row label="Рекомендации" value={data.recommendations} />
        </>
      )}

      {visit.next_visit_date && (
        <Row
          label="Контрольный осмотр"
          value={format(new Date(visit.next_visit_date), "dd MMMM yyyy", { locale: ru }) + " г."}
        />
      )}

      <div style={{ marginTop: "15mm", display: "flex", justifyContent: "space-between", fontSize: "10pt" }}>
        <div>
          Лечащий врач: __________________ / Тарусин Д.И. /
        </div>
        <div>М.П.</div>
      </div>
    </div>
  );
}
