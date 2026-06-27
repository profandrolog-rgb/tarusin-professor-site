// Curated short-list of chat models shown in Cabinet dropdown.
// Each entry lists candidate OpenRouter slugs (newest first); the resolver
// picks the first one present in the live /api/v1/models response, falling back
// to a regex family match. If nothing matches, the entry is marked unavailable
// in the UI and the dropdown disables it so we don't ship known-404 slugs.
export type ModelTier = "fast" | "deep" | "image";
export type ModelSource = "openrouter" | "venice" | "lovable-gateway";
export type ModelKind = "text" | "image";

export type CuratedModel = {
  key: string;            // stable identifier (used as React key)
  label: string;          // base label without the tier emoji
  tier: ModelTier;
  emoji?: string;         // optional override of ⚡ / 🧠 / 🎨
  candidates: string[];   // explicit OpenRouter slugs to try, in order
  familyRegex?: RegExp;   // fallback family pattern if no candidate exists
  source?: ModelSource;   // default: openrouter
  uncensored?: boolean;   // показывать предупреждение «без цензуры»
  kind?: ModelKind;       // default: "text"
  hint?: string;          // короткая подсказка под названием
};

export const CURATED_MODELS: CuratedModel[] = [
  // ─── Быстрые ───────────────────────────────────────────────────────────
  {
    key: "gemini-flash",
    label: "Gemini 2.5 Flash",
    tier: "fast",
    candidates: ["google/gemini-2.5-flash"],
    familyRegex: /^google\/gemini-(?:2\.5|3)[^/]*flash(?!-image)/i,
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
      "anthropic/claude-sonnet-4.5",
    ],
    familyRegex: /^anthropic\/claude-sonnet-/i,
  },
  {
    key: "gpt5-mini",
    label: "GPT-5 mini",
    tier: "fast",
    candidates: ["openai/gpt-5-mini"],
  },
  {
    key: "grok-fast",
    label: "Grok 4",
    tier: "fast",
    candidates: ["x-ai/grok-4.3", "x-ai/grok-4.2", "x-ai/grok-4.1", "x-ai/grok-4"],
    familyRegex: /^x-ai\/grok-4/i,
  },
  {
    key: "qwen-flash",
    label: "Qwen 3.6 Flash",
    tier: "fast",
    candidates: [
      "qwen/qwen3.6-flash",
      "qwen/qwen-3.6-flash",
      "qwen/qwen3-flash",
      "qwen/qwen-flash",
    ],
    familyRegex: /^qwen\/qwen[^/]*flash(?!-image)/i,
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
      "moonshotai/kimi-k2",
    ],
    familyRegex: /^moonshotai\/kimi-k2(?!-thinking)/i,
  },


  // ─── Глубокие ─────────────────────────────────────────────────────────
  {
    key: "gemini-pro",
    label: "Gemini 2.5 Pro",
    tier: "deep",
    candidates: ["google/gemini-2.5-pro"],
    familyRegex: /^google\/gemini-(?:2\.5|3)[^/]*pro(?!-image)/i,
  },
  {
    key: "claude-opus",
    label: "Claude Opus 4.8",
    tier: "deep",
    candidates: [
      "anthropic/claude-opus-4-8",
      "anthropic/claude-opus-4.8",
      "anthropic/claude-opus-4-7",
      "anthropic/claude-opus-4.7",
    ],
    familyRegex: /^anthropic\/claude-opus-4/i,
  },
  {
    key: "gpt5",
    label: "GPT-5",
    tier: "deep",
    candidates: ["openai/gpt-5"],
  },
  {
    key: "kimi-k2-thinking",
    label: "Kimi K2 Thinking",
    tier: "deep",
    candidates: ["moonshotai/kimi-k2-thinking"],
    familyRegex: /^moonshotai\/kimi-k2-thinking/i,
  },

  {
    key: "deepseek-v4-pro",
    label: "DeepSeek V4-Pro",
    tier: "deep",
    candidates: [
      "deepseek/deepseek-v4-pro",
      "deepseek/deepseek-v4-pro:free",
      "deepseek/deepseek-pro-v4",
      "deepseek/deepseek-v4",
    ],
    familyRegex: /^deepseek\/deepseek-(?:v4|pro|chat-v4)/i,
  },
  {
    key: "glm-5",
    label: "GLM-5 (Zhipu AI)",
    tier: "deep",
    candidates: ["z-ai/glm-5"],
    familyRegex: /^z-ai\/glm-/i,
  },
  {
    key: "qwen-max",
    label: "Qwen 3.7 Max",
    tier: "deep",
    candidates: [
      "qwen/qwen3.7-max",
      "qwen/qwen-3.7-max",
      "qwen/qwen3-max",
      "qwen/qwen-max",
    ],
    familyRegex: /^qwen\/qwen[^/]*max/i,
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
    candidates: ["venice/venice-uncensored-1-2", "venice/venice-uncensored"],
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
    candidates: ["perplexity/sonar"],
  },
  {
    key: "pplx-sonar-pro",
    label: "Perplexity Sonar Pro",
    tier: "deep",
    emoji: "🔎",
    source: "lovable-gateway",
    hint: "2× больше источников, многошаговый поиск",
    candidates: ["perplexity/sonar-pro"],
  },
  {
    key: "pplx-sonar-reasoning",
    label: "Perplexity Sonar Reasoning",
    tier: "deep",
    emoji: "🔎",
    source: "lovable-gateway",
    hint: "Chain-of-thought + поиск",
    candidates: ["perplexity/sonar-reasoning-pro", "perplexity/sonar-reasoning"],
  },
  {
    key: "pplx-deep-research",
    label: "Perplexity Deep Research",
    tier: "deep",
    emoji: "🔬",
    source: "lovable-gateway",
    hint: "Глубокое исследование (медленно, дорого)",
    candidates: ["perplexity/sonar-deep-research"],
  },
  {
    key: "venice-gemma-uncensored",
    label: "Gemma 4 Uncensored (Venice)",
    tier: "fast",
    emoji: "🌶",
    source: "venice",
    uncensored: true,
    candidates: ["venice/gemma-4-uncensored"],
  },
  {
    key: "venice-llama-405b",
    label: "Hermes 3 Llama 3.1 405B (Venice)",
    tier: "deep",
    emoji: "🌶",
    source: "venice",
    uncensored: true,
    candidates: ["venice/hermes-3-llama-3.1-405b"],
  },
  {
    key: "venice-qwen3-235b",
    label: "Qwen 3 235B Instruct (Venice)",
    tier: "deep",
    emoji: "🌶",
    source: "venice",
    uncensored: true,
    candidates: ["venice/qwen3-235b-a22b-instruct-2507", "venice/qwen3-235b-a22b-thinking-2507"],
  },
  {
    key: "venice-deepseek-r1",
    label: "DeepSeek V4 Pro (Venice)",
    tier: "deep",
    emoji: "🌶",
    source: "venice",
    uncensored: true,
    candidates: ["venice/deepseek-v4-pro", "venice/deepseek-v3.2"],
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
    candidates: ["google/gemini-3.1-flash-image"],
  },
  {
    key: "img-gpt-5-4",
    label: "GPT Image 2",
    tier: "image",
    kind: "image",
    source: "lovable-gateway",
    emoji: "🎨",
    hint: "Сложные композиции",
    candidates: ["openai/gpt-image-2", "openai/gpt-image-1-mini"],
  },
  {
    key: "img-gemini-nano",
    label: "Nano Banana (Gemini 2.5 Flash Image)",
    tier: "image",
    kind: "image",
    source: "lovable-gateway",
    emoji: "🍌",
    hint: "Быстрая, экономичная",
    candidates: ["google/gemini-2.5-flash-image"],
  },
  {
    key: "img-gemini-3-pro",
    label: "Gemini 3 Pro Image",
    tier: "image",
    kind: "image",
    source: "lovable-gateway",
    emoji: "🎨",
    hint: "Максимальное качество",
    candidates: ["google/gemini-3-pro-image"],
  },
  {
    key: "img-gpt-mini",
    label: "GPT Image 1 Mini",
    tier: "image",
    kind: "image",
    source: "lovable-gateway",
    emoji: "🎨",
    hint: "Экономичная версия OpenAI",
    candidates: ["openai/gpt-image-1-mini"],
  },
];

