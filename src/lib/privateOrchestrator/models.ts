// Предустановленные модели для личного советника (страница /admin/private-orchestrator).
// Список сверен с каталогом OpenRouter 30.10.2026. Любую другую модель можно
// добавить из живого каталога или вручную по ID.
/** none — без цензуры (красный), mid — умеренная (жёлтый), full — обычная (зелёный) */
export type CensorLevel = "none" | "mid" | "full";
/** power — субъективная оценка силы модели: 10 самая сильная, 1 слабая */
export type PresetModel = { id: string; label: string; group: "flagship" | "uncensored"; censor: CensorLevel; power: number };

export const CENSOR_LABELS: Record<CensorLevel, string> = {
  none: "без цензуры",
  mid: "умеренная цензура",
  full: "обычная цензура",
};

export const PRESET_MODELS: PresetModel[] = [
  { id: "openai/gpt-6.1-terra-pro", label: "GPT-6.1 Terra Pro", group: "flagship", censor: "full", power: 10 },
  { id: "anthropic/claude-opus-5.5", label: "Claude Opus 5.5", group: "flagship", censor: "full", power: 10 },
  { id: "google/gemini-4-argon", label: "Gemini 4 Argon", group: "flagship", censor: "full", power: 10 },
  { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5", group: "flagship", censor: "full", power: 9 },
  { id: "x-ai/grok-4.7", label: "Grok 4.7", group: "flagship", censor: "mid", power: 9 },
  { id: "deepseek/deepseek-v4-pro-0813", label: "DeepSeek V4 Pro", group: "flagship", censor: "mid", power: 9 },
  { id: "qwen/qwen3.8-max-prime", label: "Qwen 3.8 Max Prime", group: "flagship", censor: "full", power: 8 },
  { id: "moonshotai/kimi-k3.1-pro", label: "Kimi K3.1 Pro", group: "flagship", censor: "full", power: 8 },
  { id: "z-ai/glm-5.3-prime", label: "GLM 5.3 Prime", group: "flagship", censor: "full", power: 8 },
  { id: "mistralai/mistral-large-4-0", label: "Mistral Large 4", group: "flagship", censor: "mid", power: 7 },
  { id: "nousresearch/hermes-4-405b", label: "Hermes 4 405B", group: "uncensored", censor: "none", power: 7 },
  { id: "nousresearch/hermes-3-llama-3.1-405b", label: "Hermes 3 405B", group: "uncensored", censor: "none", power: 6 },
  { id: "venice/hermes-3-llama-3.1-405b", label: "Venice Hermes 3 405B", group: "uncensored", censor: "none", power: 6 },
  { id: "anthracite-org/magnum-v4-72b", label: "Magnum v4 72B", group: "uncensored", censor: "none", power: 6 },
  { id: "qwen/qwen3-235b-a22b-2507", label: "Qwen3 235B Instruct", group: "uncensored", censor: "mid", power: 6 },
  { id: "sao10k/l3.1-euryale-70b", label: "Euryale 70B v2.2", group: "uncensored", censor: "none", power: 5 },
  { id: "nousresearch/hermes-3-llama-3.1-70b", label: "Hermes 3 70B", group: "uncensored", censor: "none", power: 5 },
  { id: "thedrummer/cydonia-24b-v4.1", label: "Cydonia 24B V4.1", group: "uncensored", censor: "none", power: 5 },
  { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition", label: "Venice Uncensored (Dolphin 24B)", group: "uncensored", censor: "none", power: 5 },
  { id: "venice/venice-uncensored-1-2", label: "Venice Uncensored 1.2", group: "uncensored", censor: "none", power: 5 },
  { id: "thedrummer/skyfall-36b-v2", label: "Skyfall 36B V2", group: "uncensored", censor: "none", power: 4 },
  { id: "thedrummer/unslopnemo-12b", label: "UnslopNemo 12B", group: "uncensored", censor: "none", power: 3 },
  { id: "gryphe/mythomax-l2-13b", label: "MythoMax 13B", group: "uncensored", censor: "none", power: 2 },
  { id: "undi95/remm-slerp-l2-13b", label: "ReMM SLERP 13B", group: "uncensored", censor: "none", power: 2 },
  { id: "sao10k/l3-lunaris-8b", label: "Lunaris 8B", group: "uncensored", censor: "none", power: 1 },
];

export const DEFAULT_ENABLED = [
  "openai/gpt-6.1-terra-pro",
  "anthropic/claude-opus-5.5",
  "google/gemini-4-argon",
  "x-ai/grok-4.7",
  "nousresearch/hermes-4-405b",
];

/** ID модели OpenRouter / Venice: provider/model[:variant] */
export function isValidModelId(id: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*\/[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(id.trim()) && id.length <= 120;
}

export const GENERAL_SYSTEM_PROMPT =
  "Ты — личный универсальный советник-эксперт. Вопросы могут касаться любых тем: бизнес, право, финансы, технологии, наука, история, философия, личные решения. " +
  "Отвечай на русском, прямо, предметно и аргументированно, без лишних оговорок и дисклеймеров. Если вопрос неоднозначен — сначала дай лучший ответ, затем укажи, что стоит уточнить.";

export const GENERAL_SUMMARIZER_PROMPT =
  "Ты — модератор консилиума экспертов. Объедини ответы в один наиболее точный, полный и практичный ответ на русском языке.";
