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

function Field({ label, value }: { label: string; value?: string | number | null | boolean }) {
  if (value === undefined || value === null || value === "" || value === false) return null;
  const display = typeof value === "boolean" ? "Да" : String(value);
  return (
    <tr>
      <td className="ppl-label">{label}</td>
      <td className="ppl-value">{display}</td>
    </tr>
  );
}

function SideField({
  label,
  right,
  left,
}: {
  label: string;
  right?: string | number | null;
  left?: string | number | null;
}) {
  if (!right && !left) return null;
  return (
    <tr>
      <td className="ppl-label">{label}</td>
      <td className="ppl-value">
        <table className="ppl-side">
          <tbody>
            <tr>
              <td className="ppl-side-cell"><strong>Справа:</strong> {right || "—"}</td>
              <td className="ppl-side-cell"><strong>Слева:</strong> {left || "—"}</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <tr>
        <td colSpan={2} className="ppl-section">{title}</td>
      </tr>
      {children}
    </>
  );
}

const UZI_LABELS: Record<string, string> = {
  device: "Аппарат", indications: "Показания", conclusion: "Заключение УЗИ",
  vessels: "Сосуды", doppler: "ЦДК", free_fluid: "Свободная жидкость",
  ureters: "Мочеточники", residual_urine: "Остаточная моча",
  bladder_volume: "Объём мочевого пузыря, мл",
  bladder_walls: "Стенки мочевого пузыря", bladder_contents: "Содержимое мочевого пузыря",
  right_testis_size: "Правое яичко (размеры)", left_testis_size: "Левое яичко (размеры)",
  right_testis_volume: "Правое яичко, V мл", left_testis_volume: "Левое яичко, V мл",
  right_testis_structure: "Правое яичко (структура)", left_testis_structure: "Левое яичко (структура)",
  right_epididymis: "Правый придаток", left_epididymis: "Левый придаток",
  right_kidney_size: "Правая почка (размеры)", left_kidney_size: "Левая почка (размеры)",
  right_kidney_parenchyma: "Правая почка (паренхима)", left_kidney_parenchyma: "Левая почка (паренхима)",
  right_kidney_pelvis: "Правая почка (лоханка)", left_kidney_pelvis: "Левая почка (лоханка)",
  right_kidney_structure: "Правая почка (структура)", left_kidney_structure: "Левая почка (структура)",
  testes: "Яички", epididymis: "Придатки", kidneys: "Почки",
  bladder: "Мочевой пузырь", prostate: "Предстательная железа", scrotum: "Мошонка",
  size: "Размеры", volume: "Объём, мл", structure: "Структура",
  parenchyma: "Паренхима", pelvis: "Лоханка",
};
const humanize = (k: string) => UZI_LABELS[k] || k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const isPlainObject = (v: any): v is Record<string, any> => v !== null && typeof v === "object" && !Array.isArray(v);
const hasRightLeft = (v: any) => isPlainObject(v) && ("right" in v || "left" in v);
const renderScalar = (v: any): string => {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "boolean") return v ? "Да" : "Нет";
  return String(v);
};

function UziRenderer({ uzi, title }: { uzi: Record<string, any>; title: string }) {
  const rows: React.ReactNode[] = [];
  const walk = (obj: Record<string, any>, prefix = "") => {
    Object.entries(obj).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") return;
      const rk = `${prefix}${k}`;
      if (hasRightLeft(v)) {
        rows.push(<SideField key={rk} label={humanize(k)} right={renderScalar(v.right)} left={renderScalar(v.left)} />);
      } else if (isPlainObject(v)) {
        rows.push(<tr key={`${rk}-h`}><td colSpan={2} className="ppl-subsection">{humanize(k)}</td></tr>);
        walk(v, `${rk}.`);
      } else {
        rows.push(<Field key={rk} label={humanize(k)} value={renderScalar(v)} />);
      }
    });
  };
  walk(uzi);
  if (rows.length === 0) return null;
  return <Section title={title}>{rows}</Section>;
}

