// Curated short-list of chat models shown in Cabinet dropdown.
// Each entry lists candidate OpenRouter slugs (newest first); the resolver
// picks the first one present in the live /api/v1/models response, falling back
// to a regex family match. If nothing matches, the entry is marked unavailable
// in the UI and the dropdown disables it so we don't ship known-404 slugs.
export type ModelTier = "fast" | "deep";
export type ModelSource = "openrouter" | "venice";

export type CuratedModel = {
  key: string;            // stable identifier (used as React key)
  label: string;          // base label without the tier emoji
  tier: ModelTier;
  emoji?: string;         // optional override of ⚡ / 🧠
  candidates: string[];   // explicit OpenRouter slugs to try, in order
  familyRegex?: RegExp;   // fallback family pattern if no candidate exists
  source?: ModelSource;   // default: openrouter
  uncensored?: boolean;   // показывать предупреждение «без цензуры»
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
];

// Default model the cabinet boots with. Falls back to a candidate if needed.
export const DEFAULT_MODEL_KEY = "gemini-flash";

export type ResolvedModel = {
  key: string;
  label: string;
  tier: ModelTier;
  emoji: string;
  /** OpenRouter slug to actually send to the gateway. */
  id: string;
  available: boolean;
  liveInfo?: LiveModelInfo;
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

const TIER_EMOJI: Record<ModelTier, string> = { fast: "⚡", deep: "🧠" };

export function resolveCuratedModel(
  c: CuratedModel,
  liveById: Map<string, LiveModelInfo>,
): ResolvedModel {
  const emoji = c.emoji ?? TIER_EMOJI[c.tier];
  // 1) explicit candidates first
  for (const id of c.candidates) {
    const live = liveById.get(id);
    if (live) return { key: c.key, label: c.label, tier: c.tier, emoji, id, available: true, liveInfo: live };
  }
  // 2) family fallback — pick the lexicographically newest matching id
  if (c.familyRegex) {
    const matches: LiveModelInfo[] = [];
    for (const v of liveById.values()) if (c.familyRegex.test(v.id)) matches.push(v);
    if (matches.length) {
      matches.sort((a, b) => b.id.localeCompare(a.id, "en"));
      const live = matches[0];
      return { key: c.key, label: c.label, tier: c.tier, emoji, id: live.id, available: true, liveInfo: live };
    }
  }
  // 3) no match — mark unavailable but still show the entry
  return {
    key: c.key,
    label: c.label,
    tier: c.tier,
    emoji,
    id: c.candidates[0] ?? c.key,
    available: false,
  };
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
