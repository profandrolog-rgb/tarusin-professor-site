import { describe, expect, it } from "vitest";
import {
  buildVideoGalleryMarker,
  extractVideoGalleryOptions,
  findVideoGalleries,
  formatVideoGalleryBody,
  parseVideoGalleries,
  parseVideoGalleryEntries,
  removeVideoGalleryMarker,
  unescapeVideoGalleryMarkers,
  upsertVideoGalleryMarker,
  videoHtmlToMarkdown,
  videoMarkdownToHtml,
  withVideoGalleryOptions,
  type VideoGalleryEntry,
} from "./videoGalleryMarkers";

const MARKER =
  '[[VIDEO_GALLERY: caption="Как проходит консультация" | ratio=16:9 | mode=popup | clinical=restricted | article-videos/uuid-one.mp4 "Первый кадр" | clip.mov@cloud=timeweb@poster=https://x/p.jpg "Второй"]]';

describe("разбор маркера видеогалереи", () => {
  it("отделяет служебные записи от списка видео", () => {
    const hit = findVideoGalleries(MARKER)[0];
    expect(hit.caption).toBe("Как проходит консультация");
    const parsed = extractVideoGalleryOptions(parseVideoGalleryEntries(hit.raw));
    expect(parsed.options).toEqual({ ratio: "16:9", mode: "popup", restricted: true });
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0]).toEqual({
      key: "article-videos/uuid-one.mp4",
      caption: "Первый кадр",
      poster: "",
      cloud: "yandex",
    });
    expect(parsed.entries[1]).toEqual({
      key: "clip.mov",
      caption: "Второй",
      poster: "https://x/p.jpg",
      cloud: "timeweb",
    });
  });

  it("без галочки шторки restricted остаётся false", () => {
    const md = '[[VIDEO_GALLERY: caption="Объяснялка" | ratio=1:1 | mode=overlay | a.mp4]]';
    const seg = parseVideoGalleries(md)[0];
    expect(seg.options.restricted).toBe(false);
    expect(seg.options.ratio).toBe("1:1");
    expect(seg.options.mode).toBe("overlay");
    expect(seg.entries).toEqual([{ key: "a.mp4", caption: "", poster: "", cloud: "yandex" }]);
  });

  it("убирает дубли и сохраняет порядок", () => {
    const md = '[[VIDEO_GALLERY: caption="Повторы" | a.mp4 "первый" | A.MP4 "второй" | b.mp4]]';
    const seg = parseVideoGalleries(md)[0];
    expect(seg.entries.map((e) => e.key)).toEqual(["a.mp4", "b.mp4"]);
    expect(seg.entries[0].caption).toBe("первый");
  });

  it("восстанавливает экранированный маркер", () => {
    const escaped = "\\[\\[VIDEO_GALLERY: caption=\"Тест\" | a.mp4\\]\\]";
    expect(unescapeVideoGalleryMarkers(escaped)).toBe('[[VIDEO_GALLERY: caption="Тест" | a.mp4]]');
  });
});