function ProtocolBody({ visit }: { visit: VisitForPrint }) {
  const t = visit.protocol_type;
  const d = visit.protocol_data || {};
  const rows: React.ReactNode[] = [];

  if (t === "ultrashort") {
    rows.push(<Field key="c" label="Жалобы" value={d.complaints} />);
    rows.push(<Field key="z" label="Заключение" value={d.conclusion} />);
  }

  if (t === "postop_day3" || t === "postop_day7") {
    rows.push(<Field key="op" label="Операция" value={d.operation_name} />);
    rows.push(
      <Field
        key="opd"
        label="Дата операции"
        value={d.operation_date ? format(new Date(d.operation_date), "dd.MM.yyyy") : null}
      />
    );
    if (t === "postop_day3") rows.push(<Field key="t" label="Температура" value={d.temperature} />);
    rows.push(<Field key="gs" label="Общее состояние" value={d.general_status} />);
    rows.push(<Field key="ws" label="Состояние раны" value={d.wound_status} />);
    if (t === "postop_day3") {
      rows.push(<Field key="dr" label="Перевязка" value={d.dressing} />);
      rows.push(<Field key="p" label="Болевой синдром" value={d.pain} />);
    } else {
      rows.push(<Field key="h" label="Заживление" value={d.healing} />);
      rows.push(<Field key="su" label="Швы сняты" value={d.sutures_removed} />);
    }
    rows.push(<Field key="cm" label="Жалобы" value={d.complaints} />);
  }

  if (t === "primary_short") {
    rows.push(<Field key="c" label="Жалобы" value={d.complaints} />);
    rows.push(<Field key="a" label="Анамнез" value={d.anamnesis} />);
    if (d.somatic) {
      const anth = [
        d.somatic.height_cm ? `рост ${d.somatic.height_cm} см` : null,
        d.somatic.weight_kg ? `вес ${d.somatic.weight_kg} кг` : null,
        d.somatic.bp ? `АД ${d.somatic.bp}` : null,
        d.somatic.pulse ? `пульс ${d.somatic.pulse}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      rows.push(
        <Section key="som" title="Соматический статус">
          <Field label="Антропометрия / витальные" value={anth} />
          <Field label="Общее состояние" value={d.somatic.general} />
          <Field label="Кожные покровы" value={d.somatic.skin} />
          <Field label="Лимфоузлы" value={d.somatic.lymph_nodes} />
          <Field label="Органы дыхания" value={d.somatic.respiratory} />
          <Field label="ССС" value={d.somatic.cardiovascular} />
          <Field label="Живот" value={d.somatic.abdomen} />
        </Section>
      );
    }
    if (d.sexual_formula) {
      const f = d.sexual_formula;
      rows.push(
        <Field
          key="sf"
          label="Половая формула"
          value={`P${f.P ?? 0} Ax${f.Ax ?? 0} F${f.F ?? 0} L${f.L ?? 0} G${f.G ?? 0}${
            f.formula_note ? ` — ${f.formula_note}` : ""
          }`}
        />
      );
    }
    if (d.local_status) {
      const ls = d.local_status;
      rows.push(
        <Section key="ls" title="Локальный статус">
          <Field label="Наружные половые органы" value={ls.external_genitalia} />
          <Field label="Половой член" value={ls.penis} />
          <Field label="Мошонка" value={ls.scrotum} />
          <SideField
            label="Яичко"
            right={[ls.right_testis, ls.right_testis_volume ? `объём ${ls.right_testis_volume} мл` : null]
              .filter(Boolean)
              .join(", ")}
            left={[ls.left_testis, ls.left_testis_volume ? `объём ${ls.left_testis_volume} мл` : null]
              .filter(Boolean)
              .join(", ")}
          />
          <Field label="Придатки" value={ls.epididymis} />
          <Field label="Семенные канатики" value={ls.spermatic_cord} />
          <Field label="Паховые кольца" value={ls.inguinal_rings} />
          <Field label="Дополнительно" value={ls.notes} />
        </Section>
      );
    }
    rows.push(<Field key="ep" label="План обследования" value={d.exam_plan} />);
    if (d.uzi && isPlainObject(d.uzi)) {
      rows.push(<UziRenderer key="uzi" uzi={d.uzi} title="УЗИ" />);
    }
  }

  if (t === "repeat_with_labs") {
    rows.push(<Field key="c" label="Жалобы / динамика" value={d.complaints} />);
    rows.push(
      <Section key="labs" title="Лабораторные данные">
        <Field label="ОАК" value={d.cbc} />
        <Field label="ОАМ" value={d.urinalysis} />
        <Field label="Биохимия" value={d.biochem} />
        <Field label="Гормоны" value={d.hormones} />
        <Field label="Другие исследования" value={d.other_labs} />
      </Section>
    );
    if (d.local_status) {
      const ls = d.local_status;
      rows.push(
        <Section key="ls" title="Локальный статус">
          <Field label="Наружные половые органы" value={ls.external_genitalia} />
          <Field label="Половой член" value={ls.penis} />
          <Field label="Мошонка" value={ls.scrotum} />
          <SideField label="Яичко" right={ls.right_testis} left={ls.left_testis} />
        </Section>
      );
    }
    rows.push(<Field key="z" label="Заключение" value={d.conclusion} />);
  }

  if ((t === "uzi_reproductive" || t === "dynamic_with_uzi" || t === "repeat_with_uzi") && d.uzi) {
    if (t !== "uzi_reproductive") rows.push(<Field key="c" label="Жалобы" value={d.complaints} />);
    rows.push(<Field key="i" label="Показания" value={d.indications} />);
    rows.push(<UziRenderer key="uzi" uzi={d.uzi} title="УЗИ органов мошонки" />);
    if (t !== "uzi_reproductive") rows.push(<Field key="z" label="Заключение" value={d.conclusion} />);
  }

  if (t === "uzi_urinary" && d.uzi) {
    rows.push(<Field key="i" label="Показания" value={d.indications} />);
    rows.push(<UziRenderer key="uzi" uzi={d.uzi} title="УЗИ органов мочевыделительной системы" />);
  }


  // Fallback for generic protocols — render any string fields under d.fields
  if (rows.length === 0 && d.fields && typeof d.fields === "object") {
    Object.entries(d.fields as Record<string, any>).forEach(([k, v]) => {
      if (typeof v === "string" || typeof v === "number") {
        rows.push(<Field key={k} label={k} value={v as any} />);
      }
    });
  }

  // Diagnosis & recommendations
  if (visit.diagnosis || visit.icd_code) {
    rows.push(
      <Section key="dx" title="Диагноз">
        <Field label="Диагноз" value={visit.diagnosis} />
        <Field label="Код МКБ-10" value={visit.icd_code} />
      </Section>
    );
  }
  if (d.recommendations) {
    rows.push(
      <Section key="rec" title="Рекомендации">
        <Field label="Рекомендации" value={d.recommendations} />
      </Section>
    );
  }
  if (visit.next_visit_date) {
    rows.push(
      <Field
        key="nv"
        label="Контрольный осмотр"
        value={format(new Date(visit.next_visit_date), "dd MMMM yyyy", { locale: ru }) + " г."}
      />
    );
  }

  return (
    <table className="ppl-table">
      <tbody>{rows}</tbody>
    </table>
  );
}

const CONSENT_TEXT = `Я, нижеподписавшийся, в соответствии со статьями 20, 22 Федерального закона от 21.11.2011 № 323-ФЗ «Об основах охраны здоровья граждан в Российской Федерации», добровольно даю информированное согласие на медицинское вмешательство (осмотр, обследование, диагностические и лечебные процедуры) в объёме, необходимом для оказания мне (моему ребёнку) медицинской помощи в ООО «Профессиональный медицинский центр». Я ознакомлен(а) с целями, методами оказания медицинской помощи, возможным риском, вариантами медицинского вмешательства, его последствиями и предполагаемыми результатами. Мне разъяснены права, предусмотренные действующим законодательством. Согласие на обработку персональных и медицинских данных в рамках Федерального закона № 152-ФЗ «О персональных данных» дано добровольно.`;

export function ProtocolPrintLayout({ visit }: { visit: VisitForPrint }) {
  const def = PROTOCOL_TYPE_MAP[visit.protocol_type];
  const visitDate = new Date(visit.visit_date);
  const age = visit.patient?.birth_date ? calcAge(visit.patient.birth_date, visitDate) : null;

  return (
    <>
      <style>{`
        .print-page {
          width: 210mm;
          min-height: 297mm;
          padding: 10mm 15mm 15mm 20mm;
          font-family: Arial, sans-serif;
          font-size: 9.5pt;
          color: #000;
          background: #fff;
          box-sizing: border-box;
          margin: 0 auto;
        }
        .ppl-header { display: flex; align-items: center; gap: 6mm; }
        .ppl-header img.logo { width: 26mm; height: 26mm; object-fit: contain; flex-shrink: 0; }
        .ppl-header .info { flex: 1; }
        .ppl-brand { color: #6db33f; font-weight: 700; font-size: 18pt; line-height: 1.1; }
        .ppl-org { font-weight: 700; font-size: 10pt; margin-top: 1.5mm; }
        .ppl-addr-row { display: flex; justify-content: space-between; font-size: 9pt; margin-top: 1mm; gap: 4mm; }
        .ppl-hr-thin { border: none; border-top: 0.4pt solid #888; margin: 3mm 0; }
        .ppl-hr-thick { border: none; border-top: 1pt solid #000; margin: 3mm 0; }
        .ppl-doctor { text-align: center; line-height: 1.35; }
        .ppl-doctor .small { font-weight: 700; font-size: 9pt; }
        .ppl-doctor .name { font-weight: 700; font-size: 16pt; margin-top: 1mm; letter-spacing: 0.5px; }
        .ppl-doctor .url { font-size: 9pt; margin-top: 0.5mm; color: #444; }
        .ppl-swash { display: block; width: 120mm; height: auto; margin: 2mm auto; }
        .ppl-patient { font-size: 10pt; line-height: 1.7; }
        .ppl-patient-row { display: flex; justify-content: space-between; gap: 6mm; }
        .ppl-title { text-align: center; margin: 5mm 0 3mm; }
        .ppl-title .sub { font-size: 9pt; color: #555; }
        .ppl-title .main { font-weight: 700; font-size: 14pt; text-transform: uppercase; margin-top: 1mm; }
        .ppl-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
        .ppl-table .ppl-label {
          width: 52mm; vertical-align: top; padding: 1.5mm 3mm 1.5mm 0;
          font-weight: 700; border-bottom: 0.3pt solid #ccc;
        }
        .ppl-table .ppl-value {
          vertical-align: top; padding: 1.5mm 0; white-space: pre-wrap;
          border-bottom: 0.3pt solid #ccc;
        }
        .ppl-section {
          padding: 3mm 0 1mm; font-weight: 700; font-size: 10pt;
          border-bottom: 0.5pt solid #000;
        }
        .ppl-subsection {
          padding: 2mm 0 1mm; font-weight: 700; font-size: 9.5pt;
          background: #f0f0f0; color: #000;
        }
        .ppl-side { width: 100%; border-collapse: collapse; }
        .ppl-side-cell { width: 50%; vertical-align: top; padding-right: 4mm; }
        .ppl-footer { margin-top: 10mm; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10pt; gap: 6mm; }
        .ppl-sign-line { border-bottom: 0.5pt solid #000; min-width: 55mm; height: 6mm; }
        .ppl-sign-caption { font-size: 8pt; color: #555; text-align: center; }
        .ppl-consent {
          margin-top: 8mm; padding-top: 4mm; border-top: 0.5pt solid #000;
          font-size: 8.5pt; line-height: 1.4;
        }
        .ppl-consent h4 { text-align: center; font-size: 9.5pt; margin: 0 0 2mm; text-transform: uppercase; }
        .ppl-consent .sig-row {
          display: flex; justify-content: space-between; margin-top: 5mm;
          gap: 6mm; font-size: 9pt;
        }
        .ppl-page-break { page-break-after: always; }

        /* Avoid breaking inside critical blocks (applies on screen + print) */
        .ppl-table tr,
        .ppl-footer,
        .ppl-consent { break-inside: avoid; page-break-inside: avoid; }

        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: #fff !important; }
          /* @page margins ensure every page (including 2+) has top/bottom/side spacing */
          @page { size: A4; margin: 12mm 15mm 15mm 20mm; }
          .print-page { padding: 0; box-shadow: none; min-height: auto; width: auto; margin: 0; }
          .ppl-section, .ppl-subsection { page-break-after: avoid; break-after: avoid; }
          .ppl-table tr { page-break-inside: avoid; break-inside: avoid; }
          .ppl-footer, .ppl-consent { page-break-inside: avoid; break-inside: avoid; break-before: avoid; }
          p, td, li { orphans: 3; widows: 3; }
        }
      `}</style>


      <div className="print-page">
        {/* HEADER */}
        <div className="ppl-header">
          <img src="/mca-logo.png" alt="МЦА" className="logo" />
          <div className="info">
            <div className="ppl-brand">Международный центр андрологии</div>
            <div className="ppl-org">ООО «Профессиональный медицинский центр»</div>
            <div className="ppl-addr-row">
              <span>127486 г. Москва, Коровинское шоссе д. 9, корп. 2</span>
              <span>+7 (495) 303-00-00 / +7 (926) 303-01-11</span>
            </div>
          </div>
        </div>

        <hr className="ppl-hr-thin" />

        {/* DOCTOR */}
        <div className="ppl-doctor">
          <div className="small">Член-корреспондент РАЕН</div>
          <div className="small">профессор, доктор медицинских наук, врач высшей категории</div>
          <div className="name">ТАРУСИН ДМИТРИЙ ИГОРЕВИЧ</div>
          <div className="url">tarusin.pro</div>
        </div>

        <img src="/mca-swash.png" alt="" className="ppl-swash" />

        <hr className="ppl-hr-thick" />

        {/* PATIENT */}
        <div className="ppl-patient">
          <div className="ppl-patient-row">
            <span><strong>№ медицинской карты:</strong> {visit.patient?.history_number || "—"}</span>
            <span><strong>Дата:</strong> {format(visitDate, "dd MMMM yyyy", { locale: ru })} г.</span>
          </div>
          <div><strong>ФИО:</strong> {visit.patient?.full_name || "—"}</div>
          <div className="ppl-patient-row">
            <span>
              <strong>Дата рождения:</strong>{" "}
              {visit.patient?.birth_date ? format(new Date(visit.patient.birth_date), "dd.MM.yyyy") : "—"}
            </span>
            <span><strong>Возраст:</strong> {age !== null ? `${age} лет` : "—"}</span>
          </div>
        </div>

        {/* TITLE */}
        <div className="ppl-title">
          <div className="sub">Протокол медицинского осмотра — {def?.short || visit.protocol_type}</div>
          <div className="main">{def?.title || visit.protocol_type}</div>
        </div>

        {/* BODY */}
        <ProtocolBody visit={visit} />

        {/* FOOTER */}
        <div className="ppl-footer">
          <div>
            <div>Врач — профессор, д.м.н.</div>
            <div><strong>Тарусин Дмитрий Игоревич</strong></div>
          </div>
          <div>
            <div className="ppl-sign-line" />
            <div className="ppl-sign-caption">подпись</div>
          </div>
        </div>

        {/* CONSENT */}
        <div className="ppl-consent">
          <h4>Информированное добровольное согласие на медицинское вмешательство</h4>
          <div style={{ textAlign: "justify" }}>{CONSENT_TEXT}</div>
          <div className="sig-row">
            <span>
              Пациент / законный представитель: ____________________ / {visit.patient?.full_name || "________________"}
            </span>
            <span>Дата: ____________</span>
          </div>
        </div>
      </div>
    </>
  );
}
