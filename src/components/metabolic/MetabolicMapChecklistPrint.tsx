import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { METABOLIC_MAP_ITEMS, CATS, type ChecklistItem } from "@/data/metabolicMapChecklist";

export type ChecklistPrintMode = "patient" | "doctor";

interface Props {
  mode: ChecklistPrintMode;
  patientName?: string;
  birthDate?: string | null;
  doctorName?: string;
  selectedCodes?: string[];
  activeCats?: string[];
  date?: Date;
  extraNote?: string;
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
  clinicHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #000",
    paddingBottom: "2mm",
    marginBottom: "3mm",
    fontSize: "9pt",
  },
  title: {
    textAlign: "center" as const,
    fontSize: "13pt",
    fontWeight: "bold" as const,
    letterSpacing: "1px",
    margin: "2mm 0",
  },
  intro: {
    fontSize: "9.5pt",
    textAlign: "justify" as const,
    marginBottom: "3mm",
    color: "#222",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10pt",
    gap: "6mm",
    flexWrap: "wrap" as const,
    marginBottom: "3mm",
  },
  line: {
    borderBottom: "1px solid #000",
    display: "inline-block",
    minWidth: "40mm",
    paddingLeft: "2mm",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    columnGap: "6mm",
    rowGap: "1.2mm",
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
  catBadge: {
    display: "inline-block",
    border: "1px solid #999",
    borderRadius: "2mm",
    padding: "0 1.2mm",
    fontSize: "7.5pt",
    color: "#333",
    marginRight: "1mm",
    marginTop: "0.5mm",
  },
  extraBlock: {
    marginTop: "5mm",
    border: "1px solid #666",
    minHeight: "18mm",
    padding: "2mm 3mm",
    fontSize: "9pt",
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
  const mod10 = age % 10, mod100 = age % 100;
  if (mod10 === 1 && mod100 !== 11) return "год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "года";
  return "лет";
}

const PATIENT_INTRO =
  "Уважаемые родители! Этот бланк — план лабораторного обследования, составленный специально для вашего ребёнка. " +
  "Метаболическая карта показывает, как в организме работают гормоны, обмен веществ, витамины и микроэлементы, " +
  "как справляется печень и кишечник, и где именно возникают перегрузки. Отмеченные ниже показатели нужно сдать в лаборатории; " +
  "результаты вы приносите на приём — по ним доктор строит персональную схему коррекции и наблюдения.";

export function MetabolicMapChecklistPrint({
  mode,
  patientName,
  birthDate,
  doctorName,
  selectedCodes,
  activeCats,
  date,
  extraNote,
}: Props) {
  const now = date || new Date();
  const selected = new Set(selectedCodes || []);
  const activeCatSet = new Set(activeCats || []);
  const birth = birthDate ? new Date(birthDate) : null;
  const age = birth ? calcAge(birth, now) : null;

  const filterByCats = (it: ChecklistItem) =>
    activeCatSet.size === 0 || it.cats.some((c) => activeCatSet.has(c));

  const items =
    mode === "patient"
      ? METABOLIC_MAP_ITEMS.filter((i) => selected.has(i.code))
      : METABOLIC_MAP_ITEMS.filter(filterByCats);

  return (
    <div className="metabolic-checklist-print-area" style={s.page}>
      <div style={s.clinicHeader}>
        <div>
          <div style={{ fontWeight: "bold" }}>Международный андрологический центр</div>
          <div style={{ color: "#444" }}>tarusin.pro</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: "bold" }}>Тарусин Д.И.</div>
          <div style={{ color: "#444" }}>Профессор, детский уролог-андролог</div>
        </div>
      </div>

      <div style={s.title}>
        {mode === "patient"
          ? "БЛАНК МЕТАБОЛИЧЕСКОЙ КАРТЫ ПАЦИЕНТА"
          : "СПРАВОЧНИК ПАРАМЕТРОВ МЕТАБОЛИЧЕСКОЙ КАРТЫ"}
      </div>

      {mode === "patient" && <div style={s.intro}>{PATIENT_INTRO}</div>}

      {mode === "patient" && (
        <div style={s.metaRow}>
          <div>
            Ф.И.О.: <span style={s.line}>{patientName || " "}</span>
          </div>
          <div>
            Дата рождения:{" "}
            <span style={{ ...s.line, minWidth: "25mm" }}>
              {birth ? format(birth, "dd.MM.yyyy") : " "}
            </span>
            {age !== null && (
              <>
                {" "}Возраст:{" "}
                <span style={{ ...s.line, minWidth: "18mm" }}>
                  {age} {ageSuffix(age)}
                </span>
              </>
            )}
          </div>
          <div>
            Дата:{" "}
            <span style={{ ...s.line, minWidth: "30mm" }}>
              {format(now, "dd MMMM yyyy", { locale: ru })} г.
            </span>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ fontSize: "10pt", color: "#666", padding: "6mm 0" }}>
          {mode === "patient"
            ? "Не отмечено ни одного параметра."
            : "Нет параметров по выбранным категориям."}
        </div>
      ) : (
        <div style={s.itemsGrid}>
          {items.map((it) => (
            <div key={it.code} style={s.item}>
              {mode === "patient" && <span style={s.box}>✓</span>}
              <span>
                <span style={s.code}>{it.code}</span>
                {it.label}
                {mode === "doctor" && (
                  <div style={{ marginTop: "0.5mm" }}>
                    {it.cats.map((c) => (
                      <span key={c} style={s.catBadge}>
                        {CATS[c]}
                      </span>
                    ))}
                  </div>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {mode === "patient" && (
        <div style={s.extraBlock}>
          <div style={{ fontWeight: "bold", marginBottom: "1mm" }}>Дополнительно:</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{extraNote || ""}</div>
        </div>
      )}

      {mode === "patient" && (
        <div style={s.footer}>
          <div>
            Врач:{" "}
            <span style={{ ...s.line, minWidth: "60mm" }}>
              {doctorName || "Тарусин Д.И."}
            </span>
          </div>
          <div>Подпись / М.П. _______________________</div>
        </div>
      )}
    </div>
  );
}
