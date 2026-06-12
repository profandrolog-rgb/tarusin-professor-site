import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { PROTOCOL_TYPE_MAP, ProtocolType } from "@/lib/visits/protocolTypes";
import { formatSexualConstitution } from "./sections/SexualConstitution";

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
  right_epididymis_volume: "Правый придаток, V см³", left_epididymis_volume: "Левый придаток, V см³",
  right_kidney_size: "Правая почка (размеры)", left_kidney_size: "Левая почка (размеры)",
  right_kidney_parenchyma: "Правая почка (паренхима)", left_kidney_parenchyma: "Левая почка (паренхима)",
  right_kidney_pelvis: "Правая почка (лоханка)", left_kidney_pelvis: "Левая почка (лоханка)",
  right_kidney_structure: "Правая почка (структура)", left_kidney_structure: "Левая почка (структура)",
  testes: "Яички", epididymis: "Придатки", kidneys: "Почки",
  bladder: "Мочевой пузырь", prostate: "Предстательная железа", scrotum: "Мошонка",
  size: "Размеры", volume: "Объём, мл", structure: "Структура",
  parenchyma: "Паренхима", pelvis: "Лоханка",
  penis_exam: "Исследование полового члена",
  right_cavernous_diameter: "Ø правого кавернозного тела, мм",
  left_cavernous_diameter: "Ø левого кавернозного тела, мм",
  spongious_diameter: "Ø спонгиозного тела, мм",
  tunica: "Белочная оболочка и фасции",
  dorsal_bundle: "Дорзальный пучок",
  dorsal_artery_vmax: "Дорзальная артерия, Vmax (см/с)",
  cavernous_arteries: "Кавернозные артерии",
  right_cavernous_artery: "Правая кавернозная артерия",
  left_cavernous_artery: "Левая кавернозная артерия",
  urethra: "Уретра",
  position: "Положение", syntopy: "Синтопия с органами таза",
  pelvic_effusion: "Выпот в углублениях таза",
  prostate_volume: "Объём предстательной железы, см³",
  middle_lobe_volume: "Средняя доля, объём, см³",
  infravesical_obstruction: "Косвенные признаки инфравезикальной обструкции",
  urethra_internal_opening: "Внутреннее отверстие уретры",
  elastography_right: "Эластография (правая доля)",
  elastography_left: "Эластография (левая доля)",
  micturition_urge: "Позыв на микцию, баллов",
  residual_urine_volume: "Остаточная моча, мл",
  residual_urine_percent: "Остаточная моча, %",
  paraprostatic_veins: "Парапростатические вены",
  diameter: "Диаметр, мм", reflux: "Рефлюкс",
  // Аорто-мезентериальный конфликт
  aorto_mesenteric: "Зона аорто-мезентериального конфликта",
  aorta_structure: "Структура и ход аорты",
  sma_origin: "Отхождение верхней брыжеечной артерии",
  left_renal_vein_position: "Положение левой почечной вены",
  retroaortic_component: "Ретроаортальный компонент левой почечной вены",
  diameter_premesenteric: "Премезентериальный диаметр ЛПВ, мм",
  diameter_intramesenteric: "Интрамезентериальный диаметр ЛПВ, мм",
  diameter_postmesenteric: "Постмезентериальный диаметр ЛПВ, мм",
  ratio_pre_intra: "Соотношение премезентериальный : интрамезентериальный",
  stenosis_flow_velocity: "Скорость потока в зоне сужения, см/с",
  // Илиакальный конфликт (Мей–Тернера)
  iliac_may_thurner: "Зона илиакального конфликта (Мей–Тернера)",
  may_thurner_anatomy: "Анатомия зоны Мей–Тернера",
  left_common_iliac_diameter: "Диаметр левой общей подвздошной вены, мм",
  flow_videographically: "Видеографически",
  compression_flow_velocity: "Скорость потока в зоне компрессии, см/с",
};
const humanize = (k: string) => UZI_LABELS[k] || k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const isPlainObject = (v: any): v is Record<string, any> => v !== null && typeof v === "object" && !Array.isArray(v);
const hasRightLeft = (v: any) => isPlainObject(v) && ("right" in v || "left" in v);
const renderScalar = (v: any): string => {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "boolean") return v ? "Да" : "Нет";
  return String(v);
};

