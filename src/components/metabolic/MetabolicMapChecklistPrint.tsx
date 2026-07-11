import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { METABOLIC_MAP_CHECKLIST } from "@/data/metabolicMapChecklist";

interface Props {
  patientName: string;
  birthDate?: string | null;
  doctorName?: string;
  selectedCodes: string[];
  date?: Date;
}

const s = {
  page: {
    width: "210mm",
    minHeight: "297mm",
    padding: "12mm 14mm",
    fontFamily: "Times New Roman, serif",
    fontSize: "10pt",
    boxSizing: "border-box" as const,
    background: "#fff",
    color: "#000",
    lineHeight: "1.35",
  },
  header: {
    borderBottom: "1px solid #000",
    paddingBottom: "3mm",
    marginBottom: "4mm",
  },
  title: {
    textAlign: "center" as const,
    fontSize: "13pt",
    fontWeight: "bold" as const,
    letterSpacing: "1px",
    marginBottom: "2mm",
  },
  subtitle: {
    textAlign: "center" as const,
    fontSize: "9pt",
    color: "#333",
    marginBottom: "3mm",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10pt",
    gap: "8mm",
    flexWrap: "wrap" as const,
  },
  line: {
    borderBottom: "1px solid #000",
    display: "inline-block",
    minWidth: "40mm",
    paddingLeft: "2mm",
  },
  sectionTitle: {
    fontWeight: "bold" as const,
    fontSize: "10.5pt",
    marginTop: "3mm",
    marginBottom: "1.5mm",
    borderBottom: "1px dashed #666",
    paddingBottom: "0.5mm",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    columnGap: "6mm",
    rowGap: "1mm",
  },
  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: "2mm",
    fontSize: "9.5pt",
    breakInside: "avoid" as const,
  },
  box: {
    display: "inline-block",
    width: "3.2mm",
    height: "3.2mm",
    border: "1px solid #000",
    marginTop: "1mm",
    flexShrink: 0,
    textAlign: "center" as const,
    lineHeight: "3mm",
    fontSize: "9pt",
    fontWeight: "bold" as const,
  },
  code: {
    fontFamily: "monospace",
    fontSize: "8.5pt",
    color: "#555",
    marginRight: "1mm",
  },
  footer: {
    marginTop: "6mm",
    paddingTop: "3mm",
    borderTop: "1px solid #000",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "9.5pt",
  },
};

function calcAge(birth: Date, at: Date): number {
  let age = at.getFullYear() - birth.getFullYear();
  const m = at.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < birth.getDate())) age--;
  return age;
}

function ageSuffix(age: number): string {
  const mod10 = age % 10;
  const mod100 = age % 100;
  if (mod10 === 1 && mod100 !== 11) return "год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "года";
  return "лет";
}

export function MetabolicMapChecklistPrint({
  patientName,
  birthDate,
  doctorName,
  selectedCodes,
  date,
}: Props) {
  const now = date || new Date();
  const selected = new Set(selectedCodes);
  const birth = birthDate ? new Date(birthDate) : null;
  const age = birth ? calcAge(birth, now) : null;

  return (
    <div className="metabolic-checklist-print-area" style={s.page}>
      <div style={s.header}>
        <div style={s.title}>БЛАНК ОБСЛЕДОВАНИЯ — МЕТАБОЛИЧЕСКАЯ КАРТА</div>
        <div style={s.subtitle}>
          Комплексная лабораторная оценка обмена веществ и гормональных осей
        </div>
        <div style={s.metaRow}>
          <div>
            Ф.И.О.: <span style={s.line}>{patientName || " "}</span>
          </div>
          <div>
            Дата рождения:{" "}
            <span style={{ ...s.line, minWidth: "25mm" }}>
              {birth ? format(birth, "dd.MM.yyyy") : " "}
            </span>
            {age !== null ? (
              <>
                {" "}Возраст:{" "}
                <span style={{ ...s.line, minWidth: "18mm" }}>
                  {age} {ageSuffix(age)}
                </span>
              </>
            ) : null}
          </div>
          <div>
            Дата составления:{" "}
            <span style={{ ...s.line, minWidth: "30mm" }}>
              {format(now, "dd MMMM yyyy", { locale: ru })} г.
            </span>
          </div>
        </div>
      </div>

      {METABOLIC_MAP_CHECKLIST.map((section) => (
        <div key={section.title} style={{ breakInside: "avoid" as const }}>
          <div style={s.sectionTitle}>{section.title}</div>
          <div style={s.itemsGrid}>
            {section.items.map((it) => {
              const on = selected.has(it.code);
              return (
                <div key={it.code} style={s.item}>
                  <span style={s.box}>{on ? "✓" : ""}</span>
                  <span>
                    <span style={s.code}>{it.code}</span>
                    {it.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={s.footer}>
        <div>
          Врач:{" "}
          <span style={{ ...s.line, minWidth: "60mm" }}>
            {doctorName || " "}
          </span>
        </div>
        <div>Подпись / М.П. _______________________</div>
      </div>
    </div>
  );
}
