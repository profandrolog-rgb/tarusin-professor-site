// Ставит глобальные перехватчики window.fetch и supabase.functions.invoke,
// чтобы КАЖДЫЙ вызов Edge Function автоматически отражался в AiActivityDock.
// Работает один раз при старте приложения.

import { supabase } from "@/integrations/supabase/client";
import { startAiTask, labelForEndpoint } from "./aiActivity";

let installed = false;

export function installAiActivityHooks() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // ---- Перехват fetch к /functions/v1/* ----
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const isEdgeFn = typeof url === "string" && /\/functions\/v1\//.test(url);
    if (!isEdgeFn) return origFetch(input as any, init);

    const label = labelForEndpoint(url);
    const task = startAiTask({ label, endpoint: url });
    try {
      const resp = await origFetch(input as any, init);
      // Если стрим — оборачиваем body, чтобы считать байты и держать индикатор
      const ct = resp.headers.get("content-type") || "";
      const isStream = ct.includes("text/event-stream") || ct.includes("stream");
      if (isStream && resp.body) {
        task.progress("Соединение установлено · ожидаю данные…");
        let bytes = 0;
        const reader = resp.body.getReader();
        const stream = new ReadableStream({
          async pull(controller) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                if (!resp.ok) task.fail(`HTTP ${resp.status}`);
                else task.success(`Готово · ${(bytes / 1024).toFixed(1)} KB`);
                return;
              }
              bytes += value?.byteLength || 0;
              task.progress(`Стрим · ${(bytes / 1024).toFixed(1)} KB`, bytes);
              controller.enqueue(value);
            } catch (e: any) {
              controller.error(e);
              task.fail(e?.message || "Разрыв стрима");
            }
          },
          cancel(reason) {
            try { reader.cancel(reason); } catch { /* noop */ }
            task.fail("Отменено");
          },
        });
        return new Response(stream, { status: resp.status, statusText: resp.statusText, headers: resp.headers });
      }
      if (!resp.ok) task.fail(`HTTP ${resp.status} ${resp.statusText || ""}`.trim());
      else task.success("Готово");
      return resp;
    } catch (e: any) {
      task.fail(e?.message || "Сбой сети");
      throw e;
    }
  };

  // ---- Обёртка supabase.functions.invoke ----
  try {
    const fns: any = (supabase as any).functions;
    if (fns && typeof fns.invoke === "function" && !fns.__aiActivityWrapped) {
      const origInvoke = fns.invoke.bind(fns);
      fns.invoke = async (fnName: string, opts?: any) => {
        const label = labelForEndpoint(fnName);
        const task = startAiTask({ label, endpoint: `functions/v1/${fnName}` });
        try {
          const res = await origInvoke(fnName, opts);
          if ((res as any)?.error) {
            task.fail(((res as any).error?.message) || "Ошибка функции");
          } else {
            task.success("Готово");
          }
          return res;
        } catch (e: any) {
          task.fail(e?.message || "Сбой вызова");
          throw e;
        }
      };
      fns.__aiActivityWrapped = true;
    }
  } catch { /* noop */ }
}
