// Generates an image using a chosen model (Lovable AI Gateway for openai/* and google/*,
// direct OpenRouter for everything else, e.g. bytedance/*). Saves the result to the
// "generated-images" storage bucket and returns its path + a 1h signed URL + reported cost.
//
// Input body:
//   {
//     prompt: string,
//     model: string,                       // e.g. "google/gemini-3.1-flash-image"
//     conversationId: string,              // can be "private:..." (still saved to private/ folder)
//     references?: { bucket: string, path: string }[],  // existing storage paths
//     uploadedRefs?: { name: string, dataBase64: string, mime?: string }[],  // direct uploads
//     size?: string,                       // default "1024x1024"
//   }
// Output:
//   { imagePath, signedUrl, cost, model, savedRefs }

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REF_BUCKET_WHITELIST = new Set([
  "chat-attachments",
  "patient-documents",
  "disease-media",
  "reference-library",
  "generated-images",
]);

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/images/generations";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_IMAGE_FALLBACK_MODEL = "google/gemini-3.1-flash-image";

function isGatewayModel(model: string): boolean {
  return model.startsWith("openai/") || model.startsWith("google/");
}

function extOf(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "png";
}

function buildGatewayPayload(model: string, prompt: string, size: string, refUrls: string[]): Record<string, unknown> {
  if (model.startsWith("google/")) {
    const content: any[] = [{ type: "text", text: prompt }];
    for (const url of refUrls) content.push({ type: "image_url", image_url: { url } });
    return {
      model,
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
      max_tokens: 8192,
    };
  }

  // OpenAI image models — only prompt is supported; references are ignored.
  return { model, prompt, size, quality: "low", n: 1 };
}

