import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface PrescriptionPrintProps {
  prescription: {
    prescription_date: string;
    doctor_name: string;
    prescription_type: string;
    patient: { full_name: string; birth_date: string };
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

export function PrescriptionPrint({ prescription }: PrescriptionPrintProps) {
  const date = new Date(prescription.prescription_date);
  const birthDate = new Date(prescription.patient.birth_date);

  return (
    <div className="prescription-print-area" style={{ width: "148.5mm", minHeight: "105mm", padding: "8mm", fontFamily: "Times New Roman, serif", fontSize: "11pt", border: "1px solid #000", boxSizing: "border-box", background: "#fff", color: "#000" }}>
      {/* Header */}
      <div style={{ textAlign: "center", borderBottom: "1px solid #000", paddingBottom: "4mm", marginBottom: "4mm" }}>
        <div style={{ fontSize: "8pt", marginBottom: "2mm" }}>
          Министерство здравоохранения Российской Федерации
        </div>
        <div style={{ fontSize: "9pt", fontWeight: "bold" }}>
          РЕЦЕПТ
        </div>
        <div style={{ fontSize: "8pt" }}>
          (форма № 107-1/у)
        </div>
      </div>

      {/* Date */}
      <div style={{ marginBottom: "3mm", fontSize: "10pt" }}>
        <span>Дата: «</span>
        <span style={{ borderBottom: "1px solid #000", padding: "0 2mm", minWidth: "8mm", display: "inline-block" }}>
          {format(date, "dd")}
        </span>
        <span>» </span>
        <span style={{ borderBottom: "1px solid #000", padding: "0 2mm", minWidth: "30mm", display: "inline-block" }}>
          {format(date, "LLLL", { locale: ru })}
        </span>
        <span> </span>
        <span style={{ borderBottom: "1px solid #000", padding: "0 2mm" }}>
          {format(date, "yyyy")}
        </span>
        <span> г.</span>
      </div>

      {/* Patient info */}
      <div style={{ marginBottom: "2mm", fontSize: "10pt" }}>
        <span>Ф.И.О. пациента: </span>
        <span style={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: "80mm" }}>
          {prescription.patient.full_name}
        </span>
      </div>

      <div style={{ marginBottom: "2mm", fontSize: "10pt" }}>
        <span>Дата рождения: </span>
        <span style={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: "30mm" }}>
          {format(birthDate, "dd.MM.yyyy")}
        </span>
      </div>

      {/* Doctor */}
      <div style={{ marginBottom: "4mm", fontSize: "10pt" }}>
        <span>Ф.И.О. врача: </span>
        <span style={{ borderBottom: "1px solid #000", display: "inline-block", minWidth: "80mm" }}>
          {prescription.doctor_name}
        </span>
      </div>

      {/* Prescription body */}
      <div style={{ borderTop: "1px solid #000", paddingTop: "3mm" }}>
        {prescription.prescription_type === "standard" && prescription.items?.map((item, idx) => (
          <div key={idx} style={{ marginBottom: "3mm", fontSize: "10pt" }}>
            <div style={{ fontWeight: "bold" }}>
              Rp: {item.medication_latin_name}
              {item.dosage_form && ` (${item.dosage_form})`}
              {item.dose && ` ${item.dose}`}
            </div>
            <div style={{ paddingLeft: "10mm" }}>
              D.t.d. N {item.quantity}
            </div>
            {(item.frequency || item.duration) && (
              <div style={{ paddingLeft: "10mm" }}>
                S. {item.frequency}{item.frequency && item.duration ? ", " : ""}{item.duration}
              </div>
            )}
          </div>
        ))}

        {prescription.prescription_type === "extemporaneous" && prescription.ingredients && (
          <div style={{ fontSize: "10pt" }}>
            <div style={{ fontWeight: "bold" }}>Rp:</div>
            {prescription.ingredients.map((ing, idx) => (
              <div key={idx} style={{ paddingLeft: "10mm" }}>
                {ing.ingredient_name} {ing.amount} {ing.unit}
              </div>
            ))}
            <div style={{ paddingLeft: "10mm", marginTop: "2mm" }}>
              M.f. — Misce, fiat
            </div>
            <div style={{ paddingLeft: "10mm" }}>
              D.S. Наружно / По назначению врача
            </div>
          </div>
        )}
      </div>

      {/* Signature */}
      <div style={{ marginTop: "6mm", display: "flex", justifyContent: "space-between", fontSize: "10pt" }}>
        <div>
          Подпись врача: _______________
        </div>
        <div>
          М.П.
        </div>
      </div>
    </div>
  );
}
