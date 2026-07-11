const CHANNEL = "patient-protocol-sync";
const ACTIVE_KEY = "activePatientContext";
const QUEUE_KEY = "pendingProtocolFragments";
const RECENT_KEY = "recentPatientContexts";
let bc = null;
function getChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!bc) bc = new BroadcastChannel(CHANNEL);
  return bc;
}
function setActiveContext(ctx) {
  var _a;
  const full = { ...ctx, updatedAt: Date.now() };
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(full));
  } catch {
  }
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const dedup = list.filter(
      (x) => !(x.patientId === full.patientId && x.kind === full.kind && x.targetId === full.targetId)
    );
    dedup.unshift(full);
    localStorage.setItem(RECENT_KEY, JSON.stringify(dedup.slice(0, 8)));
  } catch {
  }
  (_a = getChannel()) == null ? void 0 : _a.postMessage({ type: "active-context", ctx: full });
}
function clearActiveContextIfMatches(targetId) {
  var _a;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return;
    const cur = JSON.parse(raw);
    if (!targetId || cur.targetId === targetId) {
      localStorage.removeItem(ACTIVE_KEY);
      (_a = getChannel()) == null ? void 0 : _a.postMessage({ type: "active-context", ctx: null });
    }
  } catch {
  }
}
function getActiveContext() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const ctx = JSON.parse(raw);
    if (Date.now() - ctx.updatedAt > 4 * 60 * 60 * 1e3) {
      localStorage.removeItem(ACTIVE_KEY);
      return null;
    }
    return ctx;
  } catch {
    return null;
  }
}
function getRecentContexts() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function sendFragmentToProtocol(text, target) {
  const msg = {
    type: "fragment",
    text,
    targetPatientId: target == null ? void 0 : target.patientId,
    targetKind: target == null ? void 0 : target.kind,
    sentAt: Date.now()
  };
  const ch = getChannel();
  if (ch) {
    ch.postMessage(msg);
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push(msg);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-10)));
    } catch {
    }
    return "delivered";
  }
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(msg);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-10)));
  } catch {
  }
  return "queued";
}
function subscribeFragments(onFragment, filter) {
  const ch = getChannel();
  const matches = (msg) => {
    if ((filter == null ? void 0 : filter.patientId) && msg.targetPatientId && msg.targetPatientId !== filter.patientId) return false;
    if ((filter == null ? void 0 : filter.kind) && msg.targetKind && msg.targetKind !== filter.kind) return false;
    return true;
  };
  const handler = (ev) => {
    const data = ev.data;
    if ((data == null ? void 0 : data.type) === "fragment" && matches(data)) onFragment(data);
  };
  ch == null ? void 0 : ch.addEventListener("message", handler);
  return () => ch == null ? void 0 : ch.removeEventListener("message", handler);
}
function popQueuedFragments(filter) {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const queue = JSON.parse(raw);
    const matches = (msg) => {
      if ((filter == null ? void 0 : filter.patientId) && msg.targetPatientId && msg.targetPatientId !== filter.patientId) return false;
      if ((filter == null ? void 0 : filter.kind) && msg.targetKind && msg.targetKind !== filter.kind) return false;
      return Date.now() - msg.sentAt < 30 * 60 * 1e3;
    };
    const taken = queue.filter(matches);
    const remaining = queue.filter((m) => !matches(m));
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    return taken;
  } catch {
    return [];
  }
}
function subscribeActiveContext(onChange) {
  const ch = getChannel();
  const handler = (ev) => {
    const data = ev.data;
    if ((data == null ? void 0 : data.type) === "active-context") onChange(data.ctx ?? null);
  };
  ch == null ? void 0 : ch.addEventListener("message", handler);
  const storageHandler = (e) => {
    if (e.key === ACTIVE_KEY) onChange(getActiveContext());
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    ch == null ? void 0 : ch.removeEventListener("message", handler);
    window.removeEventListener("storage", storageHandler);
  };
}
function sendPlanItemsToProtocol(items, target) {
  const msg = {
    type: "plan-items",
    items,
    targetPatientId: target == null ? void 0 : target.patientId,
    sentAt: Date.now()
  };
  const ch = getChannel();
  if (ch) ch.postMessage(msg);
  try {
    const raw = localStorage.getItem("pendingPlanItems");
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(msg);
    localStorage.setItem("pendingPlanItems", JSON.stringify(queue.slice(-5)));
  } catch {
  }
  return ch ? "delivered" : "queued";
}
function subscribePlanItems(onItems, filter) {
  const ch = getChannel();
  const matches = (msg) => !(filter == null ? void 0 : filter.patientId) || !msg.targetPatientId || msg.targetPatientId === filter.patientId;
  const handler = (ev) => {
    const data = ev.data;
    if ((data == null ? void 0 : data.type) === "plan-items" && matches(data)) onItems(data);
  };
  ch == null ? void 0 : ch.addEventListener("message", handler);
  return () => ch == null ? void 0 : ch.removeEventListener("message", handler);
}
function popQueuedPlanItems(filter) {
  try {
    const raw = localStorage.getItem("pendingPlanItems");
    if (!raw) return [];
    const queue = JSON.parse(raw);
    const matches = (m) => {
      if ((filter == null ? void 0 : filter.patientId) && m.targetPatientId && m.targetPatientId !== filter.patientId) return false;
      return Date.now() - m.sentAt < 30 * 60 * 1e3;
    };
    const taken = queue.filter(matches);
    const remaining = queue.filter((m) => !matches(m));
    localStorage.setItem("pendingPlanItems", JSON.stringify(remaining));
    return taken;
  } catch {
    return [];
  }
}
const RX_QUEUE_KEY = "pendingRxItems";
function pushPendingRxItems(items, patientId) {
  try {
    const raw = localStorage.getItem(RX_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const fresh = queue.filter((q) => now - q.pushedAt < 60 * 60 * 1e3);
    for (const it of items) fresh.push({ item: it, patientId, pushedAt: now });
    localStorage.setItem(RX_QUEUE_KEY, JSON.stringify(fresh));
  } catch {
  }
}
function popNextPendingRxItem(patientId) {
  try {
    const raw = localStorage.getItem(RX_QUEUE_KEY);
    if (!raw) return null;
    const queue = JSON.parse(raw);
    const now = Date.now();
    const fresh = queue.filter((q) => now - q.pushedAt < 60 * 60 * 1e3);
    const idx = patientId ? fresh.findIndex((q) => !q.patientId || q.patientId === patientId) : 0;
    if (idx < 0 || fresh.length === 0) {
      localStorage.setItem(RX_QUEUE_KEY, JSON.stringify(fresh));
      return null;
    }
    const taken = fresh[idx];
    const rest = fresh.filter((_, i) => i !== idx);
    localStorage.setItem(RX_QUEUE_KEY, JSON.stringify(rest));
    return { item: taken.item, remaining: rest.length };
  } catch {
    return null;
  }
}
function getPendingRxCount() {
  try {
    const raw = localStorage.getItem(RX_QUEUE_KEY);
    if (!raw) return 0;
    const queue = JSON.parse(raw);
    const now = Date.now();
    return queue.filter((q) => now - q.pushedAt < 60 * 60 * 1e3).length;
  } catch {
    return 0;
  }
}
const RX_BATCH_KEY = "pendingRxBatch";
function pushRxBatch(items, patientId) {
  try {
    localStorage.setItem(
      RX_BATCH_KEY,
      JSON.stringify({ items, patientId, pushedAt: Date.now() })
    );
  } catch {
  }
}
function popRxBatch(patientId) {
  try {
    const raw = localStorage.getItem(RX_BATCH_KEY);
    if (!raw) return null;
    const b = JSON.parse(raw);
    if (Date.now() - b.pushedAt > 60 * 60 * 1e3) {
      localStorage.removeItem(RX_BATCH_KEY);
      return null;
    }
    if (patientId && b.patientId && b.patientId !== patientId) return null;
    localStorage.removeItem(RX_BATCH_KEY);
    return b;
  } catch {
    return null;
  }
}
export {
  popNextPendingRxItem as a,
  subscribeFragments as b,
  clearActiveContextIfMatches as c,
  popQueuedFragments as d,
  pushPendingRxItems as e,
  subscribePlanItems as f,
  getPendingRxCount as g,
  popQueuedPlanItems as h,
  getActiveContext as i,
  getRecentContexts as j,
  subscribeActiveContext as k,
  pushRxBatch as l,
  sendFragmentToProtocol as m,
  sendPlanItemsToProtocol as n,
  popRxBatch as p,
  setActiveContext as s
};
