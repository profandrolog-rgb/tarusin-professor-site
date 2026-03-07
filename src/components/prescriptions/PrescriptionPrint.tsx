import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface PrescriptionPrintProps {
  prescription: {
    prescription_date: string;
    doctor_name: string;
    prescription_type: string;
    patient: { full_name: string; birth_date: string };
    signa?: string;
    extemporaneous_form_type?: string;
    items?: Array<{
      medication_latin_name: string;
      dosage_form?: string;
      dose?: string;
      quantity: number;
      frequency?: string;
      duration?: string;
    }>;
    ingredients?: Array<{
      ingredient_name: string;
      amount: string;
      unit: string;
    }>;
  };
}

const s = {
  page: {
    width: "148.5mm",
    minHeight: "105mm",
    padding: "5mm 6mm",
    fontFamily: "Times New Roman, serif",
    fontSize: "9pt",
    border: "1px solid #000",
    boxSizing: "border-box" as const,
    background: "#fff",
    color: "#000",
    lineHeight: "1.4",
    position: "relative" as const,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "7pt",
    marginBottom: "1mm",
  },
  headerLeft: {
    borderBottom: "1px solid #000",
    minWidth: "55mm",
    textAlign: "center" as const,
    paddingBottom: "0.5mm",
    fontSize: "7pt",
  },
  headerRight: {
    textAlign: "right" as const,
    fontSize: "7pt",
  },
  formTitle: {
    textAlign: "center" as const,
    marginTop: "2mm",
    marginBottom: "2mm",
  },
  line: {
    borderBottom: "1px solid #000",
    display: "inline-block",
    minWidth: "20mm",
    verticalAlign: "bottom",
  },
  fieldRow: {
    marginBottom: "1.5mm",
    fontSize: "9pt",
  },
  separator: {
    borderTop: "1px solid #000",
    margin: "2mm 0",
  },
  rpBlock: {
    fontSize: "9pt",
    marginBottom: "2mm",
  },
  sigRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "3mm",
    fontSize: "9pt",
  },
  bottomNote: {
    fontSize: "7pt",
    marginTop: "2mm",
    textAlign: "center" as const,
  },
};