async function urlToBase64(url: string): Promise<string | null> {
  const dataUrl = /^data:[^;]+;base64,(.+)$/.exec(url);
  if (dataUrl) return dataUrl[1];
  if (!url.startsWith("http")) return null;

  const ir = await fetch(url);
  if (!ir.ok) return null;
  const ab = await ir.arrayBuffer();
  const bytes = new Uint8Array(ab);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function extractImageBase64(j: any): Promise<string | null> {
  const direct = j?.data?.[0]?.b64_json;
  if (typeof direct === "string" && direct) return direct;

  const images = j?.choices?.[0]?.message?.images;
  if (Array.isArray(images)) {
    for (const img of images) {
      const url = img?.image_url?.url ?? img?.url;
      if (typeof url === "string") {
        const b64 = await urlToBase64(url);
        if (b64) return b64;
      }
    }
  }

  const content = j?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      const url = part?.image_url?.url ?? part?.url;
      if (typeof url === "string") {
        const b64 = await urlToBase64(url);
        if (b64) return b64;
      }
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const svc = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json();
    const prompt: string = (body?.prompt || "").toString().trim();
    const model: string = (body?.model || "").toString().trim();
    const conversationId: string = (body?.conversationId || "default").toString();
    const size: string = body?.size || "1024x1024";
    const references = Array.isArray(body?.references) ? body.references : [];
    const uploadedRefs = Array.isArray(body?.uploadedRefs) ? body.uploadedRefs : [];

    if (!prompt) return new Response(JSON.stringify({ error: "prompt required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    if (!model) return new Response(JSON.stringify({ error: "model required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // Persist uploaded refs into chat-attachments under user folder
    const savedRefs: { bucket: string; path: string }[] = [];
    for (const u of uploadedRefs) {
      try {
        const mime = (u.mime || "image/png").toString();
        const data = Uint8Array.from(atob(u.dataBase64), (c) => c.charCodeAt(0));
        const fname = `${user.id}/img-uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extOf(mime)}`;
        const up = await svc.storage.from("chat-attachments").upload(fname, data, {
          contentType: mime, upsert: false,
        });
        if (!up.error) savedRefs.push({ bucket: "chat-attachments", path: fname });
      } catch { /* ignore single upload errors */ }
    }

    // Build signed URLs for all references (existing + uploaded)
    const allRefs = [...references, ...savedRefs].filter(
      (r) => r?.bucket && r?.path && REF_BUCKET_WHITELIST.has(r.bucket),
    );
    const refUrls: string[] = [];
    for (const r of allRefs) {
      const { data: signed } = await svc.storage.from(r.bucket).createSignedUrl(r.path, 60 * 60);
      if (signed?.signedUrl) refUrls.push(signed.signedUrl);
    }

    // ── Call the model
    let b64: string | null = null;
    let costUsd: number | null = null;
    let usedModel = model;

    if (isGatewayModel(model)) {
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const gatewayHeaders = {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "Content-Type": "application/json",
      };
      const attemptedModels = model === "google/gemini-2.5-flash-image"
        ? [model, GEMINI_IMAGE_FALLBACK_MODEL]
        : [model];
      let lastTxt = "";
      let lastJson: any = {};

      for (const attemptModel of attemptedModels) {
        const payload = buildGatewayPayload(attemptModel, prompt, size, refUrls);
        const r = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: gatewayHeaders,
          body: JSON.stringify(payload),
        });
        const txt = await r.text();
        lastTxt = txt;
        if (!r.ok) {
          return new Response(JSON.stringify({ error: `gateway ${r.status}: ${txt.slice(0, 400)}` }), {
            status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        let j: any;
        try { j = JSON.parse(txt); } catch { j = {}; }
        lastJson = j;
        b64 = await extractImageBase64(j);
        if (b64) {
          usedModel = attemptModel;
          break;
        }
      }
      if (!b64) {
        const sample = lastTxt.slice(0, 300).replace(/"b64_json":"[^"]+"/g, '"b64_json":"…"');
        return new Response(JSON.stringify({ error: `no image in gateway response for ${attemptedModels.join(" -> ")}: ${sample}` }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const usageCost = lastJson?.usage?.cost ?? lastJson?.usage?.total_cost;
      if (typeof usageCost === "number") costUsd = usageCost;
    } else {
      // Direct OpenRouter (chat-completions with image modality)
      if (!OPENROUTER_API_KEY) {
        return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY missing" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const content: any[] = [{ type: "text", text: prompt }];
      for (const url of refUrls) content.push({ type: "image_url", image_url: { url } });
      const payload = {
        model,
        modalities: ["image", "text"],
        messages: [{ role: "user", content }],
      };
      const r = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lovable.app",
          "X-Title": "Lovable Cabinet",
        },
        body: JSON.stringify(payload),
      });
      const txt = await r.text();
      if (!r.ok) {
        return new Response(JSON.stringify({ error: `openrouter ${r.status}: ${txt.slice(0, 400)}` }), {
          status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      let j: any;
      try { j = JSON.parse(txt); } catch { j = {}; }
      // OpenRouter returns image either via choices[0].message.images[].image_url.url
      // or in multimodal content parts. Normalize both shapes.
      b64 = await extractImageBase64(j);
      const usageCost = j?.usage?.cost ?? j?.usage?.total_cost;
      if (typeof usageCost === "number") costUsd = usageCost;
    }

    if (!b64) {
      return new Response(JSON.stringify({ error: "no image in model response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save to generated-images
    const isPrivate = conversationId.startsWith("private:");
    const folder = isPrivate ? "private" : conversationId.replace(/[^a-zA-Z0-9_-]/g, "");
    const imagePath = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const up = await svc.storage.from("generated-images").upload(imagePath, bytes, {
      contentType: "image/png", upsert: false,
    });
    if (up.error) {
      return new Response(JSON.stringify({ error: `upload failed: ${up.error.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: signed } = await svc.storage.from("generated-images").createSignedUrl(imagePath, 60 * 60);

    return new Response(JSON.stringify({
      imagePath,
      signedUrl: signed?.signedUrl ?? null,
      cost: costUsd,
      model: usedModel,
      savedRefs,
      refs: allRefs,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
