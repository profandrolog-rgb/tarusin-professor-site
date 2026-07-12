import { format } from "date-fns";
import { ru, enUS } from "date-fns/locale";

export type PrescriptionLang = "ru" | "en";

interface PrescriptionPrintProps {
  prescription: {
    prescription_date: string;
    doctor_name: string;
    prescription_type: string;
    patient: { full_name: string; birth_date: string; full_name_latin?: string | null };
    signa?: string;
    extemporaneous_form_type?: string;
    items?: Array<{
      medication_latin_name: string;
      medication_ru_name?: string;
      medication_en_name?: string | null;
      dosage_form?: string;
      dose?: string;
      quantity: number;
      frequency?: string;
      duration?: string;
    }>;
    ingredients?: Array<{
      ingredient_name: string;
      ingredient_name_en?: string | null;
      amount: string;
      unit: string;
    }>;
  };
  lang?: PrescriptionLang;
}

// ---- i18n dictionary for the printable form (Form 107-1/у) ----
const T = {
  ru: {
    ministry1: "Министерство здравоохранения",
    ministry2: "Российской Федерации",
    orgStamp1: "Наименование (штамп)",
    orgStamp2: "медицинской организации",
    okud: "Код формы по ОКУД _______",
    okpo: "Код учреждения по ОКПО _______",
    docLine: "Медицинская документация",
    formNo: "Форма № 107-1/у",
    approved1: "Утверждена Приказом",
    approved2: "Министерства здравоохранения",
    approved3: "Российской Федерации",
    approved4: "от 24 ноября 2021 г. № 1094н",
    title: "РЕЦЕПТ",
    subtitle: "(взрослый, детский — ",
    underlineIt: "нужное подчеркнуть",
    subtitleEnd: ")",
    yearAbbr: "г.",
    patientFio: "Ф.И.О. пациента:",
    birthDate: "Дата рождения:",
    age: "Возраст:",
    doctorFio: "Ф.И.О. врача (фельдшера, акушерки):",
    signature1: "Подпись и печать лечащего",
    signature2: "врача (фельдшера, акушерки) _______________",
    stamp: "М.П.",
    validity1: "Рецепт действителен в течение ",
    validity2: " дней, 15 дней",
    validity3: "(нужное подчеркнуть)",
    validity4: "(количество)",
    days60: "60",
    misceHint: "Misce ut fiat — Смешай, чтобы получилось",
    directionsDefault: "По назначению врача",
    rubles: "_______ руб. _______ коп.",
    ageYearWord: (n: number) => {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return "год";
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "года";
      return "лет";
    },
  },
  en: {
    ministry1: "Ministry of Health",
    ministry2: "of the Russian Federation",
    orgStamp1: "Medical organization",
    orgStamp2: "(name / stamp)",
    okud: "OKUD form code _______",
    okpo: "OKPO organization code _______",
    docLine: "Medical documentation",
    formNo: "Form No. 107-1/у",
    approved1: "Approved by Order of the",
    approved2: "Ministry of Health",
    approved3: "of the Russian Federation",
    approved4: "No. 1094н of 24 November 2021",
    title: "PRESCRIPTION",
    subtitle: "(adult / pediatric — ",
    underlineIt: "underline as applicable",
    subtitleEnd: ")",
    yearAbbr: "",
    patientFio: "Patient full name:",
    birthDate: "Date of birth:",
    age: "Age:",
    doctorFio: "Physician (paramedic, midwife) full name:",
    signature1: "Signature and seal of the",
    signature2: "attending physician _______________",
    stamp: "L.S.",
    validity1: "This prescription is valid for ",
    validity2: " days, 15 days",
    validity3: "(underline as applicable)",
    validity4: "(quantity)",
    days60: "60",
    misceHint: "Misce ut fiat — Mix to obtain",
    directionsDefault: "Use as directed by the physician",
    rubles: "_______ RUB _______ kop.",
    ageYearWord: (n: number) => (n === 1 ? "year" : "years"),
  },
} as const;