export function PrescriptionPrint({ prescription }: PrescriptionPrintProps) {
  const date = new Date(prescription.prescription_date);
  const birthDate = new Date(prescription.patient.birth_date);

  // Calculate age
  const now = date;
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;

  return (
    <div className="prescription-print-area" style={s.page}>
      {/* === HEADER === */}
      <div style={s.headerRow}>
        <div>
          <div style={{ fontSize: "7pt", marginBottom: "0.5mm" }}>
            Министерство здравоохранения
          </div>
          <div style={{ fontSize: "7pt", marginBottom: "0.5mm" }}>
            Российской Федерации
          </div>
          <div style={{ ...s.headerLeft, minWidth: "50mm", marginTop: "1mm" }}>
            &nbsp;
          </div>
          <div style={{ fontSize: "6pt", textAlign: "center" }}>
            Наименование (штамп)
          </div>
          <div style={{ fontSize: "6pt", textAlign: "center" }}>
            медицинской организации
          </div>
        </div>
        <div style={s.headerRight}>
          <div>Код формы по ОКУД _______</div>
          <div>Код учреждения по ОКПО _______</div>
          <div style={{ marginTop: "1mm" }}>Медицинская документация</div>
          <div style={{ fontWeight: "bold" }}>Форма № 107-1/у</div>
          <div style={{ fontSize: "6pt" }}>
            Утверждена Приказом
          </div>
          <div style={{ fontSize: "6pt" }}>
            Министерства здравоохранения
          </div>
          <div style={{ fontSize: "6pt" }}>
            Российской Федерации
          </div>
          <div style={{ fontSize: "6pt" }}>
            от 24 ноября 2021 г. № 1094н
          </div>
        </div>
      </div>

      {/* === TITLE === */}
      <div style={s.formTitle}>
        <div style={{ fontSize: "11pt", fontWeight: "bold", letterSpacing: "2px" }}>
          РЕЦЕПТ
        </div>
        <div style={{ fontSize: "8pt" }}>
          (взрослый, детский — <span style={{ textDecoration: prescription.patient.birth_date && age < 18 ? "underline" : "none" }}>нужное подчеркнуть</span>)
        </div>
      </div>

      {/* === DATE === */}
      <div style={s.fieldRow}>
        «<span style={{ ...s.line, minWidth: "8mm", textAlign: "center" }}>{format(date, "dd")}</span>»{" "}
        <span style={{ ...s.line, minWidth: "30mm", textAlign: "center" }}>
          {format(date, "LLLL", { locale: ru })}
        </span>{" "}
        <span style={{ ...s.line, minWidth: "15mm", textAlign: "center" }}>
          {format(date, "yyyy")}
        </span>{" "}г.
      </div>

      {/* === PATIENT === */}
      <div style={s.fieldRow}>
        Ф.И.О. пациента:{" "}
        <span style={{ ...s.line, minWidth: "85mm" }}>
          {prescription.patient.full_name}
        </span>
      </div>

      <div style={s.fieldRow}>
        Дата рождения:{" "}
        <span style={{ ...s.line, minWidth: "25mm" }}>
          {format(birthDate, "dd.MM.yyyy")}
        </span>
        {" "}Возраст:{" "}
        <span style={{ ...s.line, minWidth: "15mm" }}>
          {age} {age % 10 === 1 && age !== 11 ? "год" : (age % 10 >= 2 && age % 10 <= 4 && (age < 12 || age > 14)) ? "года" : "лет"}
        </span>
      </div>

      {/* === DOCTOR === */}
      <div style={s.fieldRow}>
        Ф.И.О. врача (фельдшера, акушерки):{" "}
        <span style={{ ...s.line, minWidth: "60mm" }}>
          {prescription.doctor_name}
        </span>
      </div>

      {/* === SEPARATOR === */}
      <div style={s.separator}></div>

      {/* === Rp: BODY === */}
      {prescription.prescription_type === "standard" && prescription.items?.map((item, idx) => (
        <div key={idx} style={s.rpBlock}>
          <div>
            <strong>Rp:</strong>{" "}
            {item.medication_latin_name}
            {item.dosage_form ? ` (${item.dosage_form})` : ""}
            {item.dose ? ` ${item.dose}` : ""}
          </div>
          <div style={{ paddingLeft: "8mm" }}>
            D.t.d. N {item.quantity}
          </div>
          {(item.frequency || item.duration) && (
            <div style={{ paddingLeft: "8mm" }}>
              S. {item.frequency}{item.frequency && item.duration ? ", " : ""}{item.duration}
            </div>
          )}
          {/* Price line */}
          <div style={{ textAlign: "right", fontSize: "8pt", marginTop: "0.5mm" }}>
            _______ руб. _______ коп.
          </div>
        </div>
      ))}

      {prescription.prescription_type === "extemporaneous" && prescription.ingredients && (
        <div style={s.rpBlock}>
          <div><strong>Rp:</strong></div>
          {prescription.ingredients.map((ing, idx) => (
            <div key={idx} style={{ paddingLeft: "8mm" }}>
              {ing.ingredient_name} {ing.amount} {ing.unit}
            </div>
          ))}
          <div style={{ paddingLeft: "8mm", marginTop: "1mm" }}>
            M.f. — Misce, fiat
          </div>
          <div style={{ paddingLeft: "8mm" }}>
            D.S. По назначению врача
          </div>
          <div style={{ textAlign: "right", fontSize: "8pt", marginTop: "0.5mm" }}>
            _______ руб. _______ коп.
          </div>
        </div>
      )}

      {/* === SIGNATURE === */}
      <div style={s.sigRow}>
        <div>
          Подпись и печать лечащего<br/>
          врача (фельдшера, акушерки) _______________
        </div>
        <div style={{ textAlign: "right" }}>
          М.П.
        </div>
      </div>

      {/* === VALIDITY === */}
      <div style={s.separator}></div>
      <div style={s.bottomNote}>
        Рецепт действителен в течение <span style={{ textDecoration: "underline" }}>60 дней</span>, 15 дней
        <br/>
        (нужное подчеркнуть) (количество)
      </div>
    </div>
  );
}
