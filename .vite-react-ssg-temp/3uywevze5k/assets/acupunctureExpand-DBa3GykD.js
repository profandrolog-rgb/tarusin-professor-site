import { s as supabase } from "../main.mjs";
const SIDE_LABEL = {
  bilateral: "билат.",
  left: "слева",
  right: "справа"
};
function formatIrtPointLine(pt) {
  const head = `${pt.who_code}${pt.name_ru ? " " + pt.name_ru : pt.pinyin ? " " + pt.pinyin : ""}`;
  const tail = [];
  if (pt.side && SIDE_LABEL[pt.side]) tail.push(SIDE_LABEL[pt.side]);
  if (pt.manipulation) tail.push(pt.manipulation);
  if (pt.depth_mm) tail.push(`глуб. ${pt.depth_mm} мм`);
  if (pt.retention_min != null) tail.push(`${pt.retention_min} мин`);
  let line = tail.length ? `${head} — ${tail.join(", ")}` : head;
  if (pt.notes) line += `. ${pt.notes}`;
  return line;
}
async function fetchIrtForCatalogIds(catalogIds) {
  const map = /* @__PURE__ */ new Map();
  if (!catalogIds.length) return map;
  const { data: cats } = await supabase.from("treatment_catalog").select("id, acupuncture_protocol_id").in("id", catalogIds);
  const catToProto = /* @__PURE__ */ new Map();
  (cats || []).forEach((c) => {
    if (c.acupuncture_protocol_id) catToProto.set(c.id, c.acupuncture_protocol_id);
  });
  if (catToProto.size === 0) return map;
  const protoIds = Array.from(new Set(catToProto.values()));
  const [{ data: protos }, { data: pts }] = await Promise.all([
    supabase.from("acupuncture_protocols").select("id, name, session_count, session_duration_min, frequency").in("id", protoIds),
    supabase.from("acupuncture_protocol_points").select("protocol_id, order_index, side, manipulation, depth_mm, retention_min, notes, acupoints(who_code, name_ru, pinyin)").in("protocol_id", protoIds).order("order_index")
  ]);
  const protoMap = /* @__PURE__ */ new Map();
  (protos || []).forEach((p) => {
    protoMap.set(p.id, {
      protocol_id: p.id,
      name: p.name,
      session_count: p.session_count ?? null,
      session_duration_min: p.session_duration_min ?? null,
      frequency: p.frequency ?? null,
      points: []
    });
  });
  (pts || []).forEach((row) => {
    var _a, _b, _c;
    const proto = protoMap.get(row.protocol_id);
    if (!proto) return;
    proto.points.push({
      order_index: row.order_index,
      who_code: ((_a = row.acupoints) == null ? void 0 : _a.who_code) || "—",
      name_ru: ((_b = row.acupoints) == null ? void 0 : _b.name_ru) ?? null,
      pinyin: ((_c = row.acupoints) == null ? void 0 : _c.pinyin) ?? null,
      side: row.side,
      manipulation: row.manipulation,
      depth_mm: row.depth_mm,
      retention_min: row.retention_min,
      notes: row.notes
    });
  });
  catToProto.forEach((protoId, catId) => {
    const v = protoMap.get(protoId);
    if (v) map.set(catId, v);
  });
  return map;
}
export {
  formatIrtPointLine as a,
  fetchIrtForCatalogIds as f
};
