import { act, fireEvent, render, waitFor, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DiseaseDetailPage from "./DiseaseDetailPage";

const state = vi.hoisted(() => ({
  current: { id: "article-check", slug: "check", title: "Check", category: "general", article_content: "saved-v1" },
  reads: 0,
  relatedReads: 0,
  pending: null as Promise<unknown> | null,
  shown: "",
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => {
    const query = {
      select: () => query,
      eq: () => query,
      neq: () => query,
      maybeSingle: async () => {
        state.reads++;
        if (state.pending) await state.pending;
        return { data: { ...state.current }, error: null };
      },
      limit: async () => {
        state.relatedReads++;
        return { data: [], error: null };
      },
    };
    return query;
  } },
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ isAdmin: true }) }));
vi.mock("@/hooks/useContentTranslation", () => ({ useContentTranslation: () => ({ translation: null, loading: false }) }));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/AgeConfirmationModal", () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/components/parents/MarkdownArticle", () => ({ default: ({ content }: { content: string }) => { state.shown = content; return null; } }));
vi.mock("@/components/parents/HtmlArticle", () => ({ default: () => null }));
vi.mock("@/components/parents/InlineArticlePageEditor", () => ({ default: () => null }));

function openArticle() {
  return render(<MemoryRouter initialEntries={["/for-parents/check"]}>
    <Routes><Route path="/for-parents/:slug" element={<DiseaseDetailPage />} /></Routes>
  </MemoryRouter>);
}

beforeEach(() => {
  state.reads = 0;
  state.relatedReads = 0;
  state.current.article_content = "saved-v1";
  state.pending = null;
  state.shown = "";
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("saved article refresh", () => {
  it("reads saved content on opening instead of reusing the early result", async () => {
    Object.assign(window, { __earlyArticle: { slug: "check", promise: Promise.resolve({ ...state.current, article_content: "stale" }) } });
    openArticle();
    await waitFor(() => expect(state.shown).toBe("saved-v1"));
    expect(state.reads).toBe(1);
  });

  it("rereads saved text and photo references on focus without fetching related articles again", async () => {
    openArticle();
    await waitFor(() => expect(state.relatedReads).toBe(1));
    state.current.article_content = 'saved-v2\n\n[[GALLERY: caption="Check" | saved-photo.jpg]]';
    fireEvent(window, new Event("focus"));
    await waitFor(() => expect(state.shown).toBe(state.current.article_content));
    expect(state.reads).toBe(2);
    expect(state.relatedReads).toBe(1);
  });

  it("does not read over an open editor", async () => {
    const view = openArticle();
    await waitFor(() => expect(state.relatedReads).toBe(1));
    fireEvent.click(view.getByRole("button", { name: "Редактировать страницу" }));
    fireEvent(window, new Event("focus"));
    fireEvent(document, new Event("visibilitychange"));
    await act(async () => {});
    expect(state.reads).toBe(1);
  });

  it("coalesces focus and visibility events while a read is pending", async () => {
    openArticle();
    await waitFor(() => expect(state.relatedReads).toBe(1));
    let finish: (() => void) | undefined;
    state.pending = new Promise<void>((resolve) => { finish = resolve; });
    fireEvent(window, new Event("focus"));
    fireEvent(window, new Event("focus"));
    fireEvent(document, new Event("visibilitychange"));
    expect(state.reads).toBe(2);
    await act(async () => { finish?.(); });
  });
});