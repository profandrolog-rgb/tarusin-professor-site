const CATALOG_KNOWN_COLUMNS = [
  "category",
  "subcategory",
  "name",
  "inn",
  "form",
  "default_dose",
  "dose_unit",
  "default_dilution_volume",
  "default_dilution_solvent",
  "default_frequency",
  "default_duration_days",
  "default_route_label",
  "time_of_day_default",
  "notes",
  "contraindications",
  "infusion_rate",
  "is_rx",
  "is_off_label",
  "light_sensitive",
  "glucose_only",
  "dose_range_min",
  "dose_range_max",
  "is_active",
  "tags",
  "pack_size",
  "price_override",
  "price_currency",
  "price_source_note",
  "pack_size_num",
  "units_per_dose_num",
  // ── Метаболическая карта ───────────────────────────────────────────
  "mm_targets",
  "mm_application_point",
  "mm_evidence_level",
  "mm_priority",
  "mm_contraindications"
];
const NUMERIC_COLUMNS = /* @__PURE__ */ new Set([
  "default_dose",
  "default_dilution_volume",
  "default_duration_days",
  "dose_range_min",
  "dose_range_max",
  "price_override",
  "pack_size_num",
  "units_per_dose_num",
  "mm_priority"
]);
const BOOL_COLUMNS = /* @__PURE__ */ new Set([
  "is_rx",
  "is_off_label",
  "light_sensitive",
  "glucose_only",
  "is_active"
]);
const ARRAY_COLUMNS = /* @__PURE__ */ new Set([
  "time_of_day_default",
  "tags",
  "mm_targets",
  "mm_contraindications"
]);
const ALLOWED_CATEGORIES = /* @__PURE__ */ new Set([
  "iv_drip",
  "iv_bolus",
  "im",
  "sc",
  "oral_rx",
  "oral_supplement",
  "rectal",
  "topical",
  "nasal",
  "sublingual",
  "peptide",
  "procedure",
  "lifestyle"
]);
function parseCsv(text, delim = ";") {
  if (text.charCodeAt(0) === 65279) text = text.slice(1);
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === delim) {
        row.push(cell);
        cell = "";
      } else if (c === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (c === "\r") ;
      else {
        cell += c;
      }
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  while (rows.length && rows[rows.length - 1].every((v) => v.trim() === "")) rows.pop();
  return rows;
}
const TRUE_VALS = /* @__PURE__ */ new Set(["1", "true", "да", "yes", "y", "истина", "+", "x", "✓"]);
const FALSE_VALS = /* @__PURE__ */ new Set(["", "0", "false", "нет", "no", "n", "ложь", "-"]);
function rowToPayload(headers, row) {
  const errors = [];
  const warnings = [];
  const payload = {};
  const patientInfo = {};
  const knownSet = new Set(CATALOG_KNOWN_COLUMNS);
  headers.forEach((rawH, idx) => {
    const h = rawH.trim();
    if (!h) return;
    const raw = (row[idx] ?? "").trim();
    if (h.startsWith("patient_")) {
      if (raw !== "") patientInfo[h] = raw;
      return;
    }
    if (!knownSet.has(h)) {
      if (raw !== "") warnings.push(`неизвестный столбец «${h}» — проигнорирован`);
      return;
    }
    if (raw === "") return;
    if (NUMERIC_COLUMNS.has(h)) {
      const v = Number(raw.replace(",", "."));
      if (!Number.isFinite(v)) {
        errors.push(`${h}: не число «${raw}»`);
        return;
      }
      payload[h] = v;
    } else if (BOOL_COLUMNS.has(h)) {
      const lv = raw.toLowerCase();
      if (TRUE_VALS.has(lv)) payload[h] = true;
      else if (FALSE_VALS.has(lv)) payload[h] = false;
      else {
        errors.push(`${h}: не bool «${raw}»`);
      }
    } else if (ARRAY_COLUMNS.has(h)) {
      payload[h] = raw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    } else {
      payload[h] = raw;
    }
  });
  if (Object.keys(patientInfo).length) payload.patient_info = patientInfo;
  if (!payload.name) errors.push("отсутствует обязательное поле name");
  if (!payload.category) errors.push("отсутствует обязательное поле category");
  else if (!ALLOWED_CATEGORIES.has(payload.category)) errors.push(`недопустимая категория «${payload.category}»`);
  return { ok: errors.length === 0, payload, errors, warnings };
}
function serializeCsv(rows, headers, delim = ";") {
  const esc = (v) => {
    if (v === null || v === void 0) return "";
    let s;
    if (Array.isArray(v)) s = v.join(",");
    else if (typeof v === "object") s = JSON.stringify(v);
    else s = String(v);
    if (s.includes(delim) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.join(delim)];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(delim));
  return "\uFEFF" + lines.join("\r\n");
}
export {
  CATALOG_KNOWN_COLUMNS as C,
  parseCsv as p,
  rowToPayload as r,
  serializeCsv as s
};