const ARTERIAL_LABELS: Record<string, string> = {
  vmax: "Vmax (см/с)", vmin: "Vmin (см/с)", vmed: "Vmed/T (см/с)",
  ri: "RI", pi: "PI", acc: "Acc (см/с²)",
};
const VENOUS_LABELS: Record<string, string> = {
  v_dir: "V dir (см/с)", v_red: "V red (см/с)", v_rev: "V rev / Вальсальва (см/с)",
  t_ref: "T ref (сек)", acc_ref: "Acc ref (см/с²)", diameter: "Диаметр вен (мм)",
};

function pushSideFlow(
  rows: React.ReactNode[],
  data: any,
  keyPrefix: string,
  title: string,
  labels: Record<string, string>,
) {
  if (!isPlainObject(data)) return;
  const r = data.right || {};
  const l = data.left || {};
  const params = Object.keys(labels).filter((k) => r[k] || l[k]);
  if (params.length === 0) return;
  rows.push(
    <tr key={`${keyPrefix}-h`}>
      <td colSpan={2} className="ppl-subsection">{title}</td>
    </tr>
  );
  params.forEach((k) => {
    rows.push(
      <SideField key={`${keyPrefix}-${k}`} label={labels[k]} right={r[k]} left={l[k]} />
    );
  });
}

function pushArterialFlow(rows: React.ReactNode[], af: any, keyPrefix: string) {
  pushSideFlow(rows, af, keyPrefix, "Артериальный кровоток", ARTERIAL_LABELS);
}

// Поддерживает и новую (right/left), и старую (плоскую) схему венозного кровотока
function pushVenousFlow(rows: React.ReactNode[], vf: any, keyPrefix: string) {
  if (!isPlainObject(vf)) return;
  if (hasRightLeft(vf)) {
    pushSideFlow(rows, vf, keyPrefix, "Венозный кровоток", VENOUS_LABELS);
    return;
  }
  // legacy plain shape
  const params = Object.keys(VENOUS_LABELS).filter((k) => k !== "diameter" && vf[k]);
  const hasDiam = vf.diameter_right || vf.diameter_left;
  if (params.length === 0 && !hasDiam) return;
  rows.push(
    <tr key={`${keyPrefix}-h`}>
      <td colSpan={2} className="ppl-subsection">Венозный кровоток</td>
    </tr>
  );
  params.forEach((k) => {
    rows.push(<Field key={`${keyPrefix}-${k}`} label={VENOUS_LABELS[k]} value={vf[k]} />);
  });
  if (hasDiam) {
    rows.push(
      <SideField key={`${keyPrefix}-diam`} label="Диаметр вен (мм)" right={vf.diameter_right} left={vf.diameter_left} />
    );
  }
}

function pushPenisExam(rows: React.ReactNode[], pe: any, keyPrefix: string) {
  if (!isPlainObject(pe)) return;
  const order: (keyof import("./sections/UziReproductive").PenisExamData)[] = [
    "structure",
    "right_cavernous_diameter",
    "left_cavernous_diameter",
    "spongious_diameter",
    "tunica",
    "dorsal_bundle",
    "dorsal_artery_vmax",
    "cavernous_arteries",
    "right_cavernous_artery",
    "left_cavernous_artery",
    "urethra",
    "conclusion",
  ];
  const visible = order.filter((k) => pe[k] !== undefined && pe[k] !== null && pe[k] !== "");
  if (visible.length === 0) return;
  rows.push(
    <tr key={`${keyPrefix}-h`}>
      <td colSpan={2} className="ppl-subsection">Исследование полового члена</td>
    </tr>
  );
  visible.forEach((k) => {
    rows.push(<Field key={`${keyPrefix}-${k}`} label={humanize(k as string)} value={renderScalar(pe[k])} />);
  });
}

