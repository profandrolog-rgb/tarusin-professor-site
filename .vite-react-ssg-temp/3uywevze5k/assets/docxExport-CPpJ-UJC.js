import { BorderStyle, Paragraph, AlignmentType, TextRun, Document, LevelFormat, PageOrientation, Packer, TableRow, Table, WidthType, TableCell, ShadingType } from "docx";
import { f as fileSaver } from "./FileSaver.min-DtJWvt7f.js";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { a as SECTIONS } from "./sections-BdvyTZRY.js";
import { c as calculatePlanCost, f as formatRub } from "./cost-B-oW-Erb.js";
import { a as formatIrtPointLine } from "./acupunctureExpand-DBa3GykD.js";
const { saveAs } = fileSaver;
const ROUTE_LABELS = {
  iv_drip: "в/в капельно",
  iv_bolus: "в/в струйно",
  im: "в/м",
  sc: "п/к",
  oral_rx: "внутрь",
  oral_supplement: "внутрь",
  rectal: "ректально",
  topical: "накожно",
  nasal: "интраназально",
  sublingual: "под язык",
  peptide: "по схеме",
  procedure: "",
  lifestyle: "",
  homeopathy: "под язык",
  physiotherapy: "процедура"
};
function lineFor(it, courseDays) {
  var _a;
  let head = it.name_snapshot;
  if (it.dose != null) head += ` ${it.dose}${it.dose_unit ? " " + it.dose_unit : ""}`;
  if (it.dilution_volume && it.dilution_solvent) head += ` в ${it.dilution_volume} мл ${it.dilution_solvent}`;
  else if (it.dilution_volume) head += ` в ${it.dilution_volume} мл`;
  const tail = [];
  const route = it.route_override || ROUTE_LABELS[it.section_category];
  if (route) tail.push(route);
  if (it.infusion_rate) tail.push(it.infusion_rate);
  if ((_a = it.time_of_day) == null ? void 0 : _a.length) tail.push(it.time_of_day.join("/"));
  if (it.frequency) tail.push(it.frequency);
  const days = it.duration_days ?? courseDays;
  if (days) tail.push(`дни 1–${days}`);
  let line = tail.length ? `${head} — ${tail.join(", ")}` : head;
  if (it.notes) line += `. ${it.notes}`;
  if (!line.endsWith(".")) line += ".";
  if (it.is_off_label) line += " (off-label)";
  return line;
}
const FONT = "Times New Roman";
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const ALL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const CELL_MARGINS = { top: 60, bottom: 60, left: 100, right: 100 };
const p = (text, opts = {}) => new Paragraph({
  alignment: opts.align,
  spacing: opts.spacing,
  children: [new TextRun({ text, bold: opts.bold, italics: opts.italics, font: FONT, size: opts.size ?? 22 })]
});
const sectionHeading = (text) => new Paragraph({
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: 24 })]
});
function letterhead() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Министерство здравоохранения Российской Федерации", font: FONT, size: 18 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60 },
      children: [new TextRun({ text: "Профессор, д.м.н. Тарусин Дмитрий Игоревич", bold: true, font: FONT, size: 26 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000", space: 4 } },
      children: [new TextRun({ text: "Детский уролог-андролог высшей категории · Московский андрологический центр", font: FONT, size: 18 })]
    })
  ];
}
function signatureBlock(date) {
  return [
    new Paragraph({
      spacing: { before: 600 },
      children: [
        new TextRun({ text: "Врач: ____________________________", font: FONT, size: 22 }),
        new TextRun({ text: `				Дата: ${format(date, "dd.MM.yyyy")}`, font: FONT, size: 22 })
      ]
    }),
    new Paragraph({
      spacing: { before: 60 },
      children: [new TextRun({ text: "проф., д.м.н. Тарусин Д.И.				М.П.", font: FONT, size: 22 })]
    })
  ];
}
function labControlTable(rows) {
  const header = new TableRow({
    tableHeader: true,
    children: [
      cell("Точка контроля", { bold: true, shading: "E8E8E8", width: 2400 }),
      cell("День", { bold: true, shading: "E8E8E8", width: 1e3 }),
      cell("Анализы / исследования", { bold: true, shading: "E8E8E8", width: 5960 })
    ]
  });
  const body = rows.map((r) => new TableRow({
    children: [
      cell(r.control_point || "—", { width: 2400 }),
      cell(r.at_day != null ? String(r.at_day) : "—", { width: 1e3 }),
      cell([r.tests.join(", ") || "—", r.notes ? `
${r.notes}` : ""].join(""), { width: 5960, italicsTail: !!r.notes })
    ]
  }));
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2400, 1e3, 5960],
    rows: [header, ...body]
  });
}
function cell(text, opts = { width: 3e3 }) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    borders: ALL_BORDERS,
    margins: CELL_MARGINS,
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR, color: "auto" } : void 0,
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold, font: FONT, size: 20 })] })]
  });
}
function costTable(breakdown) {
  const groupRows = Object.values(breakdown.byGroup).map((g) => new TableRow({
    children: [
      cell(`${g.emoji} ${g.label}`, { width: 6800 }),
      cell(formatRub(g.sum), { width: 2560 })
    ]
  }));
  const totalRow = new TableRow({
    children: [
      cell("Итого:", { bold: true, width: 6800, shading: "F4F4F4" }),
      cell(formatRub(breakdown.total), { bold: true, width: 2560, shading: "F4F4F4" })
    ]
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [6800, 2560],
    rows: [...groupRows, totalRow]
  });
}
async function generatePlanDocx(data) {
  const { plan, patient, patientAge, items, labControl, catalogMap, acupunctureMap } = data;
  const date = new Date(plan.issued_at);
  const landscape = plan.duration_days > 21;
  const medicalSections = SECTIONS.filter((s) => s.key !== "lifestyle");
  const lifestyleItems = items.filter((i) => i.section_category === "lifestyle");
  const children = [];
  children.push(...letterhead());
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 240 },
    children: [new TextRun({
      text: `ЛИСТ НАЗНАЧЕНИЙ${plan.course_number != null ? ` № ${plan.course_number}` : ""}`,
      bold: true,
      font: FONT,
      size: 30
    })]
  }));
  children.push(p(`Дата выписки: ${format(date, "d MMMM yyyy 'г.'", { locale: ru })}     ID: ${plan.id.slice(0, 8).toUpperCase()}`, { size: 20 }));
  children.push(p(`Ф.И.О. пациента: ${(patient == null ? void 0 : patient.full_name) || "—"}${patientAge !== null ? `     Возраст: ${patientAge} лет` : ""}`, { size: 20 }));
  if (plan.diagnosis_short) children.push(p(`Диагноз: ${plan.diagnosis_short}`, { size: 20 }));
  children.push(p(`Длительность курса: ${plan.duration_days} дней`, { size: 20 }));
  if (plan.clinical_summary) {
    children.push(new Paragraph({
      spacing: { before: 160, after: 160 },
      indent: { left: 200 },
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: "888888", space: 8 } },
      children: [new TextRun({ text: plan.clinical_summary, italics: true, font: FONT, size: 20 })]
    }));
  }
  medicalSections.forEach((section) => {
    const list = items.filter((i) => i.section_category === section.key);
    if (!list.length) return;
    children.push(sectionHeading(section.label));
    list.forEach((it) => {
      children.push(new Paragraph({
        numbering: { reference: "ol-default", level: 0 },
        children: [new TextRun({ text: lineFor(it, plan.duration_days), font: FONT, size: 22 })]
      }));
      const irt = it.catalog_id ? acupunctureMap == null ? void 0 : acupunctureMap.get(it.catalog_id) : void 0;
      if (irt && irt.points.length) {
        const meta = [];
        if (irt.session_count != null) meta.push(`${irt.session_count} сеансов`);
        if (irt.session_duration_min != null) meta.push(`${irt.session_duration_min} мин/сеанс`);
        if (irt.frequency) meta.push(irt.frequency);
        if (meta.length) {
          children.push(new Paragraph({
            indent: { left: 720 },
            spacing: { before: 40 },
            children: [new TextRun({ text: `Курс: ${meta.join(" · ")}`, italics: true, font: FONT, size: 20 })]
          }));
        }
        children.push(new Paragraph({
          indent: { left: 720 },
          spacing: { before: 40 },
          children: [new TextRun({ text: `Точки протокола (${irt.points.length}):`, bold: true, font: FONT, size: 20 })]
        }));
        irt.points.forEach((pt, idx) => {
          children.push(new Paragraph({
            indent: { left: 900, hanging: 200 },
            children: [new TextRun({ text: `${idx + 1}. ${formatIrtPointLine(pt)}`, font: FONT, size: 20 })]
          }));
        });
      }
    });
  });
  if (lifestyleItems.length) {
    children.push(sectionHeading("Рекомендации образа жизни"));
    lifestyleItems.forEach((it) => {
      const tail = [it.notes, it.frequency].filter(Boolean).join(". ");
      children.push(new Paragraph({
        numbering: { reference: "ol-default", level: 0 },
        children: [
          new TextRun({ text: it.name_snapshot, bold: true, font: FONT, size: 22 }),
          new TextRun({ text: tail ? ` — ${tail}` : "", font: FONT, size: 22 })
        ]
      }));
    });
  }
  if (plan.lab_control_enabled && (labControl == null ? void 0 : labControl.length)) {
    children.push(sectionHeading("Контроль на фоне терапии"));
    children.push(new Paragraph({ children: [] }));
    children.push(labControlTable(labControl));
  }
  if (plan.show_cost_in_print && catalogMap) {
    const costInput = items.map((it) => ({
      catalog_id: it.catalog_id,
      section_category: it.section_category,
      frequency: it.frequency,
      day_pattern: it.day_pattern,
      duration_days: it.duration_days,
      prn_estimated_doses: it.prn_estimated_doses,
      name_snapshot: it.name_snapshot
    }));
    const breakdown = calculatePlanCost(costInput, catalogMap, plan.duration_days, plan.mode);
    if (breakdown.total > 0) {
      children.push(sectionHeading("Ориентировочная стоимость курса"));
      children.push(new Paragraph({ children: [] }));
      children.push(costTable(breakdown));
      children.push(new Paragraph({
        spacing: { before: 80 },
        children: [new TextRun({
          text: `Расчёт ориентировочный, ±15–20%. Стоимость процедур и услуг клиники не включена.${breakdown.missing.length ? ` Цены не заданы для ${breakdown.missing.length} позиций — они не учтены.` : ""}`,
          italics: true,
          font: FONT,
          size: 18
        })]
      }));
    }
  }
  children.push(...signatureBlock(date));
  const doc = new Document({
    creator: "Тарусин Д.И.",
    title: `Лист назначений ${plan.course_number ?? ""}`,
    numbering: {
      config: [{
        reference: "ol-default",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 300 } } }
        }]
      }]
    },
    sections: [{
      properties: {
        page: {
          size: landscape ? { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE } : { width: 11906, height: 16838 },
          margin: { top: 850, right: 850, bottom: 850, left: 850 }
        }
      },
      children
    }]
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, makeFilename(plan.course_number, patient == null ? void 0 : patient.full_name, date, "Лист_назначений"));
}
async function generateMemoDocx(data, opts = {}) {
  const { plan, patient, items, catalogPatientMap } = data;
  const date = new Date(plan.issued_at);
  const groups = buildMemoGroups(items, catalogPatientMap);
  const children = [];
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "ПАМЯТКА ПАЦИЕНТУ", bold: true, font: FONT, size: 32 })]
  }));
  children.push(p(`для ${(patient == null ? void 0 : patient.full_name) || "—"}    ·    курс ${plan.duration_days} дней    ·    ${format(date, "d MMMM yyyy 'г.'", { locale: ru })}`, {
    align: AlignmentType.CENTER,
    size: 20,
    italics: true
  }));
  children.push(p("Это пояснение к листу назначений простым языком. Если что-то непонятно — звоните или пишите перед началом курса.", {
    align: AlignmentType.CENTER,
    italics: true,
    size: 18,
    spacing: { after: 240 }
  }));
  groups.forEach((g) => {
    children.push(sectionHeading(`${g.emoji} ${g.label}`));
    g.items.forEach((it) => {
      children.push(new Paragraph({
        numbering: { reference: "memo-bullets", level: 0 },
        spacing: { after: 80 },
        children: [
          new TextRun({ text: it.name, bold: true, font: FONT, size: 22 }),
          ...it.description ? [new TextRun({ text: ` — ${it.description}`, font: FONT, size: 22 })] : []
        ]
      }));
    });
  });
  if (opts.showCost && opts.costBreakdownTotal && opts.costBreakdownTotal > 0) {
    children.push(sectionHeading("💰 Ориентировочная стоимость курса"));
    children.push(p(`${formatRub(opts.costBreakdownTotal)} (±15–20%, без стоимости процедур и услуг клиники).`, { size: 22 }));
  }
  children.push(new Paragraph({
    spacing: { before: 300 },
    children: [new TextRun({
      text: "Памятка не заменяет лист назначений и консультацию врача. Все вопросы — на приёме или по телефону.",
      italics: true,
      font: FONT,
      size: 18
    })]
  }));
  const doc = new Document({
    creator: "Тарусин Д.И.",
    title: `Памятка пациенту ${(patient == null ? void 0 : patient.full_name) ?? ""}`,
    numbering: {
      config: [{
        reference: "memo-bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 300 } } }
        }]
      }]
    },
    sections: [{
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1e3, right: 1e3, bottom: 1e3, left: 1e3 } }
      },
      children
    }]
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, makeFilename(plan.course_number, patient == null ? void 0 : patient.full_name, date, "Памятка"));
}
const MEMO_GROUP_DEFS = [
  { key: "iv", emoji: "💧", label: "Внутривенные капельницы", cats: ["iv_drip", "iv_bolus"] },
  { key: "inj", emoji: "💉", label: "Уколы (в/м, п/к, пептиды)", cats: ["im", "sc", "peptide"] },
  { key: "rx", emoji: "💊", label: "Таблетки и капсулы по рецепту", cats: ["oral_rx"] },
  { key: "supp", emoji: "🌿", label: "Витамины и БАДы", cats: ["oral_supplement"] },
  { key: "top", emoji: "🖐", label: "Наружные средства (гели, кремы)", cats: ["topical"] },
  { key: "rect", emoji: "🔻", label: "Ректальные свечи", cats: ["rectal"] },
  { key: "nas", emoji: "👃", label: "Назальные средства", cats: ["nasal"] },
  { key: "sub", emoji: "👅", label: "Под язык", cats: ["sublingual"] },
  { key: "proc", emoji: "🩺", label: "Процедуры", cats: ["procedure"] },
  { key: "life", emoji: "🌟", label: "Образ жизни и рекомендации", cats: ["lifestyle"] }
];
function buildMemoGroups(items, catalogPatientMap) {
  const visibleByCat = {};
  items.forEach((it) => {
    var _a, _b, _c;
    const meta = it.catalog_id ? catalogPatientMap == null ? void 0 : catalogPatientMap.get(it.catalog_id) : void 0;
    const vis = ((meta == null ? void 0 : meta.patient_visibility) || "visible").toLowerCase();
    if (vis === "hidden") return;
    const name = ((_a = meta == null ? void 0 : meta.patient_name) == null ? void 0 : _a.trim()) || it.name_snapshot;
    const description = ((meta == null ? void 0 : meta.patient_description) || it.notes || "").trim();
    if (vis === "grouped" && (meta == null ? void 0 : meta.patient_group_label)) {
      const arr = visibleByCat[_b = it.section_category] ?? (visibleByCat[_b] = []);
      const existing = arr.find((x) => x.isGroupedMerge && x.name === meta.patient_group_label);
      if (existing) {
        if (description && !existing.description.includes(description)) {
          existing.description = existing.description ? `${existing.description}; ${description}` : description;
        }
      } else {
        arr.push({ name: meta.patient_group_label, description, isGroupedMerge: true });
      }
      return;
    }
    (visibleByCat[_c = it.section_category] ?? (visibleByCat[_c] = [])).push({ name, description });
  });
  const groups = [];
  MEMO_GROUP_DEFS.forEach((def) => {
    const merged = [];
    def.cats.forEach((c) => merged.push(...visibleByCat[c] || []));
    if (merged.length) groups.push({ label: def.label, emoji: def.emoji, items: merged });
  });
  return groups;
}
function memoReadiness(items, catalogPatientMap) {
  let filled = 0;
  let total = 0;
  items.forEach((it) => {
    var _a, _b;
    if (it.section_category === "lifestyle") return;
    total++;
    const meta = it.catalog_id ? catalogPatientMap == null ? void 0 : catalogPatientMap.get(it.catalog_id) : void 0;
    const has = !!(((_a = meta == null ? void 0 : meta.patient_name) == null ? void 0 : _a.trim()) && ((_b = meta == null ? void 0 : meta.patient_description) == null ? void 0 : _b.trim()));
    if (has) filled++;
  });
  const missing = total - filled;
  let state = "complete";
  if (total === 0) state = "complete";
  else if (filled === total) state = "complete";
  else if (missing / total > 0.5) state = "low";
  else state = "partial";
  return { state, filled, total, missing };
}
function makeFilename(courseNumber, fullName, date, prefix) {
  const safe = (s) => s.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_");
  const name = fullName ? safe(fullName) : "пациент";
  const num = courseNumber != null ? `_№${courseNumber}` : "";
  const d = format(date, "dd-MM-yyyy");
  return `${prefix}${num}_${name}_${d}.docx`;
}
export {
  generateMemoDocx as a,
  buildMemoGroups as b,
  generatePlanDocx as g,
  memoReadiness as m
};