const s = {
  page: {
    width: "105mm",
    minHeight: "148mm",
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

const FORM_LABELS_RU: Record<string, string> = {
  unguentum: "unguentum", pasta: "pastam", cremor: "cremorem", gel: "gel",
  linimentum: "linimentum", suspensio: "suspensionem", suppositoria: "suppositoria",
  mixtura: "mixturam", tinctura: "tincturam", solutio: "solutionem",
};

function getMisceFormLabel(formType?: string): string {
  return formType ? (FORM_LABELS_RU[formType] || formType) : "unguentum";
}

/** Показать название препарата по языку бланка. EN-версия: INN + (Trade). */
function renderMedName(item: NonNullable<PrescriptionPrintProps["prescription"]["items"]>[number], lang: PrescriptionLang): string {
  if (lang === "en") {
    const en = (item.medication_en_name || "").trim();
    const ru = (item.medication_ru_name || "").trim();
    if (en && ru && en.toLowerCase() !== ru.toLowerCase()) return `${en} (${ru})`;
    if (en) return en;
    // fallback — латинское название (уже интернационально)
    return item.medication_latin_name;
  }
  return item.medication_latin_name;
}

function renderIngredientName(
  ing: NonNullable<PrescriptionPrintProps["prescription"]["ingredients"]>[number],
  lang: PrescriptionLang,
): string {
  if (lang === "en") {
    const en = (ing.ingredient_name_en || "").trim();
    if (en) return `${en} (${ing.ingredient_name})`;
  }
  return ing.ingredient_name;
}

export function PrescriptionPrint({ prescription, lang = "ru" }: PrescriptionPrintProps) {
  const t = T[lang];
  const locale = lang === "en" ? enUS : ru;
  const date = new Date(prescription.prescription_date);
  const birthDate = new Date(prescription.patient.birth_date);

  const now = date;
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;

  // Международный формат даты в EN: "12 July 2026"
  const dateDayPart = lang === "en"
    ? format(date, "d", { locale })
    : format(date, "dd", { locale });
  const dateMonthPart = format(date, "LLLL", { locale });
  const dateYearPart = format(date, "yyyy", { locale });

  const patientName = lang === "en"
    ? (prescription.patient.full_name_latin || prescription.patient.full_name)
    : prescription.patient.full_name;

  return (
    <div className="prescription-print-area" style={s.page} lang={lang}>
      {/* === HEADER === */}
      <div style={s.headerRow}>
        <div>
          <div style={{ fontSize: "7pt", marginBottom: "0.5mm" }}>{t.ministry1}</div>
          <div style={{ fontSize: "7pt", marginBottom: "0.5mm" }}>{t.ministry2}</div>
          <div style={{ ...s.headerLeft, minWidth: "50mm", marginTop: "1mm" }}>&nbsp;</div>
          <div style={{ fontSize: "6pt", textAlign: "center" }}>{t.orgStamp1}</div>
          <div style={{ fontSize: "6pt", textAlign: "center" }}>{t.orgStamp2}</div>
        </div>
        <div style={s.headerRight}>
          <div>{t.okud}</div>
          <div>{t.okpo}</div>
          <div style={{ marginTop: "1mm" }}>{t.docLine}</div>
          <div style={{ fontWeight: "bold" }}>{t.formNo}</div>
          <div style={{ fontSize: "6pt" }}>{t.approved1}</div>
          <div style={{ fontSize: "6pt" }}>{t.approved2}</div>
          <div style={{ fontSize: "6pt" }}>{t.approved3}</div>
          <div style={{ fontSize: "6pt" }}>{t.approved4}</div>
        </div>
      </div>

      {/* === TITLE === */}
      <div style={s.formTitle}>
        <div style={{ fontSize: "11pt", fontWeight: "bold", letterSpacing: "2px" }}>
          {t.title}
        </div>
        <div style={{ fontSize: "8pt" }}>
          {t.subtitle}
          <span style={{ textDecoration: prescription.patient.birth_date && age < 18 ? "underline" : "none" }}>
            {t.underlineIt}
          </span>
          {t.subtitleEnd}
        </div>
      </div>

      {/* === DATE === */}
      <div style={s.fieldRow}>
        «<span style={{ ...s.line, minWidth: "8mm", textAlign: "center" }}>{dateDayPart}</span>»{" "}
        <span style={{ ...s.line, minWidth: "30mm", textAlign: "center" }}>{dateMonthPart}</span>{" "}
        <span style={{ ...s.line, minWidth: "15mm", textAlign: "center" }}>{dateYearPart}</span>
        {t.yearAbbr ? ` ${t.yearAbbr}` : ""}
      </div>

      {/* === PATIENT === */}
      <div style={s.fieldRow}>
        {t.patientFio}{" "}
        <span style={{ ...s.line, minWidth: "85mm" }}>{patientName}</span>
      </div>

      <div style={s.fieldRow}>
        {t.birthDate}{" "}
        <span style={{ ...s.line, minWidth: "25mm" }}>
          {lang === "en" ? format(birthDate, "d MMMM yyyy", { locale }) : format(birthDate, "dd.MM.yyyy")}
        </span>
        {" "}{t.age}{" "}
        <span style={{ ...s.line, minWidth: "15mm" }}>
          {age} {t.ageYearWord(age)}
        </span>
      </div>

      {/* === DOCTOR === */}
      <div style={s.fieldRow}>
        {t.doctorFio}{" "}
        <span style={{ ...s.line, minWidth: "60mm" }}>{prescription.doctor_name}</span>
      </div>

      <div style={s.separator}></div>

      {/* === Rp: BODY === */}
      {prescription.prescription_type === "standard" && prescription.items?.map((item, idx) => (
        <div key={idx} style={s.rpBlock}>
          <div>
            <strong>Rp:</strong>{" "}
            {renderMedName(item, lang)}
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
          <div style={{ textAlign: "right", fontSize: "8pt", marginTop: "0.5mm" }}>
            {t.rubles}
          </div>
        </div>
      ))}

      {prescription.prescription_type === "extemporaneous" && prescription.ingredients && (
        <div style={s.rpBlock}>
          <div><strong>Rp:</strong></div>
          {prescription.ingredients.map((ing, idx) => (
            <div key={idx} style={{ paddingLeft: "8mm" }}>
              {renderIngredientName(ing, lang)} {ing.amount} {ing.unit}
            </div>
          ))}
          <div style={{ paddingLeft: "8mm", marginTop: "1mm", fontStyle: "italic" }}>
            M.f. {getMisceFormLabel(prescription.extemporaneous_form_type)}
          </div>
          <div style={{ paddingLeft: "8mm", fontSize: "7pt", color: "#555" }}>
            {t.misceHint}
          </div>
          <div style={{ paddingLeft: "8mm", marginTop: "1mm" }}>
            D.S. {prescription.signa || t.directionsDefault}
          </div>
          <div style={{ textAlign: "right", fontSize: "8pt", marginTop: "0.5mm" }}>
            {t.rubles}
          </div>
        </div>
      )}

      {/* === SIGNATURE === */}
      <div style={s.sigRow}>
        <div>
          {t.signature1}<br/>
          {t.signature2}
        </div>
        <div style={{ textAlign: "right" }}>
          {t.stamp}
        </div>
      </div>

      {/* === VALIDITY === */}
      <div style={s.separator}></div>
      <div style={s.bottomNote}>
        {t.validity1}<span style={{ textDecoration: "underline" }}>{t.days60}</span>{t.validity2}
        <br/>
        {t.validity3} {t.validity4}
      </div>
    </div>
  );
}
