import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import VideoGallery from "./VideoGallery";
import type { VideoGalleryEntry, VideoGalleryOptions } from "@/lib/markdown/videoGalleryMarkers";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(async () => ({
        data: { url: "https://example.test/video.mp4", expiresIn: 3600 },
        error: null,
      })),
    },
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.test/${path}` } }),
      }),
    },
  },
}));

const entry = (key: string, caption = ""): VideoGalleryEntry => ({
  key,
  caption,
  poster: "",
  cloud: "yandex",
});

const options = (over: Partial<VideoGalleryOptions> = {}): VideoGalleryOptions => ({
  ratio: "16:9",
  mode: "popup",
  restricted: false,
  ...over,
});

describe("VideoGallery — медицинская шторка", () => {
  it("с галочкой 18+ галерея закрыта шторкой, плитки недоступны", () => {
    const { container } = render(
      <VideoGallery
        caption="Клинический случай"
        entries={[entry("article-videos/a.mp4"), entry("article-videos/b.mp4")]}
        options={options({ restricted: true })}
      />,
    );
    expect(screen.getByRole("button", { name: /Открыть клиническую галерею/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Открыть видео 1/i })).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("без галочки шторки нет и плитки доступны", () => {
    render(
      <VideoGallery
        caption="Как проходит консультация"
        entries={[entry("article-videos/a.mp4", "Первый кадр")]}
        options={options()}
      />,
    );
    expect(screen.queryByRole("button", { name: /Открыть клиническую галерею/i })).toBeNull();
    expect(screen.getByRole("button", { name: /Открыть видео 1/i })).toBeTruthy();
    expect(screen.getByText("Как проходит консультация")).toBeTruthy();
    expect(screen.getByText("Первый кадр")).toBeTruthy();
  });
});

describe("VideoGallery — запуск ролика", () => {
  it("нажатие на плитку открывает плеер со ссылкой на видео", async () => {
    render(
      <VideoGallery
        caption="Видео"
        entries={[entry("article-videos/a.mp4")]}
        options={options({ mode: "popup" })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Открыть видео 1/i }));
    expect(await screen.findByRole("button", { name: /Закрыть/i })).toBeTruthy();
    await vi.waitFor(() => {
      expect(document.querySelector("video")?.getAttribute("src")).toBe("https://example.test/video.mp4");
    });
  });

  it("в режиме плеера поверх страницы ролик закрывается по завершении", async () => {
    render(
      <VideoGallery
        caption="Видео"
        entries={[entry("article-videos/a.mp4")]}
        options={options({ mode: "overlay" })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Открыть видео 1/i }));
    await screen.findByRole("button", { name: /Закрыть/i });
    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    // конец воспроизведения должен закрыть плеер сам
    video!.dispatchEvent(new Event("ended"));
    await vi.waitFor(() => {
      expect(screen.queryByRole("button", { name: /Закрыть/i })).toBeNull();
    });
  });
});
