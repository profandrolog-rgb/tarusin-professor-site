// Предустановленные модели для личного советника (страница /admin/private-orchestrator).
// Список сверен с каталогом OpenRouter 30.10.2026. Любую другую модель можно
// добавить из живого каталога или вручную по ID.
export type PresetModel = { id: string; label: string; group: "flagship" | "uncensored" };

export const PRESET_MODELS: PresetModel[] = [
  { id: "openai/gpt-6.1-terra-pro", label: "GPT-6.1 Terra Pro", group: "flagship" },
  { id: "anthropic/claude-opus-5.5", label: "Claude Opus 5.5", group: "flagship" },
  { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5", group: "flagship" },
  { id: "google/gemini-4-argon", label: "Gemini 4 Argon", group: "flagship" },
  { id: "x-ai/grok-4.7", label: "Grok 4.7", group: "flagship" },
  { id: "deepseek/deepseek-v4-pro-0813", label: "DeepSeek V4 Pro", group: "flagship" },
  { id: "qwen/qwen3.8-max-prime", label: "Qwen 3.8 Max Prime", group: "flagship" },
  { id: "moonshotai/kimi-k3.1-pro", label: "Kimi K3.1 Pro", group: "flagship" },
  { id: "z-ai/glm-5.3-prime", label: "GLM 5.3 Prime", group: "flagship" },
  { id: "mistralai/mistral-large-4-0", label: "Mistral Large 4", group: "flagship" },
  { id: "nousresearch/hermes-4-405b", label: "Hermes 4 405B (instruct)", group: "uncensored" },
  { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition", label: "Dolphin Mistral 24B (uncensored)", group: "uncensored" },
  { id: "thedrummer/cydonia-24b-v4.1", label: "Cydonia 24B (uncensored)", group: "uncensored" },
  { id: "qwen/qwen3-235b-a22b-2507", label: "Qwen3 235B Instruct", group: "uncensored" },
  { id: "venice/venice-uncensored-1-2", label: "Venice Uncensored", group: "uncensored" },
  { id: "venice/hermes-3-llama-3.1-405b", label: "Venice Hermes 3 405B", group: "uncensored" },
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