// Желаемый порядок секций при выводе УЗИ репродуктивной системы
const UZI_FIELD_ORDER = [
  "device",
  "indications",
  "right_testis_size", "right_testis_volume", "right_testis_structure",
  "left_testis_size", "left_testis_volume", "left_testis_structure",
  "right_epididymis", "left_epididymis",
  "arterial_flow",
  "venous_flow",
  "prostate",
  "perineum",
  "penis_exam",
  "vessels",
  "doppler",
  "free_fluid",
  "conclusion",
];

function orderedEntries(obj: Record<string, any>): [string, any][] {
  const keys = Object.keys(obj);
  const idx = (k: string) => {
    const i = UZI_FIELD_ORDER.indexOf(k);
    return i === -1 ? UZI_FIELD_ORDER.length : i;
  };
  return keys
    .slice()
    .sort((a, b) => idx(a) - idx(b))
    .map((k) => [k, obj[k]] as [string, any]);
}

function UziRenderer({ uzi, title }: { uzi: Record<string, any>; title: string }) {
  const rows: React.ReactNode[] = [];
  const walk = (obj: Record<string, any>, prefix = "", ordered = false) => {
    const entries = ordered ? orderedEntries(obj) : Object.entries(obj);
    entries.forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") return;
      const rk = `${prefix}${k}`;
      if (k === "arterial_flow") {
        pushArterialFlow(rows, v, rk);
        return;
      }
      if (k === "venous_flow") {
        pushVenousFlow(rows, v, rk);
        return;
      }
      if (k === "penis_exam") {
        pushPenisExam(rows, v, rk);
        return;
      }
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
  walk(uzi, "", true);
  if (rows.length === 0) return null;
  return <Section title={title}>{rows}</Section>;
}


function pushPsychBlocks(rows: React.ReactNode[], d: any) {
  if (d.psych_status_full) rows.push(<Field key="psyf" label="Психиатрический статус" value={d.psych_status_full} />);
  const projs: [string, string][] = [
    ["proj_person", "Рисунок человека"],
    ["proj_htp", "Дом–Дерево–Человек"],
    ["proj_family", "Рисунок семьи"],
    ["proj_animal", "Несуществующее животное"],
    ["proj_free", "Свободный рисунок"],
  ];
  const projRows = projs.filter(([k]) => d[k]).map(([k, label]) => (
    <Field key={`pr-${k}`} label={label} value={d[k]} />
  ));
  if (projRows.length > 0) {
    rows.push(<Section key="proj" title="Проективное тестирование">{projRows}</Section>);
  }
  if (d.psych_conclusion) rows.push(<Field key="psyc" label="Итоговые характеристики" value={d.psych_conclusion} />);
}

function pushSomatic(rows: React.ReactNode[], d: any) {
  if (!d.somatic) return;
  const anth = [
    d.somatic.height_cm ? `рост ${d.somatic.height_cm} см` : null,
    d.somatic.weight_kg ? `вес ${d.somatic.weight_kg} кг` : null,
    d.somatic.bp ? `АД ${d.somatic.bp}` : null,
    d.somatic.pulse ? `пульс ${d.somatic.pulse}` : null,
  ].filter(Boolean).join(", ");
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

function pushSexual(rows: React.ReactNode[], d: any) {
  if (d.sexual_formula) {
    const f = d.sexual_formula;
    rows.push(
      <Field key="sf" label="Половая формула"
        value={`P${f.P ?? 0} Ax${f.Ax ?? 0} F${f.F ?? 0} L${f.L ?? 0} G${f.G ?? 0}${f.formula_note ? ` — ${f.formula_note}` : ""}`}
      />
    );
  }
  if (d.sexual_formula_text) rows.push(<Field key="sft" label="Половая формула (текст)" value={d.sexual_formula_text} />);
  const sc = formatSexualConstitution(d.sexual_constitution);
  if (sc) rows.push(<Field key="sc" label="Половая конституция" value={sc} />);
}

function pushLocalStatus(rows: React.ReactNode[], d: any) {
  if (!d.local_status) return;
  const ls = d.local_status;
  rows.push(
    <Section key="ls" title="Локальный статус">
      <Field label="Наружные половые органы" value={ls.external_genitalia} />
      {(ls.scrotum_right || ls.scrotum_left) ? (
        <SideField label="Органы мошонки" right={ls.scrotum_right} left={ls.scrotum_left} />
      ) : null}
      {(ls.right || ls.left) ? (
        <SideField label="Локальный статус" right={ls.right} left={ls.left} />
      ) : null}
      <Field label="Половой член" value={ls.penis} />
      <Field label="Промежность" value={ls.perineum} />
      {ls.scrotum ? <Field label="Мошонка" value={ls.scrotum} /> : null}
      {(ls.right_testis || ls.left_testis) ? (
        <SideField label="Яичко"
          right={[ls.right_testis, ls.right_testis_volume ? `объём ${ls.right_testis_volume} мл` : null].filter(Boolean).join(", ")}
          left={[ls.left_testis, ls.left_testis_volume ? `объём ${ls.left_testis_volume} мл` : null].filter(Boolean).join(", ")}
        />
      ) : null}
      <Field label="Придатки" value={ls.epididymis} />
      <Field label="Семенные канатики" value={ls.spermatic_cord} />
      <Field label="Паховые кольца" value={ls.inguinal_rings} />
      <Field label="Дополнительно" value={ls.notes} />
    </Section>
  );
}

function pushClinical(rows: React.ReactNode[], d: any) {
  if (d.ortho_status) rows.push(<Field key="ortho" label="Ортопедический статус" value={d.ortho_status} />);
  if (d.neuro_status) rows.push(<Field key="neuro" label="Неврологический статус" value={d.neuro_status} />);
  if (d.neuro_status_full) rows.push(<Field key="neurof" label="Неврологический статус (расш.)" value={d.neuro_status_full} />);
  if (d.psych_status) rows.push(<Field key="psych" label="Психологический статус" value={d.psych_status} />);
  pushPsychBlocks(rows, d);
}

const KNOWN_KEYS = new Set([
  "complaints","anamnesis","conclusion","indications","exam_plan","recommendations",
  "somatic","sexual_formula","sexual_formula_text","sexual_constitution","local_status",
  "ortho_status","neuro_status","neuro_status_full","psych_status","psych_status_full","psych_conclusion",
  "proj_person","proj_htp","proj_family","proj_animal","proj_free",
  "uzi","assignments","fields",
  "cbc","urinalysis","biochem","hormones","other_labs",
  "operation_name","operation_date","temperature","general_status","wound_status","dressing","pain","healing","sutures_removed",
  "_normalized_version","_normalized_at",
]);

function pushUnknownScalars(rows: React.ReactNode[], d: any) {
  if (!isPlainObject(d)) return;
  Object.entries(d).forEach(([k, v]) => {
    if (KNOWN_KEYS.has(k)) return;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      if (v === "" || v === null || v === undefined) return;
      rows.push(<Field key={`x-${k}`} label={humanize(k)} value={renderScalar(v)} />);
    }
  });
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
    rows.push(<Field key="opd" label="Дата операции"
      value={d.operation_date ? format(new Date(d.operation_date), "dd.MM.yyyy") : null} />);
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
    pushSomatic(rows, d);
    pushSexual(rows, d);
    pushLocalStatus(rows, d);
    pushClinical(rows, d);
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
    pushLocalStatus(rows, d);
    rows.push(<Field key="z" label="Заключение" value={d.conclusion} />);
  }

  if (t === "uzi_reproductive" || t === "dynamic_with_uzi" || t === "repeat_with_uzi") {
    if (t !== "uzi_reproductive") {
      rows.push(<Field key="c" label="Жалобы" value={d.complaints} />);
      rows.push(<Field key="a" label="Анамнез" value={d.anamnesis} />);
    }
    rows.push(<Field key="i" label="Показания" value={d.indications} />);
    if (d.uzi && isPlainObject(d.uzi)) {
      rows.push(<UziRenderer key="uzi" uzi={d.uzi}
        title={t === "uzi_reproductive" ? "УЗИ органов репродуктивной системы" : "УЗИ органов мошонки"} />);
    }
    if (t !== "uzi_reproductive") {
      pushSomatic(rows, d);
      pushSexual(rows, d);
      pushLocalStatus(rows, d);
      pushClinical(rows, d);
    }
    rows.push(<Field key="z" label="Заключение" value={d.conclusion} />);
  }

  if (t === "uzi_urinary") {
    rows.push(<Field key="i" label="Показания" value={d.indications} />);
    if (d.uzi && isPlainObject(d.uzi)) {
      rows.push(<UziRenderer key="uzi" uzi={d.uzi} title="УЗИ органов мочевыделительной системы" />);
    }
    rows.push(<Field key="z" label="Заключение" value={d.conclusion} />);
  }

  // Fallback for generic protocols — render any string fields under d.fields
  if (rows.length === 0 && d.fields && typeof d.fields === "object") {
    Object.entries(d.fields as Record<string, any>).forEach(([k, v]) => {
      if (typeof v === "string" || typeof v === "number") {
        rows.push(<Field key={k} label={k} value={v as any} />);
      }
    });
  }

  // Catch-all: render any extra scalar fields in protocol_data not yet output
  pushUnknownScalars(rows, d);


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

  // Assignments (universal — across any protocol type)
  const a = d.assignments;
  if (a && typeof a === "object") {
    const renderList = (key: string, title: string, items: any) => {
      if (!Array.isArray(items) || items.length === 0) return null;
      return (
        <Section key={key} title={title}>
          <tr>
            <td colSpan={2} className="ppl-value" style={{ paddingTop: "1mm" }}>
              <ol style={{ margin: 0, paddingLeft: "6mm" }}>
                {items.map((t: string, i: number) => (
                  <li key={i} style={{ marginBottom: "1mm" }}>{t}</li>
                ))}
              </ol>
            </td>
          </tr>
        </Section>
      );
    };
    rows.push(renderList("a-exam", "Обследование", a.examinations));
    rows.push(renderList("a-treat", "Лечение и режим", a.treatments));
    rows.push(renderList("a-ref", "Консультации", a.referrals));
    rows.push(renderList("a-diet", "Диетические рекомендации", a.diet));
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

const CONSENT_INTRO = `даю своё добровольное информированное согласие на проведение медицинского осмотра, сбора анамнеза, необходимых диагностических и лечебных манипуляций в ООО «Профессиональный медицинский центр». Мне разъяснены цели, методы, возможные риски и альтернативные методы. Согласие даю добровольно, без принуждения.`;

const Blank = ({ w = "60mm" }: { w?: string }) => (
  <span style={{ display: "inline-block", borderBottom: "0.5pt solid #000", minWidth: w, height: "4mm", verticalAlign: "bottom" }} />
);

function ConsentBlock({ patient }: { patient: VisitForPrint["patient"] }) {
  const fio = patient?.full_name || "";
  const dob = patient?.birth_date ? format(new Date(patient.birth_date), "dd.MM.yyyy") : "";
  const age = patient?.birth_date ? calcAge(patient.birth_date, new Date()) : null;

  const SigRow = ({ who }: { who: string }) => (
    <div className="sig-row">
      <span>{who}: <Blank w="55mm" /> <span style={{ fontSize: "8pt", color: "#555" }}>(подпись)</span></span>
      <span>Дата: <Blank w="35mm" /></span>
    </div>
  );

  const Under15 = (
    <>
      <p style={{ margin: "0 0 2mm" }}>
        Я, законный представитель пациента <Blank w="80mm" />
        <span style={{ display: "block", fontSize: "8pt", color: "#555", marginLeft: "55mm" }}>(ФИО законного представителя)</span>
      </p>
      <p style={{ margin: "0 0 2mm" }}>
        являющийся(аяся) <Blank w="70mm" />
        <span style={{ display: "block", fontSize: "8pt", color: "#555", marginLeft: "30mm" }}>(мать / отец / опекун / попечитель)</span>
      </p>
      <p style={{ margin: "0 0 2mm" }}>
        пациента <strong>{fio || <Blank w="80mm" />}</strong>, дата рождения: <strong>{dob || <Blank w="30mm" />}</strong>,
      </p>
      <p style={{ margin: "0 0 3mm", textAlign: "justify" }}>{CONSENT_INTRO}</p>
      <SigRow who="Законный представитель" />
    </>
  );

  const Between15and18 = (
    <>
      <p style={{ margin: "0 0 2mm" }}>
        Я, пациент <strong>{fio || <Blank w="80mm" />}</strong>, дата рождения: <strong>{dob || <Blank w="30mm" />}</strong>,
      </p>
      <p style={{ margin: "0 0 3mm", textAlign: "justify" }}>{CONSENT_INTRO}</p>
      <SigRow who="Пациент" />
      <p style={{ margin: "4mm 0 2mm" }}>
        Я, законный представитель пациента <Blank w="75mm" />
        <span style={{ display: "block", fontSize: "8pt", color: "#555", marginLeft: "55mm" }}>(ФИО законного представителя)</span>
      </p>
      <p style={{ margin: "0 0 3mm" }}>своё согласие подтверждаю.</p>
      <SigRow who="Законный представитель" />
    </>
  );

  const Adult = (
    <>
      <p style={{ margin: "0 0 2mm" }}>
        Я, <strong>{fio || <Blank w="80mm" />}</strong>, дата рождения: <strong>{dob || <Blank w="30mm" />}</strong>,
      </p>
      <p style={{ margin: "0 0 3mm", textAlign: "justify" }}>{CONSENT_INTRO}</p>
      <SigRow who="Пациент" />
    </>
  );

  let body: React.ReactNode = Adult;
  if (age !== null) {
    if (age < 15) body = Under15;
    else if (age < 18) body = Between15and18;
  }

  return (
    <div className="ppl-consent">
      <h4>Информированное добровольное согласие на медицинское вмешательство</h4>
      {body}
    </div>
  );
}

const CONSENT_TEXT = "";

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
          padding: 10mm 18mm 15mm 22mm;
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
       .ppl-title { text-align: center; margin: 8mm 0 6mm; }
       .ppl-title .sub { font-size: 9pt; color: #555; }
       .ppl-title .main { font-weight: 700; font-size: 18pt; line-height: 1.25; margin-top: 2mm; letter-spacing: 0.2pt; }
        .ppl-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
        .ppl-table .ppl-label {
          width: 48mm; vertical-align: top; padding: 3mm 4mm 3mm 0;
          font-weight: 700; border-bottom: 0.3pt solid #ccc; line-height: 1.5;
        }
        .ppl-table .ppl-value {
          vertical-align: top; padding: 3mm 4mm; white-space: pre-wrap;
          word-break: break-word; border-bottom: 0.3pt solid #ccc; line-height: 1.5;
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
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          @page {
            size: A4;
            margin: 15mm 15mm 18mm 15mm;
            @bottom-right {
              content: "Страница " counter(page) " из " counter(pages);
              font-family: Arial, sans-serif;
              font-size: 8pt;
              color: #555;
            }
          }
          .print-page {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
          .ppl-section, .ppl-subsection { page-break-after: avoid; break-after: avoid; }
          .ppl-table { width: 100% !important; table-layout: fixed; }
          .ppl-table tr { page-break-inside: avoid; break-inside: avoid; }
          .ppl-footer, .ppl-consent { page-break-inside: avoid; break-inside: avoid; break-before: avoid; }
          p, td, li { orphans: 3; widows: 3; word-wrap: break-word; overflow-wrap: break-word; }
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
          <div className="sub">Протокол медицинского осмотра</div>
          <div className="main">{(() => {
            const base = def?.title || visit.protocol_type;
            if (visit.protocol_type === "postop_day7") {
              const n = (visit.protocol_data as any)?.day_number;
              if (typeof n === "number" && n > 0 && n !== 7) {
                return `Контрольный осмотр на ${n} сутки после операции`;
              }
            }
            return base;
          })()}</div>
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
        <ConsentBlock patient={visit.patient} />
      </div>
    </>
  );
}
