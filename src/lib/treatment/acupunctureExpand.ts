// Resolves IRT acupuncture protocols + ordered points for catalog items
// whose `acupuncture_protocol_id` is set. Used by print page & DOCX export.
import { supabase } from "@/integrations/supabase/client";

export interface IrtPointView {
  order_index: number;
  who_code: string;
  name_ru: string | null;
  pinyin: string | null;
  side: string | null;
  manipulation: string | null;
  depth_mm: string | null;
  retention_min: number | null;
  notes: string | null;
}

export interface IrtProtocolView {
  protocol_id: string;
  name: string;
  session_count: number | null;
  session_duration_min: number | null;
  frequency: string | null;
  points: IrtPointView[];
}

export type IrtCatalogMap = Map<string, IrtProtocolView>;

const SIDE_LABEL: Record<string, string> = {
  bilateral: "билат.",
  left: "слева",
  right: "справа",
};

export function formatIrtPointLine(pt: IrtPointView): string {
  const head = `${pt.who_code}${pt.name_ru ? " " + pt.name_ru : pt.pinyin ? " " + pt.pinyin : ""}`;
  const tail: string[] = [];
  if (pt.side && SIDE_LABEL[pt.side]) tail.push(SIDE_LABEL[pt.side]);
  if (pt.manipulation) tail.push(pt.manipulation);
  if (pt.depth_mm) tail.push(`глуб. ${pt.depth_mm} мм`);
  if (pt.retention_min != null) tail.push(`${pt.retention_min} мин`);
  let line = tail.length ? `${head} — ${tail.join(", ")}` : head;
  if (pt.notes) line += `. ${pt.notes}`;
  return line;
}

export async function fetchIrtForCatalogIds(catalogIds: string[]): Promise<IrtCatalogMap> {
  const map: IrtCatalogMap = new Map();
  if (!catalogIds.length) return map;

  // 1. catalog -> protocol_id
  const { data: cats } = await supabase
    .from("treatment_catalog")
    .select("id, acupuncture_protocol_id" as any)
    .in("id", catalogIds);
  const catToProto = new Map<string, string>();
  ((cats as any[]) || []).forEach((c) => {
    if (c.acupuncture_protocol_id) catToProto.set(c.id, c.acupuncture_protocol_id);
  });
  if (catToProto.size === 0) return map;

  const protoIds = Array.from(new Set(catToProto.values()));
  const [{ data: protos }, { data: pts }] = await Promise.all([
    supabase.from("acupuncture_protocols" as any)
      .select("id, name, session_count, session_duration_min, frequency")
      .in("id", protoIds),
    supabase.from("acupuncture_protocol_points" as any)
      .select("protocol_id, order_index, side, manipulation, depth_mm, retention_min, notes, acupoints(who_code, name_ru, pinyin)")
      .in("protocol_id", protoIds)
      .order("order_index"),
  ]);

  const protoMap = new Map<string, IrtProtocolView>();
  ((protos as any[]) || []).forEach((p) => {
    protoMap.set(p.id, {
      protocol_id: p.id,
      name: p.name,
      session_count: p.session_count ?? null,
      session_duration_min: p.session_duration_min ?? null,
      frequency: p.frequency ?? null,
      points: [],
    });
  });
  ((pts as any[]) || []).forEach((row) => {
    const proto = protoMap.get(row.protocol_id);
    if (!proto) return;
    proto.points.push({
      order_index: row.order_index,
      who_code: row.acupoints?.who_code || "—",
      name_ru: row.acupoints?.name_ru ?? null,
      pinyin: row.acupoints?.pinyin ?? null,
      side: row.side,
      manipulation: row.manipulation,
      depth_mm: row.depth_mm,
      retention_min: row.retention_min,
      notes: row.notes,
    });
  });

  // Bind per catalog_id
  catToProto.forEach((protoId, catId) => {
    const v = protoMap.get(protoId);
    if (v) map.set(catId, v);
  });
  return map;
}
