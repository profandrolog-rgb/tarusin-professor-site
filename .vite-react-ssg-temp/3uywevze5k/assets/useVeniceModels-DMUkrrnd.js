import { useState, useEffect } from "react";
import { s as supabase } from "../main.mjs";
let audioCtx = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}
const LS_KEY = "app.soundNotificationsEnabled";
function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(LS_KEY) !== "0";
}
function setSoundEnabled(enabled) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, enabled ? "1" : "0");
  } catch {
  }
}
function playCompletionChime() {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const fundamental = 523.25;
  const partials = [
    [fundamental, 0.16],
    [fundamental * 1.5, 0.05]
  ];
  partials.forEach(([freq, peakGain]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.75);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  });
}
const CURATED_MODELS = [
  // ─── Быстрые ───────────────────────────────────────────────────────────
  {
    key: "gemini-flash",
    label: "Gemini 3 Flash",
    tier: "fast",
    candidates: ["google/gemini-3-flash-preview", "google/gemini-2.5-flash"],
    familyRegex: /^google\/gemini-(?:2\.5|3)[^/]*flash(?!-image)/i
  },
  {
    key: "claude-sonnet",
    label: "Claude Sonnet (актуальный)",
    tier: "fast",
    // Take the latest Sonnet from the live list. Candidates first, then family fallback.
    candidates: [
      "anthropic/claude-sonnet-4.8",
      "anthropic/claude-sonnet-4.7",
      "anthropic/claude-sonnet-4.6",
      "anthropic/claude-sonnet-4.5"
    ],
    familyRegex: /^anthropic\/claude-sonnet-/i
  },
  {
    key: "gpt5-mini",
    label: "GPT-5 mini",
    tier: "fast",
    candidates: ["openai/gpt-5-mini"]
  },
  {
    key: "grok-fast",
    label: "Grok 4",
    tier: "fast",
    candidates: ["x-ai/grok-4.5", "x-ai/grok-4.3", "x-ai/grok-4.2", "x-ai/grok-4.1", "x-ai/grok-4"],
    familyRegex: /^x-ai\/grok-4/i
  },
  {
    key: "qwen-flash",
    label: "Qwen 3.6 Flash",
    tier: "fast",
    candidates: [
      "qwen/qwen3.6-flash",
      "qwen/qwen-3.6-flash",
      "qwen/qwen3-flash",
      "qwen/qwen-flash"
    ],
    familyRegex: /^qwen\/qwen[^/]*flash(?!-image)/i
  },
  {
    key: "kimi-k2",
    label: "Kimi K2",
    tier: "fast",
    candidates: [
      "moonshotai/kimi-k2.7-code",
      "moonshotai/kimi-k2.6",
      "moonshotai/kimi-k2.5",
      "moonshotai/kimi-k2-0905",
      "moonshotai/kimi-k2"
    ],
    familyRegex: /^moonshotai\/kimi-k2(?!-thinking)/i
  },
  // ─── Глубокие ─────────────────────────────────────────────────────────
  {
    key: "gemini-pro",
    label: "Gemini 3.1 Pro",
    tier: "deep",
    candidates: ["google/gemini-3.1-pro-preview", "google/gemini-2.5-pro"],
    familyRegex: /^google\/gemini-(?:2\.5|3|3\.1)[^/]*pro(?!-image)/i
  },
  {
    key: "claude-opus",
    label: "Claude Opus 4.8",
    tier: "deep",
    candidates: [
      "anthropic/claude-opus-4-8",
      "anthropic/claude-opus-4.8",
      "anthropic/claude-opus-4-7",
      "anthropic/claude-opus-4.7"
    ],
    familyRegex: /^anthropic\/claude-opus-4/i
  },
  {
    key: "sakana-fugu",
    label: "Fugu Ultra (Sakana AI)",
    tier: "deep",
    candidates: ["sakana/fugu-ultra"],
    hint: "Мета-оркестратор, сам маршрутизирует по пулу моделей"
  },
  {
    key: "gpt56-terra-pro",
    label: "GPT-5.6 Terra Pro",
    tier: "deep",
    candidates: ["openai/gpt-5.6-terra-pro", "openai/gpt-5.6-terra"],
    familyRegex: /^openai\/gpt-5\.6-terra/i
  },
  {
    key: "gpt5",
    label: "GPT-5",
    tier: "deep",
    candidates: ["openai/gpt-5.5", "openai/gpt-5.4-pro", "openai/gpt-5"],
    familyRegex: /^openai\/gpt-5(?:\.\d)?(?:-pro)?(?!-mini|-nano|-chat)/i
  },
  {
    key: "tencent-hy3",
    label: "Hy3 (Tencent)",
    tier: "deep",
    candidates: ["tencent/hy3"],
    familyRegex: /^tencent\/hy3/i,
    hint: "Акцент на anti-hallucination — не выдумывает при нехватке данных"
  },
  {
    key: "nemotron-3-ultra",
    label: "Nemotron 3 Ultra (NVIDIA)",
    tier: "deep",
    candidates: ["nvidia/nemotron-3-ultra-550b-a55b", "nvidia/nemotron-3-ultra-550b-a55b:free"],
    familyRegex: /^nvidia\/nemotron-3-ultra/i,
    hint: "Заточен под агентную оркестрацию — кандидат на роль арбитра"
  },
  {
    key: "mistral-large",
    label: "Mistral Large 3",
    tier: "deep",
    candidates: ["mistralai/mistral-large-2512", "mistralai/mistral-large"],
    familyRegex: /^mistralai\/mistral-large/i
  },
  {
    key: "kimi-k2-thinking",
    label: "Kimi K2 Thinking",
    tier: "deep",
    candidates: ["moonshotai/kimi-k2-thinking"],
    familyRegex: /^moonshotai\/kimi-k2-thinking/i
  },
  {
    key: "deepseek-v4-pro",
    label: "DeepSeek V4-Pro",
    tier: "deep",
    candidates: [
      "deepseek/deepseek-v4-pro",
      "deepseek/deepseek-v4-pro:free",
      "deepseek/deepseek-pro-v4",
      "deepseek/deepseek-v4"
    ],
    familyRegex: /^deepseek\/deepseek-(?:v4|pro|chat-v4)/i
  },
  {
    key: "glm-5",
    label: "GLM-5.2 (Zhipu AI)",
    tier: "deep",
    candidates: ["z-ai/glm-5.2", "z-ai/glm-5"],
    familyRegex: /^z-ai\/glm-/i
  },
  {
    key: "qwen-max",
    label: "Qwen 3 Max",
    tier: "deep",
    candidates: [
      "qwen/qwen3-max",
      "qwen/qwen-max",
      "qwen/qwen3.7-max",
      "qwen/qwen-3.7-max"
    ],
    familyRegex: /^qwen\/qwen[^/]*max/i
  },
  {
    key: "mimo-v25-pro",
    label: "MiMo 2.5 Pro (Xiaomi)",
    tier: "deep",
    candidates: ["xiaomi/mimo-v2.5-pro", "xiaomi/mimo-2.5-pro", "xiaomi/mimo-pro"],
    familyRegex: /^xiaomi\/mimo-/i
  },
  // ─── Venice (без цензуры) ──────────────────────────────────────────────
  // ID совпадают с venice/api/v1/models. Префикс `venice/` нужен бэкенду
  // (ai-chat / ai-council / analyze-documents-batch) для маршрутизации
  // запроса в Venice вместо OpenRouter.
  {
    key: "venice-uncensored",
    label: "Venice Uncensored",
    tier: "fast",
    emoji: "🌶",
    source: "venice",
    uncensored: true,
    candidates: ["venice/venice-uncensored-1-2", "venice/venice-uncensored"]
  },
  // ─── Perplexity (поиск + цитаты в реальном времени) ────────────────────
  // Префикс `perplexity/` маршрутизирует запрос в Perplexity API.
  {
    key: "pplx-sonar",
    label: "Perplexity Sonar",
    tier: "fast",
    emoji: "🔎",
    source: "lovable-gateway",
    hint: "Быстрый поиск с цитатами",
    candidates: ["perplexity/sonar"]
  },
  {
    key: "pplx-sonar-pro",
    label: "Perplexity Sonar Pro",
    tier: "deep",
    emoji: "🔎",
    source: "lovable-gateway",
    hint: "2× больше источников, многошаговый поиск",
    candidates: ["perplexity/sonar-pro"]
  },
  {
    key: "pplx-sonar-reasoning",
    label: "Perplexity Sonar Reasoning",
    tier: "deep",
    emoji: "🔎",
    source: "lovable-gateway",
    hint: "Chain-of-thought + поиск",
    candidates: ["perplexity/sonar-reasoning-pro", "perplexity/sonar-reasoning"]
  },
  {
    key: "pplx-deep-research",
    label: "Perplexity Deep Research",
    tier: "deep",
    emoji: "🔬",
    source: "lovable-gateway",
    hint: "Глубокое исследование (медленно, дорого)",
    candidates: ["perplexity/sonar-deep-research"]
  },
  {
    key: "venice-gemma-uncensored",
    label: "Gemma 4 Uncensored (Venice)",
    tier: "fast",
    emoji: "🌶",
    source: "venice",
    uncensored: true,
    candidates: ["venice/gemma-4-uncensored"]
  },
  {
    key: "venice-llama-405b",
    label: "Hermes 3 Llama 3.1 405B (Venice)",
    tier: "deep",
    emoji: "🌶",
    source: "venice",
    uncensored: true,
    candidates: ["venice/hermes-3-llama-3.1-405b"]
  },
  {
    key: "venice-qwen3-235b",
    label: "Qwen 3 235B Instruct (Venice)",
    tier: "deep",
    emoji: "🌶",
    source: "venice",
    uncensored: true,
    candidates: ["venice/qwen3-235b-a22b-instruct-2507", "venice/qwen3-235b-a22b-thinking-2507"]
  },
  {
    key: "venice-deepseek-r1",
    label: "DeepSeek V4 Pro (Venice)",
    tier: "deep",
    emoji: "🌶",
    source: "venice",
    uncensored: true,
    candidates: ["venice/deepseek-v4-pro", "venice/deepseek-v3.2"]
  },
  // ─── Иллюстрации (генерация изображений) ───────────────────────────────
  // kind:"image" — переключает композер в режим генерации; маршрутизация в
  // edge function generate-image (Lovable Gateway для google/* и openai/*,
  // прямой OpenRouter для всего остального).
  {
    key: "img-gemini-flash",
    label: "Gemini 3.1 Flash Image",
    tier: "image",
    kind: "image",
    source: "lovable-gateway",
    emoji: "🎨",
    hint: "Быстрая, для серий иллюстраций",
    candidates: ["google/gemini-3.1-flash-image"]
  },
  {
    key: "img-gpt-5-4",
    label: "GPT Image 2",
    tier: "image",
    kind: "image",
    source: "lovable-gateway",
    emoji: "🎨",
    hint: "Сложные композиции",
    candidates: ["openai/gpt-image-2", "openai/gpt-image-1-mini"]
  },
  {
    key: "img-gemini-nano",
    label: "Nano Banana (Gemini 2.5 Flash Image)",
    tier: "image",
    kind: "image",
    source: "lovable-gateway",
    emoji: "🍌",
    hint: "Быстрая, экономичная",
    candidates: ["google/gemini-2.5-flash-image"]
  },
  {
    key: "img-gemini-3-pro",
    label: "Gemini 3 Pro Image",
    tier: "image",
    kind: "image",
    source: "lovable-gateway",
    emoji: "🎨",
    hint: "Максимальное качество",
    candidates: ["google/gemini-3-pro-image"]
  },
  {
    key: "img-gpt-mini",
    label: "GPT Image 1 Mini",
    tier: "image",
    kind: "image",
    source: "lovable-gateway",
    emoji: "🎨",
    hint: "Экономичная версия OpenAI",
    candidates: ["openai/gpt-image-1-mini"]
  }
];
const DEFAULT_MODEL_KEY = "gemini-flash";
function modelSupportsAttachments(li) {
  var _a, _b;
  const mods = (_a = li == null ? void 0 : li.architecture) == null ? void 0 : _a.input_modalities;
  if (Array.isArray(mods) && mods.length) {
    return mods.some((m) => m === "image" || m === "file" || m === "pdf");
  }
  const modality = ((_b = li == null ? void 0 : li.architecture) == null ? void 0 : _b.modality) || "";
  return /image|file|pdf/i.test(modality);
}
const TIER_EMOJI = { fast: "⚡", deep: "🧠", image: "🎨" };
function resolveCuratedModel(c, liveById, veniceById) {
  const emoji = c.emoji ?? TIER_EMOJI[c.tier];
  const source = c.source ?? "openrouter";
  const kind = c.kind ?? (c.tier === "image" ? "image" : "text");
  const base = { key: c.key, label: c.label, tier: c.tier, emoji, source, kind, hint: c.hint };
  if (source === "venice") {
    for (const id of c.candidates) {
      const live = veniceById == null ? void 0 : veniceById.get(id);
      if (live) {
        return { ...base, id, available: true, liveInfo: live, uncensored: c.uncensored };
      }
    }
    return { ...base, id: c.candidates[0] ?? c.key, available: true, uncensored: c.uncensored };
  }
  if (kind === "image" || source === "lovable-gateway") {
    return { ...base, id: c.candidates[0] ?? c.key, available: true };
  }
  for (const id of c.candidates) {
    const live = liveById.get(id);
    if (live) return { ...base, id, available: true, liveInfo: live };
  }
  if (c.familyRegex) {
    const matches = [];
    for (const v of liveById.values()) if (c.familyRegex.test(v.id)) matches.push(v);
    if (matches.length) {
      matches.sort((a, b) => b.id.localeCompare(a.id, "en"));
      const live = matches[0];
      return { ...base, id: live.id, available: true, liveInfo: live };
    }
  }
  return { ...base, id: c.candidates[0] ?? c.key, available: false };
}
function formatPricePerMtok(perTokenUsd) {
  if (!perTokenUsd) return null;
  const n = Number(perTokenUsd);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return "$0";
  const perM = n * 1e6;
  if (perM >= 1) return `$${perM.toFixed(2)}/Mtok`;
  return `$${perM.toFixed(3)}/Mtok`;
}
function buildModelTooltip(r) {
  var _a, _b;
  const lines = [r.id];
  if (!r.available) {
    lines.push("⚠ Слаг не найден в OpenRouter — может вернуть 404");
    return lines.join("\n");
  }
  const li = r.liveInfo;
  if (li == null ? void 0 : li.context_length) lines.push(`Контекст: ${li.context_length.toLocaleString("ru-RU")} токенов`);
  const inP = formatPricePerMtok((_a = li == null ? void 0 : li.pricing) == null ? void 0 : _a.prompt);
  const outP = formatPricePerMtok((_b = li == null ? void 0 : li.pricing) == null ? void 0 : _b.completion);
  if (inP || outP) lines.push(`Цена: вход ${inP ?? "—"}, выход ${outP ?? "—"}`);
  return lines.join("\n");
}
const SS_KEY$1 = "openrouter.models.v2";
const SS_TTL_MS$1 = 30 * 60 * 1e3;
let inFlight$1 = null;
async function fetchModels() {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(SS_KEY$1);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.list) && Date.now() - parsed.ts < SS_TTL_MS$1) {
          return parsed.list;
        }
      }
    } catch {
    }
  }
  if (inFlight$1) return inFlight$1;
  inFlight$1 = (async () => {
    const r = await fetch("https://openrouter.ai/api/v1/models", { cache: "force-cache" });
    if (!r.ok) throw new Error(`OpenRouter models HTTP ${r.status}`);
    const j = await r.json();
    const data = Array.isArray(j == null ? void 0 : j.data) ? j.data : [];
    const list = data.filter((m) => m && typeof m.id === "string").map((m) => ({
      id: m.id,
      name: m.name,
      context_length: typeof m.context_length === "number" ? m.context_length : void 0,
      pricing: m.pricing,
      description: m.description,
      architecture: m.architecture
    }));
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(SS_KEY$1, JSON.stringify({ ts: Date.now(), list }));
      } catch {
      }
    }
    return list;
  })();
  try {
    return await inFlight$1;
  } finally {
    inFlight$1 = null;
  }
}
function useOpenRouterModels() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetchModels().then((l) => {
      if (!cancelled) {
        setList(l);
        setLoading(false);
      }
    }).catch((e) => {
      if (!cancelled) {
        setError((e == null ? void 0 : e.message) || "fetch failed");
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const byId = /* @__PURE__ */ new Map();
  for (const m of list) byId.set(m.id, m);
  return { list, byId, loading, error };
}
const SS_KEY = "venice.models.v1";
const SS_TTL_MS = 30 * 60 * 1e3;
let inFlight = null;
async function fetchVeniceModels() {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(SS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.list) && Date.now() - parsed.ts < SS_TTL_MS) {
          return parsed.list;
        }
      }
    } catch {
    }
  }
  const { data: sess } = await supabase.auth.getSession();
  if (!(sess == null ? void 0 : sess.session)) return [];
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const { data, error } = await supabase.functions.invoke("list-venice-models", { body: {} });
    if (error) throw new Error(error.message);
    const raw = Array.isArray(data == null ? void 0 : data.data) ? data.data : [];
    const list = raw.filter((m) => m && typeof m.id === "string").map((m) => {
      var _a, _b;
      const spec = m.model_spec ?? {};
      const cap = spec.capabilities ?? {};
      const inputModalities = ["text"];
      if (cap.supportsVision) inputModalities.push("image");
      const ctx = typeof m.context_length === "number" ? m.context_length : typeof spec.availableContextTokens === "number" ? spec.availableContextTokens : void 0;
      const pricing = spec.pricing ? {
        prompt: ((_a = spec.pricing.input) == null ? void 0 : _a.usd) != null ? String(spec.pricing.input.usd / 1e6) : void 0,
        completion: ((_b = spec.pricing.output) == null ? void 0 : _b.usd) != null ? String(spec.pricing.output.usd / 1e6) : void 0
      } : m.pricing;
      return {
        id: `venice/${m.id}`,
        name: spec.name || m.id,
        context_length: ctx,
        pricing,
        description: spec.description,
        architecture: {
          input_modalities: inputModalities,
          output_modalities: ["text"],
          modality: inputModalities.join("+") + "->text"
        }
      };
    });
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(SS_KEY, JSON.stringify({ ts: Date.now(), list }));
      } catch {
      }
    }
    return list;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}
function useVeniceModels() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      fetchVeniceModels().then((l) => {
        if (!cancelled) {
          setList(l);
          setLoading(false);
        }
      }).catch((e) => {
        if (!cancelled) {
          setError((e == null ? void 0 : e.message) || "fetch failed");
          setLoading(false);
        }
      });
    };
    run();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") run();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);
  const byId = /* @__PURE__ */ new Map();
  for (const m of list) byId.set(m.id, m);
  return { list, byId, loading, error };
}
export {
  CURATED_MODELS as C,
  DEFAULT_MODEL_KEY as D,
  useVeniceModels as a,
  buildModelTooltip as b,
  formatPricePerMtok as f,
  isSoundEnabled as i,
  modelSupportsAttachments as m,
  playCompletionChime as p,
  resolveCuratedModel as r,
  setSoundEnabled as s,
  useOpenRouterModels as u
};