// Default model the cabinet boots with. Falls back to a candidate if needed.
export const DEFAULT_MODEL_KEY = "gemini-flash";

export type ResolvedModel = {
  key: string;
  label: string;
  tier: ModelTier;
  emoji: string;
  /** Gateway slug to actually send (с префиксом `venice/` для Venice-моделей). */
  id: string;
  available: boolean;
  liveInfo?: LiveModelInfo;
  source: ModelSource;
  uncensored?: boolean;
  kind: ModelKind;
  hint?: string;
};

export type LiveModelInfo = {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  description?: string;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
};

/** True if model accepts non-text input (image or file/pdf). */
export function modelSupportsAttachments(li?: LiveModelInfo | null): boolean {
  const mods = li?.architecture?.input_modalities;
  if (Array.isArray(mods) && mods.length) {
    return mods.some((m) => m === "image" || m === "file" || m === "pdf");
  }
  // Fallback: parse legacy modality string "text+image+file->text"
  const modality = li?.architecture?.modality || "";
  return /image|file|pdf/i.test(modality);
}

const TIER_EMOJI: Record<ModelTier, string> = { fast: "⚡", deep: "🧠", image: "🎨" };

export function resolveCuratedModel(
  c: CuratedModel,
  liveById: Map<string, LiveModelInfo>,
  veniceById?: Map<string, LiveModelInfo>,
): ResolvedModel {
  const emoji = c.emoji ?? TIER_EMOJI[c.tier];
  const source: ModelSource = c.source ?? "openrouter";
  const kind: ModelKind = c.kind ?? (c.tier === "image" ? "image" : "text");
  const base = { key: c.key, label: c.label, tier: c.tier, emoji, source, kind, hint: c.hint };
  // Venice — отдельный gateway, не ищем в OpenRouter, но обогащаем live-инфой если есть.
  if (source === "venice") {
    for (const id of c.candidates) {
      const live = veniceById?.get(id);
      if (live) {
        return { ...base, id, available: true, liveInfo: live, uncensored: c.uncensored };
      }
    }
    return { ...base, id: c.candidates[0] ?? c.key, available: true, uncensored: c.uncensored };
  }
  // Image-модели или явный source: lovable-gateway — не ищем live-инфо в OpenRouter.
  if (kind === "image" || source === "lovable-gateway") {
    return { ...base, id: c.candidates[0] ?? c.key, available: true };
  }
  // 1) explicit candidates first
  for (const id of c.candidates) {
    const live = liveById.get(id);
    if (live) return { ...base, id, available: true, liveInfo: live };
  }
  // 2) family fallback — pick the lexicographically newest matching id
  if (c.familyRegex) {
    const matches: LiveModelInfo[] = [];
    for (const v of liveById.values()) if (c.familyRegex.test(v.id)) matches.push(v);
    if (matches.length) {
      matches.sort((a, b) => b.id.localeCompare(a.id, "en"));
      const live = matches[0];
      return { ...base, id: live.id, available: true, liveInfo: live };
    }
  }
  // 3) no match — mark unavailable but still show the entry
  return { ...base, id: c.candidates[0] ?? c.key, available: false };
}

export function formatPricePerMtok(perTokenUsd?: string): string | null {
  if (!perTokenUsd) return null;
  const n = Number(perTokenUsd);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return "$0";
  const perM = n * 1_000_000;
  if (perM >= 1) return `$${perM.toFixed(2)}/Mtok`;
  return `$${perM.toFixed(3)}/Mtok`;
}

export function buildModelTooltip(r: ResolvedModel): string {
  const lines: string[] = [r.id];
  if (!r.available) {
    lines.push("⚠ Слаг не найден в OpenRouter — может вернуть 404");
    return lines.join("\n");
  }
  const li = r.liveInfo;
  if (li?.context_length) lines.push(`Контекст: ${li.context_length.toLocaleString("ru-RU")} токенов`);
  const inP = formatPricePerMtok(li?.pricing?.prompt);
  const outP = formatPricePerMtok(li?.pricing?.completion);
  if (inP || outP) lines.push(`Цена: вход ${inP ?? "—"}, выход ${outP ?? "—"}`);
  return lines.join("\n");
}
