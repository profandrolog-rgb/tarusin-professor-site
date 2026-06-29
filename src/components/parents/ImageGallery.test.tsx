import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import ImageGallery from "./ImageGallery";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.test/${path}` } }),
      }),
    },
  },
}));

function makeFiles(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `photo-${i + 1}.jpg`);
}

describe("ImageGallery — выравнивание последнего ряда", () => {
  it("1 фото: рендерится по центру в обёртке mx-auto с ограничением ширины", () => {
    const { container } = render(<ImageGallery caption="Тест" files={makeFiles(1)} />);
    const wrapper = container.querySelector(".mx-auto");
    expect(wrapper).not.toBeNull();
    expect((wrapper as HTMLElement).className).toMatch(/max-w-\[\d+px\]/);
    expect(container.querySelectorAll("img").length).toBe(1);
  });

  for (const n of [2, 3, 4, 5, 6]) {
    it(`${n} фото: контейнер использует flex-wrap + justify-center (последний ряд центрируется)`, () => {
      const { container } = render(<ImageGallery caption="Тест" files={makeFiles(n)} />);
      const flex = container.querySelector("div.flex.flex-wrap.justify-center");
      expect(flex, `flex-контейнер с justify-center должен существовать для ${n} фото`).not.toBeNull();
      expect(container.querySelectorAll("img").length).toBe(n);

      // Каждая фотокарточка-обёртка должна иметь basis для 3-колоночной сетки на md.
      // (Класс basis висит на div-обёртке вокруг button — см. ImageGallery.tsx.)
      const items = flex!.querySelectorAll(":scope > div");
      expect(items.length).toBe(n);
      items.forEach((el) => {
        expect((el as HTMLElement).className).toMatch(/md:basis-\[calc\(33\.333%-0\.5rem\)\]/);
      });
    });
  }
});
