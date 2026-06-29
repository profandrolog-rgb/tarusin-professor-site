import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { diseaseLoader, diseaseStaticPaths } from "@/loaders/diseaseLoader";
import { parentsLoader } from "@/loaders/parentsLoader";

/**
 * E2E-устойчивость loader-ов публичных роутов.
 * Воспроизводим типичные сбои продакшен-прокси: HTML вместо JSON, 502, сеть.
 * Любой такой сценарий должен возвращать ПУСТЫЕ данные, а не бросать исключение
 * (иначе React Router покажет errorElement, а раньше падало с "Unexpected token '<'").
 */

const HTML_BODY = "<!DOCTYPE html><html><body>SPA fallback</body></html>";

function mockFetch(impl: (url: string) => Response | Promise<Response>) {
  globalThis.fetch = vi.fn(async (input: any) => {
    const url = typeof input === "string" ? input : input.url;
    return impl(url);
  }) as any;
}

function htmlResponse(status = 200) {
  return new Response(HTML_BODY, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function badGateway() {
  return new Response("<html>502 Bad Gateway</html>", {
    status: 502,
    statusText: "Bad Gateway",
    headers: { "content-type": "text/html" },
  });
}

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parentsLoader resilience", () => {
  it("парсит корректный JSON-ответ", async () => {
    mockFetch(() => jsonResponse([{ id: "1", slug: "a", title: "A" }]));
    const data = await parentsLoader();
    expect(data.articles).toHaveLength(1);
  });

  it("возвращает пустой список при HTML вместо JSON (200 + text/html)", async () => {
    mockFetch(() => htmlResponse(200));
    const data = await parentsLoader();
    expect(data).toEqual({ articles: [] });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("возвращает пустой список при 502 Bad Gateway", async () => {
    mockFetch(() => badGateway());
    const data = await parentsLoader();
    expect(data).toEqual({ articles: [] });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("возвращает пустой список при сетевой ошибке", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as any;
    const data = await parentsLoader();
    expect(data).toEqual({ articles: [] });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("возвращает пустой список при JSON-ответе без массива", async () => {
    mockFetch(() => jsonResponse({ unexpected: true }));
    const data = await parentsLoader();
    expect(data).toEqual({ articles: [] });
  });
});

describe("diseaseLoader resilience", () => {
  it("возвращает пусто при отсутствии slug без сетевых вызовов", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as any;
    const data = await diseaseLoader({ params: {} });
    expect(data).toEqual({ article: null, related: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("парсит корректный JSON по slug и related", async () => {
    mockFetch((url) => {
      if (url.includes("slug=eq.")) {
        return jsonResponse([{ id: "x", slug: "ab", category: "cat", title: "T" }]);
      }
      return jsonResponse([{ id: "y", slug: "cd", category: "cat", title: "R" }]);
    });
    const data = await diseaseLoader({ params: { slug: "ab" } });
    expect(data.article?.slug).toBe("ab");
    expect(data.related).toHaveLength(1);
  });

  it("устойчив к HTML вместо JSON при загрузке статьи", async () => {
    mockFetch(() => htmlResponse(200));
    const data = await diseaseLoader({ params: { slug: "ab" } });
    expect(data).toEqual({ article: null, related: [] });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("устойчив к 502 при загрузке статьи", async () => {
    mockFetch(() => badGateway());
    const data = await diseaseLoader({ params: { slug: "ab" } });
    expect(data).toEqual({ article: null, related: [] });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("возвращает статью с пустым related, если related вернул HTML", async () => {
    mockFetch((url) => {
      if (url.includes("slug=eq.")) {
        return jsonResponse([{ id: "x", slug: "ab", category: "cat" }]);
      }
      return htmlResponse(200);
    });
    const data = await diseaseLoader({ params: { slug: "ab" } });
    expect(data.article?.slug).toBe("ab");
    expect(data.related).toEqual([]);
  });

  it("не падает при сетевой ошибке", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("ECONNRESET");
    }) as any;
    const data = await diseaseLoader({ params: { slug: "ab" } });
    expect(data).toEqual({ article: null, related: [] });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("diseaseStaticPaths возвращает [] при HTML-ответе (а не падает в SSG)", async () => {
    mockFetch(() => htmlResponse(200));
    const paths = await diseaseStaticPaths();
    expect(paths).toEqual([]);
  });

  it("diseaseStaticPaths возвращает [] при 502", async () => {
    mockFetch(() => badGateway());
    const paths = await diseaseStaticPaths();
    expect(paths).toEqual([]);
  });

  it("diseaseStaticPaths нормализует валидный ответ", async () => {
    mockFetch(() => jsonResponse([{ slug: "a" }, { slug: "b" }, { slug: null }]));
    const paths = await diseaseStaticPaths();
    expect(paths).toEqual(["/for-parents/a/", "/for-parents/b/"]);
  });
});
