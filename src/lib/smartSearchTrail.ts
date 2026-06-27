// Shared store for the visitor's most recent Smart Search session.
// Persisted in sessionStorage so it survives navigation but not a new tab/visit.

export type SmartTrailItem = {
  kind: "disease" | "blog" | "video" | "clinical" | "research" | "podcast" | "video_file";
  id: string;
  title: string;
  url: string;
  category?: string | null;
  reason?: string;
};

export type SmartTrail = {
  query: string;
  results: SmartTrailItem[];
  savedAt: number;
};

const KEY = "smartSearchTrail.v1";
const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export function saveTrail(trail: Omit<SmartTrail, "savedAt">) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...trail, savedAt: Date.now() }));
    window.dispatchEvent(new Event("smart-trail:changed"));
  } catch {}
}

export function loadTrail(): SmartTrail | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const trail = JSON.parse(raw) as SmartTrail;
    if (!trail?.results?.length) return null;
    if (Date.now() - (trail.savedAt ?? 0) > TTL_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return trail;
  } catch {
    return null;
  }
}

export function clearTrail() {
  try {
    sessionStorage.removeItem(KEY);
    window.dispatchEvent(new Event("smart-trail:changed"));
  } catch {}
}
