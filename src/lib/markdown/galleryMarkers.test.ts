import { describe, it, expect } from "vitest";
import { splitContentByGallery } from "./galleryMarkers";

describe("splitContentByGallery", () => {
  it("разбирает подпись с внутренними апострофами и кавычками файлов", () => {
    const marker =
      `[[GALLERY: caption="Моя первая налобная лупа ('резидентная оптика')"|cols=2|` +
      `gallery-default-5517d5d4.jpg "Фотография 1996 года, я оперирую с проф. Е.А. Володько"|` +
      `gallery-default-902341ab.jpg "Фотография 2008 года, эта лупа со мной с 1996 года"]]`;
    const segs = splitContentByGallery(`До\n\n${marker}\n\nПосле`);
    const gallery = segs.find((s) => s.type === "gallery");
    expect(gallery).toBeTruthy();
    if (gallery?.type !== "gallery") return;
    expect(gallery.caption).toBe("Моя первая налобная лупа ('резидентная оптика')");
    expect(gallery.files).toHaveLength(3);
    expect(gallery.files[0]).toBe("cols=2");
    expect(gallery.files[1]).toContain("gallery-default-5517d5d4.jpg");
  });

  it("не склеивает два соседних маркера", () => {
    const content =
      '[[GALLERY: caption="Первая"|a.jpg]]\n\n[[GALLERY: caption="Вторая"|b.jpg]]';
    const galleries = splitContentByGallery(content).filter((s) => s.type === "gallery");
    expect(galleries).toHaveLength(2);
  });
});
