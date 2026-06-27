const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type YandexStream = {
  url: string;
  type: "hls" | "dash" | string;
  thumbnail?: string;
};

const isAllowedYandexPlayerUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "runtime.video.cloud.yandex.net" &&
      url.pathname.startsWith("/player/")
    );
  } catch {
    return false;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playerUrl } = await req.json();

    if (!playerUrl || typeof playerUrl !== "string" || !isAllowedYandexPlayerUrl(playerUrl)) {
      return new Response(JSON.stringify({ error: "Некорректная ссылка Yandex Cloud Video" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(playerUrl);
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Не удалось получить данные видеоплеера" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await response.json();
    const content = payload?.content ?? {};
    const streams: YandexStream[] = Array.isArray(content.streams) ? content.streams : [];

    return new Response(
      JSON.stringify({
        title: content.title ?? null,
        duration: content.duration ?? null,
        thumbnail: content.thumbnail ?? content.first_frame_url ?? null,
        width: content.max_video_size?.width ?? null,
        height: content.max_video_size?.height ?? null,
        streams: streams
          .filter((stream) => typeof stream?.url === "string" && stream.url.startsWith("https://"))
          .map((stream) => ({ url: stream.url, type: stream.type, thumbnail: stream.thumbnail ?? null })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("resolve-yandex-video error", error);
    return new Response(JSON.stringify({ error: "Видеоплеер временно недоступен" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});