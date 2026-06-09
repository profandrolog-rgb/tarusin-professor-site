import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MarkdownArticle from "./MarkdownArticle";
import HtmlArticle from "./HtmlArticle";
import { mergePersistedGalleryFiles } from "@/lib/markdown/galleryMarkers";

// Mock heavy children so the test stays focused on visibility logic.
vi.mock("./PlaceholderGallery", () => ({
  default: ({ caption }: { caption: string }) => (
    <div data-testid="placeholder-gallery">PLACEHOLDER:{caption}</div>
  ),
}));
vi.mock("./ImageGallery", () => ({
  default: ({ caption }: { caption: string }) => (
    <div data-testid="image-gallery">IMAGES:{caption}</div>
  ),
}));

const content = `Вводный абзац.

[[GALLERY: caption="Фото пациента"]]

Заключительный абзац.`;

const baseProps = {
  content,
  articleId: "article-1",
  articleSlug: "test-slug",
  title: "Тестовая статья",
  onContentChange: () => {},
};

describe("MarkdownArticle — видимость PlaceholderGallery", () => {
  it("админу показывает плейсхолдер галереи когда фото ещё нет", () => {
    render(<MarkdownArticle {...baseProps} isAdmin />);
    expect(screen.getByTestId("placeholder-gallery")).toBeInTheDocument();
    expect(screen.getByText(/PLACEHOLDER:Фото пациента/)).toBeInTheDocument();
  });

  it("читателю скрывает плейсхолдер когда files.length === 0", () => {
    render(<MarkdownArticle {...baseProps} isAdmin={false} />);
    expect(screen.queryByTestId("placeholder-gallery")).not.toBeInTheDocument();
    // Окружающий текст всё ещё рендерится
    expect(screen.getByText(/Вводный абзац/)).toBeInTheDocument();
    expect(screen.getByText(/Заключительный абзац/)).toBeInTheDocument();
  });

  it("при наличии файлов читателю показывает галерею, админу — галерею и блок управления", () => {
    const withFiles = {
      ...baseProps,
      content: `Текст.\n\n[[GALLERY: caption="Снимки" | a.jpg | b.jpg]]\n\nЕщё текст.`,
    };
    const { rerender } = render(<MarkdownArticle {...withFiles} isAdmin={false} />);
    expect(screen.getByTestId("image-gallery")).toBeInTheDocument();
    expect(screen.queryByTestId("placeholder-gallery")).not.toBeInTheDocument();

    rerender(<MarkdownArticle {...withFiles} isAdmin />);
    expect(screen.getByTestId("image-gallery")).toBeInTheDocument();
    expect(screen.getByTestId("placeholder-gallery")).toBeInTheDocument();
  });
});

describe("Gallery markers — защита от стирания файлов", () => {
  it("возвращает файлы из актуальной базы, если редактор сохраняет старый пустой маркер", () => {
    const staleDraft = 'До\n\n[[GALLERY: caption="Эпидемиология гинекомастии"]]\n\nПосле';
    const persisted =
      'До\n\n[[GALLERY: caption="Эпидемиология гинекомастии" | ginekomastiya-infographic-1.jpg]]\n\nПосле';

    expect(mergePersistedGalleryFiles(staleDraft, persisted)).toContain(
      '[[GALLERY: caption="Эпидемиология гинекомастии" | ginekomastiya-infographic-1.jpg]]',
    );
  });

  it("не удаляет уже существующие файлы и добавляет новые без дублей", () => {
    const draft = '[[GALLERY: caption="Фото" | new.jpg | old.jpg]]';
    const persisted = '[[GALLERY: caption="Фото" | old.jpg | saved.jpg "подпись"]]';

    expect(mergePersistedGalleryFiles(draft, persisted)).toBe(
      '[[GALLERY: caption="Фото" | new.jpg | old.jpg | saved.jpg "подпись"]]',
    );
  });

  it("возвращает файлы и в HTML-плейсхолдер редактора", () => {
    const draft = '<p>До</p><div data-gallery-placeholder data-caption="Фото"></div><p>После</p>';
    const persisted = '[[GALLERY: caption="Фото" | old.jpg]]';

    expect(mergePersistedGalleryFiles(draft, persisted)).toContain('data-files="old.jpg"');
  });
});

describe("HtmlArticle — публичный HTML-рендер статьи", () => {
  const htmlProps = {
    articleId: "article-1",
    articleSlug: "test-slug",
    title: "Гинекомастия у детей и подростков",
    onContentChange: () => {},
  };

  it("админу показывает HTML-плейсхолдер галереи из редактора", () => {
    render(
      <HtmlArticle
        {...htmlProps}
        isAdmin
        content={'<p>До</p><div data-gallery-placeholder data-caption="Фото"></div><p>После</p>'}
      />,
    );

    expect(screen.getByTestId("placeholder-gallery")).toBeInTheDocument();
    expect(screen.getByText(/PLACEHOLDER:Фото/)).toBeInTheDocument();
  });

  it("читателю скрывает HTML-плейсхолдер галереи без файлов", () => {
    render(
      <HtmlArticle
        {...htmlProps}
        isAdmin={false}
        content={'<p>До</p><div data-gallery-placeholder data-caption="Фото"></div><p>После</p>'}
      />,
    );

    expect(screen.queryByTestId("placeholder-gallery")).not.toBeInTheDocument();
    expect(screen.getByText("До")).toBeInTheDocument();
    expect(screen.getByText("После")).toBeInTheDocument();
  });

  it("заменяет --- внутри h2 на hr и убирает дублирующий первый заголовок", () => {
    const { container } = render(
      <HtmlArticle
        {...htmlProps}
        isAdmin={false}
        content={
          '<p><strong>Гинекомастия у детей и подростков: профессиональный опыт</strong></p>' +
          '<h2><strong><em>Введение</em></strong><br><strong><em>---</em></strong></h2>'
        }
      />,
    );

    expect(screen.queryByText(/профессиональный опыт/)).not.toBeInTheDocument();
    expect(screen.getByText("Введение")).toBeInTheDocument();
    expect(container.querySelector("hr")).toHaveStyle({ borderTop: "2px solid #E2EBF5" });
    expect(container).not.toHaveTextContent("---");
  });
});
