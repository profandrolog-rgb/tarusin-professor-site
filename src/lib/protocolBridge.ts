// Bridge between Cabinet (AI assistant) and protocol pages (visits/ultrasound/plans/consultations).
// Uses BroadcastChannel for live cross-tab messaging + localStorage as fallback queue.

const CHANNEL = "patient-protocol-sync";
const ACTIVE_KEY = "activePatientContext";
const QUEUE_KEY = "pendingProtocolFragments";
const RECENT_KEY = "recentPatientContexts";

export type ProtocolKind = "visit" | "ultrasound" | "consultation" | "treatment_plan";

export type ActivePatientContext = {
  patientId?: string;
  patientName: string;
  targetId?: string; // visit id / round id / plan id
  kind: ProtocolKind;
  url: string;
  updatedAt: number;
};

export type FragmentMessage = {
  type: "fragment";
  text: string;
  targetPatientId?: string;
  targetKind?: ProtocolKind;
  sentAt: number;
};

export type ParsedPlanItem = {
  section_category: string;
  name: string;
  dose: number | null;
  dose_unit: string | null;
  frequency: string | null;
  duration_days: number | null;
  time_of_day: string[];
  route_hint: string | null;
  notes: string | null;
};

export type PlanItemsMessage = {
  type: "plan-items";
  items: ParsedPlanItem[];
  targetPatientId?: string;
  sentAt: number;
};

let bc: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!bc) bc = new BroadcastChannel(CHANNEL);
  return bc;
}

// ----- Active context (set by protocol pages, read by Cabinet) -----

export function setActiveContext(ctx: Omit<ActivePatientContext, "updatedAt">): void {
  const full: ActivePatientContext = { ...ctx, updatedAt: Date.now() };
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(full));
  } catch {}
  // also push to recent list
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list: ActivePatientContext[] = raw ? JSON.parse(raw) : [];
    const dedup = list.filter(
      (x) => !(x.patientId === full.patientId && x.kind === full.kind && x.targetId === full.targetId),
    );
    dedup.unshift(full);
    localStorage.setItem(RECENT_KEY, JSON.stringify(dedup.slice(0, 8)));
  } catch {}
  getChannel()?.postMessage({ type: "active-context", ctx: full });
}

export function clearActiveContextIfMatches(targetId?: string): void {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return;
    const cur: ActivePatientContext = JSON.parse(raw);
    if (!targetId || cur.targetId === targetId) {
      localStorage.removeItem(ACTIVE_KEY);
      getChannel()?.postMessage({ type: "active-context", ctx: null });
    }
  } catch {}
}

export function getActiveContext(): ActivePatientContext | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const ctx: ActivePatientContext = JSON.parse(raw);
    // Stale after 4 hours
    if (Date.now() - ctx.updatedAt > 4 * 60 * 60 * 1000) {
      localStorage.removeItem(ACTIVE_KEY);
      return null;
    }
    return ctx;
  } catch {
    return null;
  }
}

export function getRecentContexts(): ActivePatientContext[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ----- Fragment sending (from Cabinet) -----

export function sendFragmentToProtocol(text: string, target?: ActivePatientContext): "delivered" | "queued" {
  const msg: FragmentMessage = {
    type: "fragment",
    text,
    targetPatientId: target?.patientId,
    targetKind: target?.kind,
    sentAt: Date.now(),
  };
  const ch = getChannel();
  if (ch) {
    ch.postMessage(msg);
    // Also push to queue so a freshly-opened tab can pick it up
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      const queue: FragmentMessage[] = raw ? JSON.parse(raw) : [];
      queue.push(msg);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-10)));
    } catch {}
    return "delivered";
  }
  // Fallback: queue only
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const queue: FragmentMessage[] = raw ? JSON.parse(raw) : [];
    queue.push(msg);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-10)));
  } catch {}
  return "queued";
}

// ----- Fragment receiving (on protocol pages) -----

