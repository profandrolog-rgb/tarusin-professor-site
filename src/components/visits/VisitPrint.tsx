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
        {(() => {
          const base = def?.title || visit.protocol_type;
          if (visit.protocol_type === "postop_day7") {
            const n = (visit.protocol_data as any)?.day_number;
            if (typeof n === "number" && n > 0 && n !== 7) {
              return `Контрольный осмотр на ${n} сутки после операции`;
            }
          }
          return base;
        })()}
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

      {visit.protocol_type === "primary_short" && (
        <>
          <Row label="Жалобы" value={data.complaints} />
          <Row label="Анамнез" value={data.anamnesis} />
          {data.somatic && (
            <>
              <div style={{ marginTop: "2mm", fontWeight: "bold" }}>Соматический статус</div>
              {(data.somatic.height_cm || data.somatic.weight_kg || data.somatic.bp || data.somatic.pulse) && (
                <Row
                  label="Антропометрия / витальные"
                  value={[
                    data.somatic.height_cm ? `рост ${data.somatic.height_cm} см` : null,
                    data.somatic.weight_kg ? `вес ${data.somatic.weight_kg} кг` : null,
                    data.somatic.bp ? `АД ${data.somatic.bp}` : null,
                    data.somatic.pulse ? `пульс ${data.somatic.pulse}` : null,
                  ].filter(Boolean).join(", ")}
                />
              )}
              <Row label="Общее состояние" value={data.somatic.general} />
              <Row label="Кожные покровы" value={data.somatic.skin} />
              <Row label="Лимфоузлы" value={data.somatic.lymph_nodes} />
              <Row label="Органы дыхания" value={data.somatic.respiratory} />
              <Row label="ССС" value={data.somatic.cardiovascular} />
              <Row label="Живот" value={data.somatic.abdomen} />
            </>
          )}
          {data.sexual_formula && (
            <Row
              label="Половая формула"
              value={`P${data.sexual_formula.P ?? 0} Ax${data.sexual_formula.Ax ?? 0} F${data.sexual_formula.F ?? 0} L${data.sexual_formula.L ?? 0} G${data.sexual_formula.G ?? 0}${data.sexual_formula.formula_note ? ` — ${data.sexual_formula.formula_note}` : ""}`}
            />
          )}
          {data.local_status && (
            <>
              <div style={{ marginTop: "2mm", fontWeight: "bold" }}>Локальный статус</div>
              <Row label="Наружные половые органы" value={data.local_status.external_genitalia} />
              <Row label="Половой член" value={data.local_status.penis} />
              <Row label="Мошонка" value={data.local_status.scrotum} />
              <Row
                label="Правое яичко"
                value={[data.local_status.right_testis, data.local_status.right_testis_volume ? `объём ${data.local_status.right_testis_volume} мл` : null].filter(Boolean).join(", ")}
              />
              <Row
                label="Левое яичко"
                value={[data.local_status.left_testis, data.local_status.left_testis_volume ? `объём ${data.local_status.left_testis_volume} мл` : null].filter(Boolean).join(", ")}
              />
              <Row label="Придатки" value={data.local_status.epididymis} />
              <Row label="Семенные канатики" value={data.local_status.spermatic_cord} />
              <Row label="Паховые кольца" value={data.local_status.inguinal_rings} />
              <Row label="Дополнительно" value={data.local_status.notes} />
            </>
          )}
          <Row label="План обследования" value={data.exam_plan} />
        </>
      )}

      {visit.protocol_type === "repeat_with_labs" && (
        <>
          <Row label="Жалобы / динамика" value={data.complaints} />
          <div style={{ marginTop: "2mm", fontWeight: "bold" }}>Лабораторные данные</div>
          <Row label="ОАК" value={data.cbc} />
          <Row label="ОАМ" value={data.urinalysis} />
          <Row label="Биохимия" value={data.biochem} />
          <Row label="Гормоны" value={data.hormones} />
          <Row label="Другие исследования" value={data.other_labs} />
          {data.local_status && (
            <>
              <div style={{ marginTop: "2mm", fontWeight: "bold" }}>Локальный статус</div>
              <Row label="Наружные половые органы" value={data.local_status.external_genitalia} />
              <Row label="Половой член" value={data.local_status.penis} />
              <Row label="Мошонка" value={data.local_status.scrotum} />
              <Row label="Правое яичко" value={data.local_status.right_testis} />
              <Row label="Левое яичко" value={data.local_status.left_testis} />
            </>
          )}
          <Row label="Заключение" value={data.conclusion} />
        </>
      )}

      {(visit.protocol_type === "uzi_reproductive" || visit.protocol_type === "dynamic_with_uzi" || visit.protocol_type === "repeat_with_uzi") && data.uzi && (
        <>
          {visit.protocol_type !== "uzi_reproductive" && data.complaints && <Row label="Жалобы" value={data.complaints} />}
          {data.indications && <Row label="Показания" value={data.indications} />}
          <div style={{ marginTop: "2mm", fontWeight: "bold" }}>УЗИ органов мошонки</div>
          <Row label="Аппарат" value={data.uzi.device} />
          <Row label="Правое яичко" value={[data.uzi.right_testis_size, data.uzi.right_testis_volume ? `V ${data.uzi.right_testis_volume} мл` : null, data.uzi.right_testis_structure].filter(Boolean).join("; ")} />
          <Row label="Правый придаток" value={data.uzi.right_epididymis} />
          <Row label="Левое яичко" value={[data.uzi.left_testis_size, data.uzi.left_testis_volume ? `V ${data.uzi.left_testis_volume} мл` : null, data.uzi.left_testis_structure].filter(Boolean).join("; ")} />
          <Row label="Левый придаток" value={data.uzi.left_epididymis} />
          <Row label="Сосуды" value={data.uzi.vessels} />
          <Row label="ЦДК" value={data.uzi.doppler} />
          <Row label="Свободная жидкость" value={data.uzi.free_fluid} />
          <Row label="Заключение УЗИ" value={data.uzi.conclusion} />
          {data.conclusion && visit.protocol_type !== "uzi_reproductive" && <Row label="Заключение" value={data.conclusion} />}
        </>
      )}

      {visit.protocol_type === "uzi_urinary" && data.uzi && (
        <>
          {data.indications && <Row label="Показания" value={data.indications} />}
          <div style={{ marginTop: "2mm", fontWeight: "bold" }}>УЗИ органов мочевыделительной системы</div>
          <Row label="Аппарат" value={data.uzi.device} />
          <Row label="Правая почка" value={[data.uzi.right_kidney_size, data.uzi.right_kidney_parenchyma, data.uzi.right_kidney_pelvis, data.uzi.right_kidney_structure].filter(Boolean).join("; ")} />
          <Row label="Левая почка" value={[data.uzi.left_kidney_size, data.uzi.left_kidney_parenchyma, data.uzi.left_kidney_pelvis, data.uzi.left_kidney_structure].filter(Boolean).join("; ")} />
          <Row label="Мочеточники" value={data.uzi.ureters} />
          <Row label="Мочевой пузырь" value={[data.uzi.bladder_volume ? `V ${data.uzi.bladder_volume} мл` : null, data.uzi.bladder_walls, data.uzi.bladder_contents].filter(Boolean).join("; ")} />
          <Row label="Остаточная моча" value={data.uzi.residual_urine} />
          <Row label="Заключение УЗИ" value={data.uzi.conclusion} />
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
