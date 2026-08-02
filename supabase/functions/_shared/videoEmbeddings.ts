// Общий клиент эмбеддингов для видеораздела (Lovable AI Gateway, 1536 измерений).
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

export const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export async function embedTexts(inputs: string[]): Promise<number[][]> {
  if (!inputs.length) return [];
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Эмбеддинги: HTTP ${res.status} ${text.slice(0, 200)}`);
  const json = JSON.parse(text);
  const data = Array.isArray(json?.data) ? json.data : [];
  return data.map((d: any) => d.embedding as number[]);
}

export async function embedOne(input: string): Promise<number[]> {
  const [v] = await embedTexts([input]);
  if (!v) throw new Error("Пустой ответ эмбеддингов");
  return v;
}