export function subscribeFragments(
  onFragment: (msg: FragmentMessage) => void,
  filter?: { patientId?: string; kind?: ProtocolKind },
): () => void {
  const ch = getChannel();
  const matches = (msg: FragmentMessage) => {
    if (filter?.patientId && msg.targetPatientId && msg.targetPatientId !== filter.patientId) return false;
    if (filter?.kind && msg.targetKind && msg.targetKind !== filter.kind) return false;
    return true;
  };
  const handler = (ev: MessageEvent) => {
    const data = ev.data as any;
    if (data?.type === "fragment" && matches(data)) onFragment(data);
  };
  ch?.addEventListener("message", handler);
  return () => ch?.removeEventListener("message", handler);
}

export function popQueuedFragments(filter?: { patientId?: string; kind?: ProtocolKind }): FragmentMessage[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const queue: FragmentMessage[] = JSON.parse(raw);
    const matches = (msg: FragmentMessage) => {
      if (filter?.patientId && msg.targetPatientId && msg.targetPatientId !== filter.patientId) return false;
      if (filter?.kind && msg.targetKind && msg.targetKind !== filter.kind) return false;
      // Only items from last 30 min
      return Date.now() - msg.sentAt < 30 * 60 * 1000;
    };
    const taken = queue.filter(matches);
    const remaining = queue.filter((m) => !matches(m));
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    return taken;
  } catch {
    return [];
  }
}

// ----- Active context subscription (Cabinet listens) -----

export function subscribeActiveContext(onChange: (ctx: ActivePatientContext | null) => void): () => void {
  const ch = getChannel();
  const handler = (ev: MessageEvent) => {
    const data = ev.data as any;
    if (data?.type === "active-context") onChange(data.ctx ?? null);
  };
  ch?.addEventListener("message", handler);
  const storageHandler = (e: StorageEvent) => {
    if (e.key === ACTIVE_KEY) onChange(getActiveContext());
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    ch?.removeEventListener("message", handler);
    window.removeEventListener("storage", storageHandler);
  };
}

// ----- Structured plan items (Cabinet -> TreatmentPlanEditor) -----

export function sendPlanItemsToProtocol(
  items: ParsedPlanItem[],
  target?: ActivePatientContext,
): "delivered" | "queued" {
  const msg: PlanItemsMessage = {
    type: "plan-items",
    items,
    targetPatientId: target?.patientId,
    sentAt: Date.now(),
  };
  const ch = getChannel();
  if (ch) ch.postMessage(msg);
  // also queue so freshly opened tab picks it up
  try {
    const raw = localStorage.getItem("pendingPlanItems");
    const queue: PlanItemsMessage[] = raw ? JSON.parse(raw) : [];
    queue.push(msg);
    localStorage.setItem("pendingPlanItems", JSON.stringify(queue.slice(-5)));
  } catch {}
  return ch ? "delivered" : "queued";
}

export function subscribePlanItems(
  onItems: (msg: PlanItemsMessage) => void,
  filter?: { patientId?: string },
): () => void {
  const ch = getChannel();
  const matches = (msg: PlanItemsMessage) =>
    !filter?.patientId || !msg.targetPatientId || msg.targetPatientId === filter.patientId;
  const handler = (ev: MessageEvent) => {
    const data = ev.data as any;
    if (data?.type === "plan-items" && matches(data)) onItems(data);
  };
  ch?.addEventListener("message", handler);
  return () => ch?.removeEventListener("message", handler);
}

export function popQueuedPlanItems(filter?: { patientId?: string }): PlanItemsMessage[] {
  try {
    const raw = localStorage.getItem("pendingPlanItems");
    if (!raw) return [];
    const queue: PlanItemsMessage[] = JSON.parse(raw);
    const matches = (m: PlanItemsMessage) => {
      if (filter?.patientId && m.targetPatientId && m.targetPatientId !== filter.patientId) return false;
      return Date.now() - m.sentAt < 30 * 60 * 1000;
    };
    const taken = queue.filter(matches);
    const remaining = queue.filter((m) => !matches(m));
    localStorage.setItem("pendingPlanItems", JSON.stringify(remaining));
    return taken;
  } catch {
    return [];
  }
}