describe("сборка маркера видеогалереи", () => {
  const entries: VideoGalleryEntry[] = [
    { key: "article-videos/one.mp4", caption: 'Первый "кадр"', poster: "", cloud: "yandex" },
    { key: "clip.mov", caption: "", poster: "https://x/p.jpg", cloud: "timeweb" },
  ];

  it("служебные записи стоят первыми в списке", () => {
    const body = formatVideoGalleryBody(entries, { ratio: "3:4", mode: "overlay", restricted: true });
    const parts = body.split("|").map((s) => s.trim());
    expect(parts[0]).toBe("ratio=3:4");
    expect(parts[1]).toBe("mode=overlay");
    expect(parts[2]).toBe("clinical=restricted");
    expect(parts[3]).toContain("article-videos/one.mp4");
    expect(parts[4]).toContain("clip.mov@cloud=timeweb@poster=https://x/p.jpg");
  });

  it("маркер читается обратно без потерь", () => {
    const marker = buildVideoGalleryMarker("Консультация", entries, {
      ratio: "9:16",
      mode: "popup",
      restricted: false,
    });
    const seg = parseVideoGalleries(marker)[0];
    expect(seg.caption).toBe("Консультация");
    expect(seg.options).toEqual({ ratio: "9:16", mode: "popup", restricted: false });
    // Кавычки в подписях вырезаются намеренно: они служат границами подписи в маркере.
    expect(seg.entries).toEqual([
      { key: "article-videos/one.mp4", caption: "Первый кадр", poster: "", cloud: "yandex" },
      { key: "clip.mov", caption: "", poster: "https://x/p.jpg", cloud: "timeweb" },
    ]);
  });

  it("пустая галерея собирается и разбирается в пустой список", () => {
    const marker = buildVideoGalleryMarker("Пустая", [], {
      ratio: "16:9",
      mode: "popup",
      restricted: false,
    });
    const seg = parseVideoGalleries(marker)[0];
    expect(seg.caption).toBe("Пустая");
    expect(seg.entries).toEqual([]);
    expect(seg.options.ratio).toBe("16:9");
  });

  it("смена параметров не дублирует служебные записи", () => {
    const withService = withVideoGalleryOptions(
      [{ key: "ratio=1:1", caption: "", poster: "", cloud: "yandex" }, ...entries],
      { ratio: "16:9", mode: "overlay", restricted: true },
    );
    const ratios = withService.filter((e) => e.key.startsWith("ratio="));
    expect(ratios).toHaveLength(1);
    expect(ratios[0].key).toBe("ratio=16:9");
  });
});

describe("двусторонняя конвертация для редактора", () => {
  const md =
    'Текст статьи.\n\n[[GALLERY: caption="Фото" | a.jpg "подпись"]]\n\n' +
    '[[VIDEO_GALLERY: caption="Видео" | ratio=1:1 | mode=overlay | article-videos/x.mp4 "кадр"]]\n\nКонец.';

  it("маркеры становятся плашками редактора", () => {
    const html = videoMarkdownToHtml(md);
    expect(html).toContain("data-video-gallery-placeholder");
    expect(html).toContain("data-gallery-placeholder");
  });

  it("плашки возвращаются в маркеры без экранирования", () => {
    const back = videoHtmlToMarkdown(videoMarkdownToHtml(md));
    expect(back).toContain('[[VIDEO_GALLERY: caption="Видео"');
    expect(back).toContain("ratio=1:1");
    expect(back).toContain("mode=overlay");
    expect(back).toContain("article-videos/x.mp4");
    expect(back).toContain('[[GALLERY: caption="Фото"');
    expect(back).not.toContain("\\[\\[VIDEO_GALLERY");
  });

  it("текст статьи остаётся на месте", () => {
    const back = videoHtmlToMarkdown(videoMarkdownToHtml(md));
    expect(back).toContain("Текст статьи.");
    expect(back).toContain("Конец.");
  });
});

describe("замена и удаление маркера в контенте", () => {
  const base = 'Вступление.\n\n[[VIDEO_GALLERY: caption="Галерея" | ratio=16:9 | mode=popup | a.mp4 "кадр"]]\n\nПродолжение.';

  it("перезаписывает маркер той же подписи", () => {
    const res = upsertVideoGalleryMarker(
      base,
      "Галерея",
      [{ key: "b.mp4", caption: "новый", poster: "", cloud: "yandex" }],
      { ratio: "1:1", mode: "overlay", restricted: true },
    );
    expect(res.found).toBe(true);
    const seg = parseVideoGalleries(res.content)[0];
    expect(seg.entries[0].key).toBe("b.mp4");
    expect(seg.options.ratio).toBe("1:1");
    expect(res.content).toContain("Вступление.");
    expect(res.content).toContain("Продолжение.");
  });

  it("добавляет маркер, если такого ещё нет", () => {
    const res = upsertVideoGalleryMarker(
      base,
      "Другая",
      [{ key: "c.mp4", caption: "", poster: "", cloud: "yandex" }],
      { ratio: "3:4", mode: "popup", restricted: false },
    );
    expect(res.found).toBe(false);
    expect(parseVideoGalleries(res.content)).toHaveLength(2);
  });

  it("удаляет маркер, оставляя текст", () => {
    const res = removeVideoGalleryMarker(base, undefined, "Галерея");
    expect(res.found).toBe(true);
    expect(res.content).toContain("Вступление.");
    expect(res.content).toContain("Продолжение.");
    expect(parseVideoGalleries(res.content)).toHaveLength(0);
  });
});
