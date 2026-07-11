import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { B as Button, b as Badge, I as Input, T as Textarea, e as useToast, C as Card, c as CardHeader, d as CardTitle, a as CardContent, s as supabase, u as useAuth, r as Checkbox, D as Dialog, h as DialogContent, i as DialogHeader, j as DialogTitle } from "../main.mjs";
import { diffWords } from "diff";
import { Pencil, AlignLeft, Columns, Search, Eye, ChevronUp, ChevronDown, X, Loader2, Mic, Square, Sparkles, AlertTriangle, CheckCircle2, ArrowLeft, Volume2, VolumeX, FileSearch, RefreshCw, RotateCw, FileCheck2, GitMerge, Copy, Plug, Wand2, Languages, ImagePlus, Send } from "lucide-react";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CJYPrMmK.js";
import { u as useOpenRouterModels, a as useVeniceModels, C as CURATED_MODELS, r as resolveCuratedModel, i as isSoundEnabled, s as setSoundEnabled, p as playCompletionChime } from "./useVeniceModels-DMUkrrnd.js";
import { toast } from "sonner";
import { h as htmlToMarkdown } from "./galleryMarkers-BtRCpzSB.js";
import { M as MarkdownArticle } from "./MarkdownArticle-VHzx3tCj.js";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@supabase/supabase-js";
import "i18next";
import "@radix-ui/react-dropdown-menu";
import "react-i18next";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
import "@radix-ui/react-tabs";
import "marked";
import "turndown";
import "turndown-plugin-gfm";
import "react-markdown";
import "remark-gfm";
import "rehype-raw";
import "@dnd-kit/core";
import "@dnd-kit/sortable";
import "@dnd-kit/utilities";
import "react-image-crop";
function findMatches(text, query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const matches = [];
  let i = 0;
  while (true) {
    const idx = t.indexOf(q, i);
    if (idx === -1) break;
    matches.push({ start: idx, end: idx + q.length });
    i = idx + q.length;
  }
  return matches;
}
function splitWithHighlights(text, textStart, matches, currentLocalIndex, namespace, reactKeyPrefix) {
  if (!matches.length) return text;
  const textEnd = textStart + text.length;
  const relevant = matches.map((m, i) => ({ ...m, i })).filter((m) => m.end > textStart && m.start < textEnd);
  if (!relevant.length) return text;
  const nodes = [];
  let cursor = 0;
  for (const m of relevant) {
    const relStart = Math.max(0, m.start - textStart);
    const relEnd = Math.min(text.length, m.end - textStart);
    if (relStart > cursor) nodes.push(text.slice(cursor, relStart));
    const isCurrent = m.i === currentLocalIndex;
    nodes.push(
      /* @__PURE__ */ jsx(
        "mark",
        {
          "data-match-key": `${namespace}-${m.i}`,
          className: isCurrent ? "bg-orange-400 text-black rounded-sm ring-2 ring-orange-600" : "bg-yellow-300/70 text-black rounded-sm",
          children: text.slice(relStart, relEnd)
        },
        `${reactKeyPrefix}-${m.i}`
      )
    );
    cursor = relEnd;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return /* @__PURE__ */ jsx(Fragment, { children: nodes });
}
function renderInline(parts, matches, currentIndex) {
  let offset = 0;
  return parts.map((p, i) => {
    const start = offset;
    offset += p.value.length;
    const content = splitWithHighlights(p.value, start, matches, currentIndex, "inline", `inline-${i}`);
    if (p.added) {
      return /* @__PURE__ */ jsx("span", { className: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded px-0.5 underline decoration-emerald-500/50", children: content }, i);
    }
    if (p.removed) {
      return /* @__PURE__ */ jsx("span", { className: "bg-red-500/15 text-red-700 dark:text-red-300 rounded px-0.5 line-through decoration-red-500/60", children: content }, i);
    }
    return /* @__PURE__ */ jsx("span", { children: content }, i);
  });
}
function renderSide(parts, side, matches, currentIndex) {
  let offset = 0;
  return parts.map((p, i) => {
    const appearsOnSide = !(p.added && side === "before" || p.removed && side === "after");
    const start = offset;
    if (appearsOnSide) offset += p.value.length;
    if (p.added && side === "before") return null;
    if (p.removed && side === "after") return null;
    const content = splitWithHighlights(p.value, start, matches, currentIndex, side, `${side}-${i}`);
    if (p.added && side === "after") {
      return /* @__PURE__ */ jsx("span", { className: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded px-0.5", children: content }, i);
    }
    if (p.removed && side === "before") {
      return /* @__PURE__ */ jsx("span", { className: "bg-red-500/15 text-red-700 dark:text-red-300 rounded px-0.5 line-through", children: content }, i);
    }
    return /* @__PURE__ */ jsx("span", { children: content }, i);
  });
}
function ArticleDiffEditor({ original, value, onChange }) {
  const [mode, setMode] = useState("edit");
  const textareaRef = useRef(null);
  const viewRef = useRef(null);
  const [diffValue, setDiffValue] = useState(value);
  useEffect(() => {
    if (mode !== "edit") setDiffValue(value);
  }, [mode, value]);
  const parts = useMemo(
    () => original && diffValue ? diffWords(original, diffValue) : [],
    [original, diffValue]
  );
  const stats = useMemo(() => {
    let added = 0, removed = 0;
    for (const p of parts) {
      const words = p.value.trim() ? p.value.trim().split(/\s+/).length : 0;
      if (p.added) added += words;
      if (p.removed) removed += words;
    }
    return { added, removed };
  }, [parts]);
  const hasDiff = Boolean(original) && original !== value;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const inlineSourceText = useMemo(() => parts.map((p) => p.value).join(""), [parts]);
  const editMatches = useMemo(() => mode === "edit" ? findMatches(value, query) : [], [mode, value, query]);
  const inlineMatches = useMemo(() => mode === "inline" ? findMatches(inlineSourceText, query) : [], [mode, inlineSourceText, query]);
  const beforeMatches = useMemo(() => mode === "split" ? findMatches(original, query) : [], [mode, original, query]);
  const afterMatches = useMemo(() => mode === "split" ? findMatches(diffValue, query) : [], [mode, diffValue, query]);
  const activeMatches = mode === "edit" ? editMatches : mode === "inline" ? inlineMatches : [...beforeMatches, ...afterMatches];
  useEffect(() => {
    setCurrentMatch(0);
  }, [query, mode]);
  useEffect(() => {
    var _a;
    if (!query.trim() || !activeMatches.length) return;
    if (mode === "edit") {
      const m = editMatches[currentMatch];
      if (m && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(m.start, m.end);
      }
      return;
    }
    let namespace = "inline";
    let local = currentMatch;
    if (mode === "split") {
      if (currentMatch < beforeMatches.length) {
        namespace = "before";
        local = currentMatch;
      } else {
        namespace = "after";
        local = currentMatch - beforeMatches.length;
      }
    }
    const el = (_a = viewRef.current) == null ? void 0 : _a.querySelector(`[data-match-key="${namespace}-${local}"]`);
    el == null ? void 0 : el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentMatch, mode, activeMatches.length]);
  function goNext() {
    if (!activeMatches.length) return;
    setCurrentMatch((i) => (i + 1) % activeMatches.length);
  }
  function goPrev() {
    if (!activeMatches.length) return;
    setCurrentMatch((i) => (i - 1 + activeMatches.length) % activeMatches.length);
  }
  const beforeCurrentIndex = mode === "split" && currentMatch < beforeMatches.length ? currentMatch : -1;
  const afterCurrentIndex = mode === "split" && currentMatch >= beforeMatches.length ? currentMatch - beforeMatches.length : -1;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "inline-flex rounded-md border border-border overflow-hidden", children: [
        /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: mode === "edit" ? "default" : "ghost", onClick: () => setMode("edit"), className: "rounded-none", children: [
          /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4 mr-1.5" }),
          " Редактор"
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: mode === "inline" ? "default" : "ghost", onClick: () => setMode("inline"), className: "rounded-none", disabled: !hasDiff, children: [
          /* @__PURE__ */ jsx(AlignLeft, { className: "w-4 h-4 mr-1.5" }),
          " Подсветка изменений"
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: mode === "split" ? "default" : "ghost", onClick: () => setMode("split"), className: "rounded-none", disabled: !hasDiff, children: [
          /* @__PURE__ */ jsx(Columns, { className: "w-4 h-4 mr-1.5" }),
          " До / после"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(Button, { type: "button", size: "sm", variant: searchOpen ? "default" : "outline", onClick: () => setSearchOpen((v) => !v), children: [
          /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 mr-1.5" }),
          " Найти"
        ] }),
        hasDiff ? /* @__PURE__ */ jsxs("div", { className: "flex gap-2 text-xs", children: [
          /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", children: [
            "+",
            stats.added,
            " слов"
          ] }),
          /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30", children: [
            "−",
            stats.removed,
            " слов"
          ] })
        ] }) : /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs", children: [
          /* @__PURE__ */ jsx(Eye, { className: "w-3 h-3 mr-1" }),
          " Изменений нет"
        ] })
      ] })
    ] }),
    searchOpen && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2", children: [
      /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 text-muted-foreground shrink-0" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          autoFocus: true,
          value: query,
          onChange: (e) => setQuery(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              goNext();
            }
            if (e.key === "Enter" && e.shiftKey) {
              e.preventDefault();
              goPrev();
            }
            if (e.key === "Escape") {
              setSearchOpen(false);
              setQuery("");
            }
          },
          placeholder: "Слово или фраза…",
          className: "h-8"
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground whitespace-nowrap px-1", children: query.trim() ? activeMatches.length ? `${currentMatch + 1} / ${activeMatches.length}` : "0 совпадений" : "" }),
      /* @__PURE__ */ jsx(Button, { type: "button", size: "icon", variant: "ghost", className: "h-8 w-8", onClick: goPrev, disabled: !activeMatches.length, title: "Предыдущее (Shift+Enter)", children: /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsx(Button, { type: "button", size: "icon", variant: "ghost", className: "h-8 w-8", onClick: goNext, disabled: !activeMatches.length, title: "Следующее (Enter)", children: /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }) }),
      /* @__PURE__ */ jsx(Button, { type: "button", size: "icon", variant: "ghost", className: "h-8 w-8", onClick: () => {
        setSearchOpen(false);
        setQuery("");
      }, title: "Закрыть (Esc)", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
    ] }),
    mode === "edit" && /* @__PURE__ */ jsx(
      Textarea,
      {
        ref: textareaRef,
        value,
        onChange: (e) => onChange(e.target.value),
        className: "min-h-[420px] font-serif text-[15px] leading-relaxed"
      }
    ),
    mode === "inline" && /* @__PURE__ */ jsx("div", { ref: viewRef, className: "min-h-[420px] rounded-md border border-border bg-background p-4 font-serif text-[15px] leading-relaxed whitespace-pre-wrap", children: renderInline(parts, inlineMatches, currentMatch) }),
    mode === "split" && /* @__PURE__ */ jsxs("div", { ref: viewRef, className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-border bg-muted/30 p-4 font-serif text-[14px] leading-relaxed whitespace-pre-wrap min-h-[420px]", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2", children: "До консолидации" }),
        renderSide(parts, "before", beforeMatches, beforeCurrentIndex)
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 font-serif text-[14px] leading-relaxed whitespace-pre-wrap min-h-[420px]", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2", children: "После консолидации" }),
        renderSide(parts, "after", afterMatches, afterCurrentIndex)
      ] })
    ] })
  ] });
}
const ASSEMBLE_TRIGGERS = [
  "собери статью",
  "соберём статью",
  "соберем статью",
  "собирай статью",
  "собрать статью",
  "собери черновик",
  "свёрстай черновик",
  "сверстай черновик",
  "причеши текст",
  "причёсывай текст",
  "причесывай текст",
  "заверши диктовку",
  "закончили диктовку",
  "готово собирай",
  "готово, собирай",
  "заверши статью",
  "финал собирай"
];
function normalize(s) {
  return s.toLowerCase().replace(/ё/g, "е").replace(/[.,!?;:"«»()\-—]/g, " ").replace(/\s+/g, " ").trim();
}
function detectAssembleTrigger(text) {
  const n = normalize(text);
  for (const t of ASSEMBLE_TRIGGERS) {
    if (n.includes(t)) {
      const re = new RegExp(t.replace(/ё/g, "[её]").replace(/\s+/g, "\\s+"), "i");
      return { hit: true, cleaned: text.replace(re, "").trim() };
    }
  }
  return { hit: false, cleaned: text };
}
function encodeWav(samples, srcSampleRate, dstSampleRate = 16e3) {
  const ratio = srcSampleRate / dstSampleRate;
  const newLen = Math.floor(samples.length / ratio);
  const out = new Int16Array(newLen);
  for (let i = 0; i < newLen; i++) {
    const idx = Math.floor(i * ratio);
    let s = samples[idx];
    if (s > 1) s = 1;
    else if (s < -1) s = -1;
    out[i] = s < 0 ? s * 32768 : s * 32767;
  }
  const buf = new ArrayBuffer(44 + out.length * 2);
  const view = new DataView(buf);
  const w = (o, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  view.setUint32(4, 36 + out.length * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, dstSampleRate, true);
  view.setUint32(28, dstSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  w(36, "data");
  view.setUint32(40, out.length * 2, true);
  let off = 44;
  for (let i = 0; i < out.length; i++, off += 2) view.setInt16(off, out[i], true);
  return new Blob([buf], { type: "audio/wav" });
}
function DictationStudio({ onAssembled, initialTitle }) {
  const { toast: toast2 } = useToast();
  const [recording, setRecording] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [fragments, setFragments] = useState([]);
  const [level, setLevel] = useState(0);
  const [dictationId, setDictationId] = useState(null);
  const [pendingFragments, setPendingFragments] = useState(0);
  const [error, setError] = useState(null);
  const ctxRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const procRef = useRef(null);
  const bufferRef = useRef([]);
  const silenceMsRef = useRef(0);
  const speakingRef = useRef(false);
  const startedAtRef = useRef(0);
  const fragIdxRef = useRef(0);
  const recordingRef = useRef(false);
  const assembleQueuedRef = useRef(false);
  const SILENCE_THRESHOLD = 0.012;
  const SILENCE_TIMEOUT_MS = 1500;
  const MAX_FRAGMENT_MS = 45e3;
  const MIN_FRAGMENT_MS = 700;
  const rawText = fragments.map((f) => f.text).join("\n").trim();
  const ensureDictationRow = async () => {
    if (dictationId) return dictationId;
    const { data: u } = await supabase.auth.getUser();
    if (!(u == null ? void 0 : u.user)) {
      setError("Нужна авторизация");
      return null;
    }
    const { data, error: dbErr } = await supabase.from("article_dictations").insert({ user_id: u.user.id, title: initialTitle ?? null, status: "recording", raw_dictation: "" }).select("id").single();
    if (dbErr) {
      setError(dbErr.message);
      return null;
    }
    setDictationId(data.id);
    return data.id;
  };
  const processFragment = async (pcm, srcRate, ms, did) => {
    var _a;
    setPendingFragments((n) => n + 1);
    const idx = ++fragIdxRef.current;
    try {
      const wav = encodeWav(pcm, srcRate);
      if (wav.size < 4096 || ms < MIN_FRAGMENT_MS) {
        setPendingFragments((n) => n - 1);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const fd = new FormData();
      fd.append("file", wav, `frag-${idx}.wav`);
      const resp = await fetch("https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/ai-transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${(session == null ? void 0 : session.access_token) ?? ""}` },
        body: fd
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error((json == null ? void 0 : json.error) || `HTTP ${resp.status}`);
      let text = String(json.text || "").trim();
      if (!text) {
        setPendingFragments((n) => n - 1);
        return;
      }
      const trig = detectAssembleTrigger(text);
      const visibleText = trig.cleaned;
      const { data: u } = await supabase.auth.getUser();
      const audioPath = `${(_a = u == null ? void 0 : u.user) == null ? void 0 : _a.id}/${did}/frag-${idx}.wav`;
      supabase.storage.from("article-dictations").upload(audioPath, wav, { contentType: "audio/wav", upsert: true }).catch(() => {
      });
      const frag = { idx, text: visibleText, audioPath, ms };
      setFragments((prev) => {
        const next = [...prev, frag].filter((f) => f.text);
        const raw = next.map((f) => f.text).join("\n");
        supabase.from("article_dictations").update({
          raw_dictation: raw,
          fragments: next,
          audio_paths: next.map((f) => f.audioPath).filter(Boolean)
        }).eq("id", did).then(() => {
        });
        return next;
      });
      if (visibleText) {
        toast2({ title: "✓ Фрагмент добавлен", description: "Диктуйте дальше, профессор" });
      }
      if (trig.hit && !assembleQueuedRef.current) {
        assembleQueuedRef.current = true;
        stopRecording();
        setTimeout(() => runAssemble(did), 250);
      }
    } catch (e) {
      toast2({ title: "Ошибка распознавания фрагмента", description: e.message, variant: "destructive" });
    } finally {
      setPendingFragments((n) => Math.max(0, n - 1));
    }
  };
  const flushBuffer = (did) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const parts = bufferRef.current;
    bufferRef.current = [];
    if (!parts.length) return;
    let total = 0;
    for (const p of parts) total += p.length;
    const merged = new Float32Array(total);
    let o = 0;
    for (const p of parts) {
      merged.set(p, o);
      o += p.length;
    }
    const ms = merged.length / ctx.sampleRate * 1e3;
    void processFragment(merged, ctx.sampleRate, ms, did);
    startedAtRef.current = performance.now();
  };
  const startRecording = async () => {
    setError(null);
    const did = await ensureDictationRow();
    if (!did) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      procRef.current = proc;
      bufferRef.current = [];
      silenceMsRef.current = 0;
      speakingRef.current = false;
      startedAtRef.current = performance.now();
      assembleQueuedRef.current = false;
      proc.onaudioprocess = (e) => {
        if (!recordingRef.current) return;
        const inp = e.inputBuffer.getChannelData(0);
        const copy = new Float32Array(inp.length);
        copy.set(inp);
        bufferRef.current.push(copy);
        let sum = 0;
        for (let i = 0; i < inp.length; i++) {
          const v = inp[i];
          sum += v * v;
        }
        const rms = Math.sqrt(sum / inp.length);
        setLevel(Math.min(1, rms * 8));
        const chunkMs = inp.length / ctx.sampleRate * 1e3;
        if (rms > SILENCE_THRESHOLD) {
          silenceMsRef.current = 0;
          speakingRef.current = true;
        } else if (speakingRef.current) {
          silenceMsRef.current += chunkMs;
          if (silenceMsRef.current >= SILENCE_TIMEOUT_MS) {
            speakingRef.current = false;
            silenceMsRef.current = 0;
            flushBuffer(did);
          }
        } else {
          if (bufferRef.current.length > 20) bufferRef.current.shift();
        }
        const liveMs = performance.now() - startedAtRef.current;
        if (liveMs > MAX_FRAGMENT_MS && speakingRef.current) {
          speakingRef.current = false;
          silenceMsRef.current = 0;
          flushBuffer(did);
        }
      };
      source.connect(proc);
      proc.connect(ctx.destination);
      recordingRef.current = true;
      setRecording(true);
    } catch (e) {
      setError(e.message);
      toast2({ title: "Нет доступа к микрофону", description: e.message, variant: "destructive" });
    }
  };
  const stopRecording = () => {
    var _a, _b, _c, _d;
    recordingRef.current = false;
    setRecording(false);
    try {
      (_a = procRef.current) == null ? void 0 : _a.disconnect();
    } catch {
    }
    try {
      (_b = sourceRef.current) == null ? void 0 : _b.disconnect();
    } catch {
    }
    try {
      (_c = streamRef.current) == null ? void 0 : _c.getTracks().forEach((t) => t.stop());
    } catch {
    }
    if (dictationId && speakingRef.current && bufferRef.current.length) {
      flushBuffer(dictationId);
    }
    try {
      (_d = ctxRef.current) == null ? void 0 : _d.close();
    } catch {
    }
    ctxRef.current = null;
    procRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    setLevel(0);
  };
  useEffect(() => () => {
    if (recordingRef.current) stopRecording();
  }, []);
  const runAssemble = async (didArg) => {
    const did = didArg ?? dictationId;
    const raw = fragments.map((f) => f.text).join("\n").trim();
    if (!raw) {
      toast2({ title: "Нет текста для сборки", variant: "destructive" });
      return;
    }
    setAssembling(true);
    try {
      const start = Date.now();
      while (pendingFragments > 0 && Date.now() - start < 8e3) {
        await new Promise((r) => setTimeout(r, 250));
      }
      const finalRaw = fragments.map((f) => f.text).join("\n").trim();
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch("https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/clean-dictation", {
        method: "POST",
        headers: { Authorization: `Bearer ${(session == null ? void 0 : session.access_token) ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: finalRaw, dictationId: did })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error((json == null ? void 0 : json.error) || `HTTP ${resp.status}`);
      const cleaned = json.cleaned;
      onAssembled(cleaned, finalRaw);
      toast2({ title: "Статья собрана и причёсана", description: "Текст вставлен в поле №1. Можно запускать ревью." });
    } catch (e) {
      toast2({ title: "Не удалось собрать статью", description: e.message, variant: "destructive" });
    } finally {
      setAssembling(false);
    }
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsx("span", { className: "flex items-center gap-2", children: "🎙 Студия диктовки" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        recording && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-red-500/10 text-red-600 border-red-500/30 animate-pulse", children: [
          "Запись · ",
          fragments.length,
          " фрагм."
        ] }),
        pendingFragments > 0 && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "bg-amber-500/10 text-amber-700 border-amber-500/30", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 mr-1 animate-spin" }),
          " распознаю: ",
          pendingFragments
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
        "Диктуйте свободно, паузы делят запись на фрагменты. После каждой паузы вы увидите ✓ «Фрагмент добавлен». Чтобы закончить — скажите ",
        /* @__PURE__ */ jsx("b", { children: "«собери статью»" }),
        " (или нажмите кнопку справа)."
      ] }),
      recording && /* @__PURE__ */ jsx("div", { className: "h-2 bg-muted rounded overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-emerald-500 transition-all", style: { width: `${Math.round(level * 100)}%` } }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        !recording ? /* @__PURE__ */ jsxs(Button, { onClick: startRecording, disabled: assembling, children: [
          /* @__PURE__ */ jsx(Mic, { className: "w-4 h-4 mr-1" }),
          " Начать диктовку"
        ] }) : /* @__PURE__ */ jsxs(Button, { variant: "destructive", onClick: stopRecording, children: [
          /* @__PURE__ */ jsx(Square, { className: "w-4 h-4 mr-1" }),
          " Остановить"
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => runAssemble(),
            disabled: assembling || !fragments.length || pendingFragments > 0,
            children: [
              assembling ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-1 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 mr-1" }),
              assembling ? "Собираю…" : "Собрать статью (Claude Opus 4.8)"
            ]
          }
        )
      ] }),
      error && /* @__PURE__ */ jsxs("div", { className: "text-sm text-destructive flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4" }),
        " ",
        error
      ] }),
      fragments.length > 0 && /* @__PURE__ */ jsx("div", { className: "border rounded-md p-3 bg-muted/30 max-h-64 overflow-auto space-y-1.5 text-sm", children: fragments.map((f) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-500 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground mr-1", children: [
            "#",
            f.idx
          ] }),
          f.text
        ] })
      ] }, f.idx)) }),
      rawText && /* @__PURE__ */ jsxs("details", { className: "text-xs", children: [
        /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-muted-foreground", children: [
          "Сырая диктовка (",
          rawText.length,
          " симв.)"
        ] }),
        /* @__PURE__ */ jsx("pre", { className: "mt-2 whitespace-pre-wrap font-sans", children: rawText })
      ] })
    ] })
  ] });
}
const PANEL_KEYS = [
  { key: "gpt5", default: true },
  { key: "claude-opus", default: true },
  { key: "gemini-pro", default: true },
  { key: "glm-5", default: true },
  { key: "kimi-k2", default: true },
  { key: "qwen-max", default: false },
  // временно off: Alibaba upstream часто отдаёт 429 в общем пуле OpenRouter
  { key: "pplx-sonar-pro", default: true },
  { key: "venice-uncensored", default: true },
  { key: "grok-fast", default: true },
  { key: "deepseek-v4-pro", default: true },
  { key: "mimo-v25-pro", default: true },
  { key: "mistral-large", default: false }
];
const ARBITER_KEYS = ["claude-opus", "gpt5", "gemini-pro"];
const REWRITER_KEYS = ["claude-opus", "claude-sonnet", "gpt5", "grok-fast"];
const SEVERITY_COLOR = {
  high: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
};
const STATUS_LABEL = {
  consensus: "Консенсус",
  majority: "Большинство",
  single: "Одна модель",
  disputed: "Спорно"
};
function AdminArticleOrchestrator() {
  var _a;
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast: toast$1 } = useToast();
  const location = useLocation();
  const incoming = location.state || {};
  const { byId: liveModelsById } = useOpenRouterModels();
  const { byId: veniceModelsById } = useVeniceModels();
  const resolvedModels = useMemo(
    () => CURATED_MODELS.map((c) => resolveCuratedModel(c, liveModelsById, veniceModelsById)),
    [liveModelsById, veniceModelsById]
  );
  const PANEL = useMemo(
    () => PANEL_KEYS.map(({ key, default: def }) => {
      const r = resolvedModels.find((m) => m.key === key);
      return { id: (r == null ? void 0 : r.id) ?? key, label: (r == null ? void 0 : r.label) ?? key, default: def };
    }),
    [resolvedModels]
  );
  const ARBITERS = useMemo(
    () => ARBITER_KEYS.map((key) => {
      const r = resolvedModels.find((m) => m.key === key);
      return { id: (r == null ? void 0 : r.id) ?? key, label: (r == null ? void 0 : r.label) ?? key };
    }),
    [resolvedModels]
  );
  const REWRITERS = useMemo(
    () => REWRITER_KEYS.map((key) => {
      const r = resolvedModels.find((m) => m.key === key);
      return { id: (r == null ? void 0 : r.id) ?? key, label: (r == null ? void 0 : r.label) ?? key };
    }),
    [resolvedModels]
  );
  const [title, setTitle] = useState(incoming.title ?? "");
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [text, setText] = useState(incoming.text ?? "");
  const [models, setModels] = useState(() => PANEL.filter((m) => m.default).map((m) => m.id));
  const [arbiter, setArbiter] = useState(() => {
    var _a2;
    return ((_a2 = ARBITERS[0]) == null ? void 0 : _a2.id) ?? "";
  });
  const [rewriter, setRewriter] = useState(() => {
    var _a2;
    return ((_a2 = REWRITERS[0]) == null ? void 0 : _a2.id) ?? "";
  });
  useEffect(() => {
    if (reviewing) return;
    const allKeys = Array.from(/* @__PURE__ */ new Set([...PANEL_KEYS.map((p) => p.key), ...ARBITER_KEYS, ...REWRITER_KEYS]));
    const keyToId = new Map(allKeys.map((key) => {
      const r = resolvedModels.find((m) => m.key === key);
      return [key, (r == null ? void 0 : r.id) ?? key];
    }));
    setModels((cur) => {
      const next = cur.map((m) => keyToId.get(m) ?? m);
      return next.some((v, i) => v !== cur[i]) ? next : cur;
    });
    setArbiter((cur) => keyToId.get(cur) ?? cur);
    setRewriter((cur) => keyToId.get(cur) ?? cur);
  }, [resolvedModels]);
  const [previewOpen, setPreviewOpen] = useState(false);
  useState(false);
  useState(false);
  useRef(null);
  useRef([]);
  const [reviews, setReviews] = useState([]);
  const [reviewing, setReviewing] = useState(false);
  const [pending, setPending] = useState(/* @__PURE__ */ new Set());
  const [progress, setProgress] = useState({});
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!reviewing) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [reviewing]);
  const [consolidated, setConsolidated] = useState(null);
  const [consolidating, setConsolidating] = useState(false);
  const [accepted, setAccepted] = useState(/* @__PURE__ */ new Set());
  const [directAccepted, setDirectAccepted] = useState(/* @__PURE__ */ new Map());
  const [editedSuggested, setEditedSuggested] = useState(/* @__PURE__ */ new Map());
  const [editingKey, setEditingKey] = useState(null);
  const [finalText, setFinalText] = useState("");
  const [appliedEdits, setAppliedEdits] = useState([]);
  const [reviewRound, setReviewRound] = useState(1);
  const [rewriting, setRewriting] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [formatProgress, setFormatProgress] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [seoMeta, setSeoMeta] = useState(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const seoCategoryLabels = {
    general: "Общее",
    urology: "Урология",
    andrology: "Андрология",
    surgery: "Хирургия",
    endocrinology: "Эндокринология",
    psychology: "Психология",
    sexology: "Сексология",
    genetics: "Генетика"
  };
  async function optimizeSeo() {
    if (!finalText.trim()) return;
    setSeoLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-article-meta", {
        body: { text: finalText, filename: title || "article" }
      });
      if (error) throw error;
      if (data == null ? void 0 : data.error) throw new Error(data.error);
      setSeoMeta({
        title: String(data.title || title || ""),
        slug: String(data.slug || ""),
        excerpt: String(data.excerpt || ""),
        keywords: Array.isArray(data.keywords) ? data.keywords.map((k) => String(k)) : [],
        category: seoCategoryLabels[data.category] ? String(data.category) : "general",
        age_group: data.age_group === "adults" ? "adults" : "children"
      });
      toast.success("SEO готов — проверьте и правьте перед публикацией");
    } catch (e) {
      toast.error("SEO не получен", { description: (e == null ? void 0 : e.message) || String(e) });
    } finally {
      setSeoLoading(false);
    }
  }
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerItems, setPickerItems] = useState([]);
  const [pickerQuery, setPickerQuery] = useState("");
  const [existingRef, setExistingRef] = useState(null);
  async function openRecheckPicker() {
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      const [d, b, r] = await Promise.all([
        supabase.from("disease_articles").select("id,title,updated_at,is_published").eq("is_published", true).order("updated_at", { ascending: false }).limit(200),
        supabase.from("blog_posts").select("id,title,updated_at,is_published").eq("is_published", true).order("updated_at", { ascending: false }).limit(200),
        supabase.from("research_articles").select("id,title,updated_at,is_published").eq("is_published", true).order("updated_at", { ascending: false }).limit(200)
      ]);
      const items = [
        ...(d.data ?? []).map((x) => ({ id: x.id, kind: "disease_articles", title: x.title, updated_at: x.updated_at })),
        ...(b.data ?? []).map((x) => ({ id: x.id, kind: "blog_posts", title: x.title, updated_at: x.updated_at })),
        ...(r.data ?? []).map((x) => ({ id: x.id, kind: "research_articles", title: x.title, updated_at: x.updated_at }))
      ];
      setPickerItems(items);
    } catch (e) {
      toast.error("Не удалось загрузить список", { description: (e == null ? void 0 : e.message) || String(e) });
    } finally {
      setPickerLoading(false);
    }
  }
  async function loadForRecheck(item) {
    try {
      const field = item.kind === "disease_articles" ? "article_content" : "content";
      const { data, error } = await supabase.from(item.kind).select(`title, ${field}`).eq("id", item.id).maybeSingle();
      if (error) throw error;
      const html = (data == null ? void 0 : data[field]) || "";
      const md = /<[a-z][\s\S]*>/i.test(html) ? htmlToMarkdown(html) : html;
      setTitle((data == null ? void 0 : data.title) || item.title);
      setText(md);
      setExistingRef({ id: item.id, kind: item.kind });
      setPickerOpen(false);
      setReviews([]);
      setConsolidated(null);
      setAccepted(/* @__PURE__ */ new Set());
      setDirectAccepted(/* @__PURE__ */ new Map());
      setEditedSuggested(/* @__PURE__ */ new Map());
      setFinalText("");
      setAppliedEdits([]);
      setReviewRound(1);
      toast.success("Статья загружена", { description: "Можно запускать ревью" });
    } catch (e) {
      toast.error("Ошибка загрузки", { description: (e == null ? void 0 : e.message) || String(e) });
    }
  }
  useEffect(() => {
    if (!incoming.recheck) return;
    loadForRecheck({
      id: incoming.recheck.id,
      kind: incoming.recheck.kind,
      title: incoming.recheck.title || "",
      updated_at: ""
    });
  }, []);
  const DRAFT_KEY = "orchestrator:draft:v1";
  const draftLoadedRef = useRef(false);
  const draftHydratingRef = useRef(true);
  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    if (incoming.text || incoming.recheck) {
      draftHydratingRef.current = false;
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        draftHydratingRef.current = false;
        return;
      }
      const d = JSON.parse(raw);
      if (!(d == null ? void 0 : d.savedAt) || Date.now() - d.savedAt > 7 * 24 * 3600 * 1e3) {
        draftHydratingRef.current = false;
        return;
      }
      if (typeof d.title === "string") setTitle(d.title);
      if (typeof d.text === "string") setText(d.text);
      if (Array.isArray(d.models)) setModels(d.models);
      if (typeof d.arbiter === "string" && d.arbiter) setArbiter(d.arbiter);
      if (typeof d.rewriter === "string" && d.rewriter) setRewriter(d.rewriter);
      if (Array.isArray(d.reviews)) setReviews(d.reviews);
      if (d.progress && typeof d.progress === "object") setProgress(d.progress);
      if (d.consolidated) setConsolidated(d.consolidated);
      if (Array.isArray(d.accepted)) setAccepted(new Set(d.accepted));
      if (Array.isArray(d.directAccepted)) setDirectAccepted(new Map(d.directAccepted));
      if (Array.isArray(d.editedSuggested)) setEditedSuggested(new Map(d.editedSuggested));
      if (typeof d.finalText === "string") setFinalText(d.finalText);
      if (Array.isArray(d.appliedEdits)) setAppliedEdits(d.appliedEdits);
      if (typeof d.reviewRound === "number") setReviewRound(d.reviewRound);
      if (d.translation) setTranslation(d.translation);
      if (d.seoMeta) setSeoMeta(d.seoMeta);
      const when = new Date(d.savedAt);
      toast.success("Черновик восстановлен", {
        description: `Автосохранение от ${when.toLocaleString("ru-RU")}. Кнопка «Сбросить черновик» в шапке.`
      });
    } catch (e) {
      console.warn("[orchestrator] draft restore failed", e);
    } finally {
      setTimeout(() => {
        draftHydratingRef.current = false;
      }, 300);
    }
  }, []);
  useEffect(() => {
    if (draftHydratingRef.current) return;
    const timer = setTimeout(() => {
      try {
        const bundle = {
          savedAt: Date.now(),
          title,
          text,
          models,
          arbiter,
          rewriter,
          reviews,
          progress,
          consolidated,
          accepted: Array.from(accepted),
          directAccepted: Array.from(directAccepted.entries()),
          editedSuggested: Array.from(editedSuggested.entries()),
          finalText,
          appliedEdits,
          reviewRound,
          translation,
          seoMeta
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(bundle));
      } catch (e) {
        console.warn("[orchestrator] draft save failed", e);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [title, text, models, arbiter, rewriter, reviews, progress, consolidated, accepted, directAccepted, editedSuggested, finalText, appliedEdits, reviewRound, translation, seoMeta]);
  function resetDraft() {
    if (!confirm("Сбросить локальный черновик оркестратора? Текущее состояние формы очистится.")) return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
    }
    setTitle("");
    setText("");
    setReviews([]);
    setProgress({});
    setConsolidated(null);
    setAccepted(/* @__PURE__ */ new Set());
    setDirectAccepted(/* @__PURE__ */ new Map());
    setEditedSuggested(/* @__PURE__ */ new Map());
    setFinalText("");
    setAppliedEdits([]);
    setReviewRound(1);
    setTranslation(null);
    setSeoMeta(null);
    toast.success("Черновик сброшен");
  }
  function insertGalleryMarker(target) {
    const caption = window.prompt("Подпись к галерее (можно пустую):", "");
    if (caption === null) return;
    const marker = `

[[GALLERY: caption="${(caption || "").replace(/"/g, "'")}"]]

`;
    {
      setFinalText((cur) => (cur || "") + marker);
    }
    toast.success("Блок галереи вставлен", {
      description: "Файлы можно прикрепить на странице «Разместить»"
    });
  }
  async function translateFinal() {
    if (!finalText.trim()) return;
    setTranslating(true);
    setTranslation(null);
    try {
      const { data, error } = await supabase.functions.invoke("translate-content", {
        body: { text: finalText, title, description: "" }
      });
      if (error) throw error;
      if (!(data == null ? void 0 : data.translation)) throw new Error("Empty response");
      setTranslation(data.translation);
      toast.success("Перевод готов — проверьте и скопируйте поля");
    } catch (e) {
      toast.error("Перевод не удался", { description: (e == null ? void 0 : e.message) || String(e) });
    } finally {
      setTranslating(false);
    }
  }
  const successReviews = useMemo(() => reviews.filter((r) => !r.error), [reviews]);
  const getSuggested = (key, fallback) => editedSuggested.has(key) ? editedSuggested.get(key) : fallback;
  const copyToClipboard = async (value, successMessage) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.focus();
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      if (!ok) throw new Error("Копирование заблокировано браузером");
      toast.success(successMessage);
    }
  };
  const setSuggested = (key, val) => {
    setEditedSuggested((cur) => {
      const n = new Map(cur);
      n.set(key, val);
      return n;
    });
  };
  const toggleDirect = (model, i, edit) => {
    const key = `${model}::${i}`;
    setDirectAccepted((cur) => {
      const n = new Map(cur);
      if (n.has(key)) {
        n.delete(key);
      } else {
        n.set(key, { ...edit, suggested: getSuggested(key, edit.suggested) });
      }
      return n;
    });
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin mx-auto" }) });
  if (!user || !isAdmin) {
    navigate("/auth");
    return null;
  }
  const toggleModel = (id) => {
    setModels((cur) => cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id]);
  };
  const markUnfinishedModelsAsError = (message, onlyModel) => {
    setProgress((cur) => Object.fromEntries(
      Object.entries(cur).map(([modelId, p]) => {
        if (p.status === "done" || p.status === "error") return [modelId, p];
        return [modelId, { ...p, status: "error", ms: p.startedAt ? Date.now() - p.startedAt : p.ms, error: message }];
      })
    ));
  };
  async function runReview(opts) {
    const reReview = !!(opts == null ? void 0 : opts.reReview);
    const baseText = reReview ? finalText.trim() || text : text;
    if (baseText.trim().length < 100) {
      toast$1({ title: "Статья слишком короткая", description: "Минимум 100 символов.", variant: "destructive" });
      return;
    }
    if (!models.length) {
      toast$1({ title: "Выберите хотя бы одну модель", variant: "destructive" });
      return;
    }
    if (reReview && finalText.trim() && baseText !== text) {
      setText(baseText);
    }
    setReviews([]);
    setConsolidated(null);
    setAccepted(/* @__PURE__ */ new Set());
    setDirectAccepted(/* @__PURE__ */ new Map());
    setEditedSuggested(/* @__PURE__ */ new Map());
    if (!reReview) {
      setAppliedEdits([]);
      setReviewRound(1);
      setFinalText("");
    } else {
      setReviewRound((r) => r + 1);
    }
    setReviewing(true);
    setPending(new Set(models));
    setProgress(Object.fromEntries(models.map((m) => [m, { status: "queued" }])));
    try {
      let streamDone = false;
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/orchestrate-article`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session == null ? void 0 : session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "review",
          title,
          text: baseText,
          models,
          applied_edits: reReview ? appliedEdits : []
        })
      });
      if (!resp.ok || !resp.body) {
        const t = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status}: ${t.slice(0, 200)}`);
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const lines = ev.split("\n");
          let evType = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) evType = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          if (evType === "model_start") {
            try {
              const r = JSON.parse(data);
              setProgress((cur) => ({ ...cur, [r.model]: { status: "running", startedAt: r.started_at } }));
            } catch {
            }
          } else if (evType === "model_done") {
            try {
              const r = JSON.parse(data);
              setReviews((cur) => [...cur, r]);
              setPending((cur) => {
                const n = new Set(cur);
                n.delete(r.model);
                return n;
              });
              setProgress((cur) => {
                var _a2, _b;
                return {
                  ...cur,
                  [r.model]: {
                    status: r.error ? "error" : "done",
                    startedAt: (_a2 = cur[r.model]) == null ? void 0 : _a2.startedAt,
                    ms: r.ms,
                    edits: ((_b = r.edits) == null ? void 0 : _b.length) ?? 0,
                    error: r.error
                  }
                };
              });
            } catch {
            }
          } else if (evType === "done") {
            streamDone = true;
            playCompletionChime();
          }
        }
      }
      if (!streamDone) throw new Error("Поток оркестратора закрылся до завершения. Незавершённые модели помечены ошибкой.");
    } catch (e) {
      const message = (e == null ? void 0 : e.message) || String(e);
      markUnfinishedModelsAsError(message);
      toast$1({ title: "Ошибка ревью", description: message, variant: "destructive" });
    } finally {
      setReviewing(false);
      setPending(/* @__PURE__ */ new Set());
    }
  }
  async function runReviewOne(model) {
    const baseText = (finalText.trim() || text).trim();
    if (baseText.length < 100) {
      toast$1({ title: "Статья слишком короткая", description: "Минимум 100 символов.", variant: "destructive" });
      return;
    }
    setReviews((cur) => cur.filter((r) => r.model !== model));
    setDirectAccepted((cur) => {
      const n = new Map(cur);
      for (const k of Array.from(n.keys())) if (k.startsWith(`${model}::`)) n.delete(k);
      return n;
    });
    setEditedSuggested((cur) => {
      const n = new Map(cur);
      for (const k of Array.from(n.keys())) if (k.startsWith(`${model}::`)) n.delete(k);
      return n;
    });
    setPending((cur) => {
      const n = new Set(cur);
      n.add(model);
      return n;
    });
    setProgress((cur) => ({ ...cur, [model]: { status: "queued" } }));
    setReviewing(true);
    try {
      let streamDone = false;
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/orchestrate-article`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session == null ? void 0 : session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "review",
          title,
          text: baseText,
          models: [model],
          applied_edits: reviewRound > 1 ? appliedEdits : []
        })
      });
      if (!resp.ok || !resp.body) {
        const t = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status}: ${t.slice(0, 200)}`);
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const lines = ev.split("\n");
          let evType = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) evType = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!data) continue;
          if (evType === "model_start") {
            try {
              const r = JSON.parse(data);
              setProgress((cur) => ({ ...cur, [r.model]: { status: "running", startedAt: r.started_at } }));
            } catch {
            }
          } else if (evType === "model_done") {
            try {
              const r = JSON.parse(data);
              setReviews((cur) => [...cur.filter((x) => x.model !== r.model), r]);
              setPending((cur) => {
                const n = new Set(cur);
                n.delete(r.model);
                return n;
              });
              setProgress((cur) => {
                var _a2, _b;
                return {
                  ...cur,
                  [r.model]: {
                    status: r.error ? "error" : "done",
                    startedAt: (_a2 = cur[r.model]) == null ? void 0 : _a2.startedAt,
                    ms: r.ms,
                    edits: ((_b = r.edits) == null ? void 0 : _b.length) ?? 0,
                    error: r.error
                  }
                };
              });
            } catch {
            }
          } else if (evType === "done") {
            streamDone = true;
            playCompletionChime();
          }
        }
      }
      if (!streamDone) throw new Error("Поток оркестратора закрылся до завершения. Модель помечена ошибкой.");
    } catch (e) {
      const message = (e == null ? void 0 : e.message) || String(e);
      toast$1({ title: `Ошибка ревью (${model})`, description: message, variant: "destructive" });
      setProgress((cur) => ({ ...cur, [model]: { ...cur[model], status: "error", error: message } }));
    } finally {
      setPending((cur) => {
        const n = new Set(cur);
        n.delete(model);
        return n;
      });
      setPending((cur) => {
        if (cur.size === 0) setReviewing(false);
        return cur;
      });
    }
  }
  async function runConsolidation() {
    const valid = reviews.filter((r) => !r.error && (r.edits.length || r.free_review));
    if (!valid.length) {
      toast$1({ title: "Нет валидных рецензий", variant: "destructive" });
      return;
    }
    setConsolidating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/orchestrate-article`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session == null ? void 0 : session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "consolidate",
          text,
          reviews: valid.map(({ model, free_review, edits }) => ({ model, free_review, edits })),
          arbiter
        })
      });
      const j = await resp.json();
      if (!resp.ok || (j == null ? void 0 : j.error)) throw new Error((j == null ? void 0 : j.error) || `HTTP ${resp.status}`);
      const cons = j.consolidated;
      setConsolidated(cons);
      const auto = /* @__PURE__ */ new Set();
      cons.edits.forEach((e, i) => {
        if ((e.status === "consensus" || e.status === "majority") && e.severity !== "low") auto.add(i);
      });
      setAccepted(auto);
      playCompletionChime();
    } catch (e) {
      toast$1({ title: "Ошибка консолидации", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setConsolidating(false);
    }
  }
  async function rewriteWithVoice(editsArg) {
    const editsAccepted = editsArg ?? (consolidated ? consolidated.edits.map((e, i) => ({ ...e, suggested: getSuggested(`cons::${i}`, e.suggested), _i: i })).filter((e) => accepted.has(e._i)).map(({ _i, ...rest }) => rest) : []);
    if (!editsAccepted.length) {
      toast$1({ title: "Не выбраны правки", variant: "destructive" });
      return;
    }
    setRewriting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/orchestrate-article`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session == null ? void 0 : session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "rewrite", text, edits: editsAccepted, rewriter })
      });
      const j = await resp.json();
      if (!resp.ok || (j == null ? void 0 : j.error)) throw new Error((j == null ? void 0 : j.error) || `HTTP ${resp.status}`);
      setFinalText(String(j.rewritten || ""));
      setAppliedEdits((cur) => [...cur, ...editsAccepted]);
      toast$1({ title: "Статья переписана", description: `Применено правок: ${j.applied}. Голос автора сохранён. Можно запустить повторное ревью.` });
      playCompletionChime();
    } catch (e) {
      toast$1({ title: "Ошибка переписывания", description: (e == null ? void 0 : e.message) || String(e), variant: "destructive" });
    } finally {
      setRewriting(false);
    }
  }
  const acceptedCount = accepted.size;
  async function testClaudeConnection() {
    setTestingConn(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/test-claude-connection`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session == null ? void 0 : session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error((j == null ? void 0 : j.error) || `HTTP ${resp.status}`);
      toast.success("Связь с Claude в порядке", { description: (j == null ? void 0 : j.model) || "ok" });
    } catch (e) {
      toast.error("Нет связи с Claude", { description: (e == null ? void 0 : e.message) || String(e) });
    } finally {
      setTestingConn(false);
    }
  }
  async function formatFinal() {
    if (!finalText.trim()) return;
    setFormatting(true);
    setFormatProgress(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`https://bpbwkizvvythqotcyfii.supabase.co/functions/v1/format-disease-article`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${session == null ? void 0 : session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalText })
      });
      if (!resp.ok || !resp.body) {
        const t = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status}: ${t.slice(0, 200)}`);
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "progress" && evt.stage === "chunk") {
              setFormatProgress({ index: evt.index, total: evt.total });
            } else if (evt.type === "result") {
              result = evt.formatted || "";
            } else if (evt.type === "error") {
              throw new Error(evt.error || "format error");
            }
          } catch {
          }
        }
      }
      if (result) {
        setFinalText(result);
        toast.success("Форматирование завершено", { description: "Текст обновлён в итоговой статье" });
      } else {
        throw new Error("Пустой ответ форматера");
      }
    } catch (e) {
      toast.error("Ошибка форматирования", { description: (e == null ? void 0 : e.message) || String(e) });
    } finally {
      setFormatting(false);
      setFormatProgress(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-6 max-w-7xl", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      " Назад в админку"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-7 h-7 text-amber-500" }),
          " Оркестратор статей"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Параллельное ревью статьи несколькими ИИ-моделями, голосование и арбитраж, применение правок." })
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "outline",
          onClick: () => {
            const next = !soundOn;
            setSoundOn(next);
            setSoundEnabled(next);
          },
          title: "Звук по завершении этапов",
          className: "shrink-0",
          children: soundOn ? /* @__PURE__ */ jsx(Volume2, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(VolumeX, { className: "w-4 h-4" })
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "outline",
          onClick: resetDraft,
          title: "Очистить сохранённый локальный черновик оркестратора",
          className: "shrink-0",
          children: "Сбросить черновик"
        }
      ),
      /* @__PURE__ */ jsx(Button, { asChild: true, size: "sm", variant: "ghost", className: "shrink-0", children: /* @__PURE__ */ jsx("a", { href: "/admin/orchestrator-metrics", target: "_blank", rel: "noreferrer", children: "Метрики" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between gap-2 space-y-0", children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "1. Статья" }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: openRecheckPicker, className: "gap-1", children: [
            /* @__PURE__ */ jsx(FileSearch, { className: "w-4 h-4" }),
            " Перепроверить опубликованное"
          ] })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
          existingRef && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3" }),
            "Режим перепроверки опубликованной статьи · при «Разместить» обновится существующая запись",
            /* @__PURE__ */ jsx("button", { className: "ml-auto underline", onClick: () => setExistingRef(null), children: "отменить" })
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              placeholder: "Заголовок (опционально)",
              value: title,
              onChange: (e) => setTitle(e.target.value)
            }
          ),
          /* @__PURE__ */ jsx(
            Textarea,
            {
              placeholder: "Вставьте или надиктуйте текст статьи…",
              value: text,
              onChange: (e) => setText(e.target.value),
              className: "min-h-[360px] font-serif text-[15px] leading-relaxed"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "Символов: ",
            text.length.toLocaleString("ru-RU"),
            " · Слов: ",
            text.trim() ? text.trim().split(/\s+/).length.toLocaleString("ru-RU") : 0
          ] }),
          /* @__PURE__ */ jsx(
            DictationStudio,
            {
              initialTitle: title,
              onAssembled: (cleaned) => {
                setText(cleaned);
              }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "2. Панель моделей" }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: PANEL.map((m) => /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 p-2 rounded-md border border-border hover:bg-accent/40 cursor-pointer", children: [
            /* @__PURE__ */ jsx(Checkbox, { checked: models.includes(m.id), onCheckedChange: () => toggleModel(m.id) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium truncate", children: m.label }),
              /* @__PURE__ */ jsx("div", { className: "text-[11px] font-mono text-muted-foreground truncate", children: m.id })
            ] }),
            pending.has(m.id) && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-amber-500 shrink-0" })
          ] }, m.id)) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium mb-1", children: "Арбитр (для консолидации мнений)" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                className: "w-full h-9 px-3 rounded-md border border-input bg-background text-sm",
                value: arbiter,
                onChange: (e) => setArbiter(e.target.value),
                children: ARBITERS.map((a) => /* @__PURE__ */ jsx("option", { value: a.id, children: a.label }, a.id))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium mb-1", children: "Переписчик (создаёт финальную статью с вашим голосом)" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                className: "w-full h-9 px-3 rounded-md border border-input bg-background text-sm",
                value: rewriter,
                onChange: (e) => setRewriter(e.target.value),
                children: REWRITERS.map((a) => /* @__PURE__ */ jsx("option", { value: a.id, children: a.label }, a.id))
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => runReview(),
              disabled: reviewing || !text.trim() || !models.length,
              className: "w-full",
              size: "lg",
              children: reviewing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                " Идёт ревью (",
                models.length - pending.size,
                "/",
                models.length,
                ")…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 mr-2" }),
                " Запустить ревью"
              ] })
            }
          )
        ] })
      ] })
    ] }),
    Object.keys(progress).length > 0 && /* @__PURE__ */ jsxs(Card, { className: "mt-6", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Прогресс ревью (",
          Object.values(progress).filter((p) => p.status === "done" || p.status === "error").length,
          "/",
          Object.keys(progress).length,
          ")"
        ] }),
        reviewing && /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-amber-500" })
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: Object.entries(progress).map(([modelId, p]) => {
          var _a2;
          const label = ((_a2 = PANEL.find((m) => m.id === modelId)) == null ? void 0 : _a2.label) || modelId;
          const now = Date.now();
          const elapsedMs = p.status === "running" && p.startedAt ? now - p.startedAt : p.ms ?? 0;
          const secs = (elapsedMs / 1e3).toFixed(1);
          const statusBadge = {
            queued: /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-muted-foreground", children: "В очереди" }),
            running: /* @__PURE__ */ jsxs(Badge, { className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20", children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 mr-1 animate-spin inline" }),
              "Анализирует"
            ] }),
            done: /* @__PURE__ */ jsx(Badge, { className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20", children: "Готово" }),
            error: /* @__PURE__ */ jsx(Badge, { variant: "destructive", children: "Ошибка" })
          }[p.status];
          const isPending = pending.has(modelId) || p.status === "running";
          return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-accent/30 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium truncate", children: label }),
              p.error && /* @__PURE__ */ jsx("div", { className: "text-xs text-destructive truncate", title: p.error, children: p.error })
            ] }),
            (p.status === "done" || p.status === "running") && /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono text-muted-foreground tabular-nums w-14 text-right", children: [
              secs,
              "s"
            ] }),
            p.status === "done" && typeof p.edits === "number" && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground w-20 text-right", children: [
              "правок: ",
              /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: p.edits })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-32 flex justify-end", children: statusBadge }),
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "sm",
                variant: "ghost",
                className: "h-7 px-2",
                disabled: isPending,
                onClick: () => runReviewOne(modelId),
                title: "Повторить только эту модель",
                children: isPending ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(RotateCw, { className: "w-3.5 h-3.5" })
              }
            )
          ] }, modelId);
        }) }),
        reviewing && /* @__PURE__ */ jsx("div", { className: "mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "h-full bg-amber-500 transition-all duration-300",
            style: {
              width: `${Object.values(progress).filter((p) => p.status === "done" || p.status === "error").length / Object.keys(progress).length * 100}%`
            }
          }
        ) })
      ] })
    ] }),
    reviews.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "mt-6", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs(CardTitle, { children: [
          "3. Мнения моделей (",
          reviews.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => {
                const fresh = Array.from(directAccepted.entries()).map(([key, e]) => ({
                  ...e,
                  suggested: getSuggested(key, e.suggested)
                }));
                rewriteWithVoice(fresh);
              },
              disabled: !directAccepted.size || rewriting,
              variant: "default",
              children: rewriting ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                " Переписываю…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(FileCheck2, { className: "w-4 h-4 mr-2" }),
                " Переписать с принятыми (",
                directAccepted.size,
                ")"
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => runReview({ reReview: true }),
              disabled: reviewing || !finalText.trim() && !appliedEdits.length && !directAccepted.size && !accepted.size,
              variant: "outline",
              title: "Передать моделям уже переписанную статью и исключить принятые правки",
              children: reviewing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                " Идёт…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(RotateCw, { className: "w-4 h-4 mr-2" }),
                " Повторное ревью ",
                reviewRound > 1 ? `(раунд ${reviewRound + 1})` : "(с правками)"
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: runConsolidation,
              disabled: consolidating || successReviews.length < 1,
              variant: "outline",
              children: consolidating ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                " Арбитр работает…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(GitMerge, { className: "w-4 h-4 mr-2" }),
                " Сформировать сводку"
              ] })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Tabs, { defaultValue: (_a = reviews[0]) == null ? void 0 : _a.model, children: [
        /* @__PURE__ */ jsx(TabsList, { className: "flex flex-wrap h-auto", children: reviews.map((r) => /* @__PURE__ */ jsxs(TabsTrigger, { value: r.model, className: "text-xs", children: [
          r.model.split("/")[1] || r.model,
          r.error ? /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "ml-1 text-[10px]", children: "ошибка" }) : /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-1 text-[10px]", children: r.edits.length })
        ] }, r.model)) }),
        reviews.map((r) => /* @__PURE__ */ jsxs(TabsContent, { value: r.model, className: "space-y-3 mt-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
              r.model,
              typeof r.ms === "number" && !r.error ? ` · ${(r.ms / 1e3).toFixed(1)}s` : ""
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "sm",
                variant: "outline",
                disabled: pending.has(r.model),
                onClick: () => runReviewOne(r.model),
                title: "Перезапустить ревью только этой модели",
                children: pending.has(r.model) ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 mr-1.5 animate-spin" }),
                  " Идёт…"
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(RotateCw, { className: "w-3.5 h-3.5 mr-1.5" }),
                  " Повторить"
                ] })
              }
            )
          ] }),
          r.error ? /* @__PURE__ */ jsx("div", { className: "p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive", children: r.error }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 rounded-md bg-muted/50 border border-border text-sm whitespace-pre-wrap", children: r.free_review || /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "(нет общего ревью)" }) }),
            r.edits.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Правок не предложено." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: r.edits.map((e, i) => {
              const key = `${r.model}::${i}`;
              const isAcc = directAccepted.has(key);
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `p-3 rounded-md border text-sm space-y-2 transition-colors ${isAcc ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                      /* @__PURE__ */ jsx(Badge, { variant: "outline", children: e.category }),
                      e.severity && /* @__PURE__ */ jsx(Badge, { className: SEVERITY_COLOR[e.severity] || "", variant: "outline", children: e.severity }),
                      /* @__PURE__ */ jsxs("div", { className: "ml-auto flex gap-1", children: [
                        /* @__PURE__ */ jsx(
                          Button,
                          {
                            size: "sm",
                            variant: "ghost",
                            onClick: () => setEditingKey(editingKey === key ? null : key),
                            title: "Править текст правки вручную",
                            children: /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" })
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          Button,
                          {
                            size: "sm",
                            variant: isAcc ? "default" : "outline",
                            onClick: () => toggleDirect(r.model, i, e),
                            className: isAcc ? "bg-emerald-600 hover:bg-emerald-700" : "",
                            children: isAcc ? "✓ Принято" : "Принять"
                          }
                        )
                      ] })
                    ] }),
                    e.original && /* @__PURE__ */ jsxs("div", { className: "text-xs italic text-muted-foreground", children: [
                      "«",
                      e.original,
                      "»"
                    ] }),
                    editingKey === key ? /* @__PURE__ */ jsx(
                      Textarea,
                      {
                        value: getSuggested(key, e.suggested),
                        onChange: (ev) => setSuggested(key, ev.target.value),
                        onClick: (ev) => ev.stopPropagation(),
                        onMouseDown: (ev) => ev.stopPropagation(),
                        autoFocus: true,
                        className: "min-h-[80px] text-sm font-serif leading-relaxed border-amber-500/50 focus-visible:ring-amber-500/40"
                      }
                    ) : /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: "cursor-text rounded px-1 -mx-1 hover:bg-amber-500/10",
                        onClick: () => setEditingKey(key),
                        title: "Нажмите, чтобы править",
                        children: [
                          /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold", children: "→ " }),
                          getSuggested(key, e.suggested),
                          editedSuggested.has(key) && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-2 text-[10px] bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400", children: "отредактировано" })
                        ]
                      }
                    ),
                    e.rationale && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: e.rationale })
                  ]
                },
                i
              );
            }) })
          ] })
        ] }, r.model))
      ] }) })
    ] }),
    consolidated && /* @__PURE__ */ jsxs(Card, { className: "mt-6 border-amber-500/40", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(GitMerge, { className: "w-5 h-5 text-amber-500" }),
        " 4. Консолидированное мнение арбитра"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "p-3 rounded-md bg-amber-500/5 border border-amber-500/30 text-sm whitespace-pre-wrap", children: consolidated.summary }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold", children: [
              "Правки (",
              consolidated.edits.length,
              "). Принято: ",
              acceptedCount
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => setAccepted(new Set(consolidated.edits.map((_, i) => i))), children: "Все" }),
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => setAccepted(/* @__PURE__ */ new Set()), children: "Снять все" })
            ] })
          ] }),
          consolidated.edits.map((e, i) => {
            var _a2;
            const isAccepted = accepted.has(i);
            let context = null;
            if (e.original && text.includes(e.original)) {
              const idx = text.indexOf(e.original);
              const before = text.slice(Math.max(0, idx - 120), idx);
              const after = text.slice(idx + e.original.length, idx + e.original.length + 120);
              context = { before, after };
            }
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: `p-3 rounded-md border transition-colors ${isAccepted ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"}`,
                children: /* @__PURE__ */ jsxs("label", { className: "flex gap-3 cursor-pointer", children: [
                  /* @__PURE__ */ jsx(
                    Checkbox,
                    {
                      checked: isAccepted,
                      onCheckedChange: () => {
                        setAccepted((cur) => {
                          const n = new Set(cur);
                          n.has(i) ? n.delete(i) : n.add(i);
                          return n;
                        });
                      },
                      className: "mt-0.5"
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 space-y-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [
                      /* @__PURE__ */ jsx(Badge, { variant: "outline", children: e.category }),
                      e.severity && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: SEVERITY_COLOR[e.severity] || "", children: e.severity }),
                      e.status && /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: STATUS_LABEL[e.status] || e.status }),
                      ((_a2 = e.supporting_models) == null ? void 0 : _a2.length) ? /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: e.supporting_models.map((m) => m.split("/")[1] || m).join(", ") }) : null
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-red-500/30 bg-red-500/5 p-2 text-xs", children: [
                        /* @__PURE__ */ jsx("div", { className: "font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1", children: "− До" }),
                        e.original ? /* @__PURE__ */ jsxs("div", { className: "font-serif leading-relaxed", children: [
                          context && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                            "…",
                            context.before
                          ] }),
                          /* @__PURE__ */ jsx("span", { className: "bg-red-500/20 line-through decoration-red-500/60 px-0.5 rounded", children: e.original }),
                          context && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                            context.after,
                            "…"
                          ] })
                        ] }) : /* @__PURE__ */ jsx("div", { className: "italic text-muted-foreground", children: "(глобальная правка — фрагмент в тексте не указан)" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 text-xs", children: [
                        /* @__PURE__ */ jsxs("div", { className: "font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center justify-between gap-1", children: [
                          /* @__PURE__ */ jsx("span", { children: "+ После" }),
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: (ev) => {
                                ev.preventDefault();
                                setEditingKey(editingKey === `cons::${i}` ? null : `cons::${i}`);
                              },
                              className: "text-[10px] opacity-70 hover:opacity-100 inline-flex items-center gap-1",
                              title: "Править вручную",
                              children: [
                                /* @__PURE__ */ jsx(Pencil, { className: "w-3 h-3" }),
                                " править"
                              ]
                            }
                          )
                        ] }),
                        editingKey === `cons::${i}` ? /* @__PURE__ */ jsx(
                          Textarea,
                          {
                            value: getSuggested(`cons::${i}`, e.suggested),
                            onChange: (ev) => setSuggested(`cons::${i}`, ev.target.value),
                            onClick: (ev) => ev.stopPropagation(),
                            onMouseDown: (ev) => ev.stopPropagation(),
                            onKeyDown: (ev) => ev.stopPropagation(),
                            autoFocus: true,
                            className: "min-h-[90px] text-xs font-serif leading-relaxed bg-background"
                          }
                        ) : /* @__PURE__ */ jsxs(
                          "div",
                          {
                            className: "font-serif leading-relaxed cursor-text",
                            onClick: (ev) => {
                              ev.preventDefault();
                              setEditingKey(`cons::${i}`);
                            },
                            children: [
                              context && e.original && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                                "…",
                                context.before
                              ] }),
                              /* @__PURE__ */ jsx("span", { className: "bg-emerald-500/20 px-0.5 rounded", children: getSuggested(`cons::${i}`, e.suggested) }),
                              context && e.original && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                                context.after,
                                "…"
                              ] }),
                              editedSuggested.has(`cons::${i}`) && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-2 text-[10px] bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400", children: "отредактировано" })
                            ]
                          }
                        )
                      ] })
                    ] }),
                    e.rationale && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground italic border-l-2 border-muted pl-2", children: e.rationale })
                  ] })
                ] })
              },
              i
            );
          })
        ] }),
        /* @__PURE__ */ jsx(Button, { onClick: () => rewriteWithVoice(), disabled: !acceptedCount || rewriting, className: "w-full", size: "lg", children: rewriting ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
          " Переписываю с сохранением вашего голоса…"
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(FileCheck2, { className: "w-4 h-4 mr-2" }),
          " Переписать статью с моим голосом (",
          acceptedCount,
          " правок)"
        ] }) })
      ] })
    ] }),
    finalText && /* @__PURE__ */ jsxs(Card, { className: "mt-6 border-emerald-500/40", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileCheck2, { className: "w-5 h-5 text-emerald-500" }),
          " 5. Итоговая статья"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: () => copyToClipboard(finalText, "Скопировано в буфер"),
              children: [
                /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4 mr-2" }),
                " Копировать"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: testClaudeConnection,
              disabled: testingConn,
              title: "Проверить связь с Claude (формат-функция)",
              children: testingConn ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                " Тест…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Plug, { className: "w-4 h-4 mr-2" }),
                " Тест связи"
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: formatFinal,
              disabled: formatting || !finalText,
              title: "Форматирование через Claude (постранично, под сайт)",
              children: formatting ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                " Форматирую ",
                formatProgress ? `${formatProgress.index}/${formatProgress.total}` : "…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Wand2, { className: "w-4 h-4 mr-2" }),
                " Форматировать"
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: translateFinal,
              disabled: translating || !finalText,
              title: "Перевести итоговую статью на английский (Gemini)",
              children: translating ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                " Перевод…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Languages, { className: "w-4 h-4 mr-2" }),
                " Перевести EN"
              ] })
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: () => insertGalleryMarker(),
              disabled: !finalText,
              title: "Вставить блок галереи в конец итогового текста",
              children: [
                /* @__PURE__ */ jsx(ImagePlus, { className: "w-4 h-4 mr-2" }),
                " + Галерея"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: () => setPreviewOpen(true),
              disabled: !finalText,
              title: "Просмотреть как у пациентов — с форматированием и галереями",
              children: [
                /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4 mr-2" }),
                " Превью"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              size: "sm",
              variant: "outline",
              onClick: optimizeSeo,
              disabled: seoLoading || !finalText,
              title: "Подобрать заголовок, slug, ключевые слова и категорию до отправки в публикатор",
              children: seoLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }),
                " SEO…"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 mr-2" }),
                " Оптимизировать SEO"
              ] })
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "sm",
              onClick: () => {
                navigate("/admin/article-import", {
                  state: { title, text: finalText, source: "orchestrator", existingRef, seoMeta: seoMeta ?? void 0 }
                });
              },
              className: "bg-emerald-600 hover:bg-emerald-700 text-white",
              children: [
                /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
                " ",
                existingRef ? "Переопубликовать" : "Разместить"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx(ArticleDiffEditor, { original: text, value: finalText, onChange: setFinalText }),
        seoMeta && /* @__PURE__ */ jsxs("div", { className: "mt-6 border-t pt-6 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-primary" }),
              " SEO-мета для публикатора"
            ] }),
            /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => setSeoMeta(null), children: "Очистить" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Заголовок" }),
              /* @__PURE__ */ jsx(Input, { value: seoMeta.title, onChange: (e) => setSeoMeta({ ...seoMeta, title: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Slug" }),
              /* @__PURE__ */ jsx(Input, { value: seoMeta.slug, onChange: (e) => setSeoMeta({ ...seoMeta, slug: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Категория / Возраст" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "select",
                  {
                    className: "flex-1 h-9 rounded-md border bg-background px-2 text-sm",
                    value: seoMeta.category,
                    onChange: (e) => setSeoMeta({ ...seoMeta, category: e.target.value }),
                    children: Object.entries(seoCategoryLabels).map(([k, v]) => /* @__PURE__ */ jsx("option", { value: k, children: v }, k))
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    className: "h-9 rounded-md border bg-background px-2 text-sm",
                    value: seoMeta.age_group,
                    onChange: (e) => setSeoMeta({ ...seoMeta, age_group: e.target.value }),
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "children", children: "Дети" }),
                      /* @__PURE__ */ jsx("option", { value: "adults", children: "Взрослые" })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Аннотация" }),
              /* @__PURE__ */ jsx(Textarea, { rows: 2, value: seoMeta.excerpt, onChange: (e) => setSeoMeta({ ...seoMeta, excerpt: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Ключевые слова (через запятую)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: seoMeta.keywords.join(", "),
                  onChange: (e) => setSeoMeta({
                    ...seoMeta,
                    keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean)
                  })
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: seoMeta.keywords.map((k) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: k }, k)) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Эти поля будут переданы в публикатор — там их можно ещё раз править перед сохранением." })
        ] }),
        translation && /* @__PURE__ */ jsxs("div", { className: "mt-6 border-t pt-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Languages, { className: "w-5 h-5 text-emerald-600" }),
              " English version"
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                size: "sm",
                variant: "outline",
                onClick: () => {
                  const blob = [
                    `# ${translation.title}`,
                    `slug: ${translation.slug}`,
                    `description: ${translation.description}`,
                    `card_annotation: ${translation.card_annotation}`,
                    `seo_title: ${translation.seo_title}`,
                    `seo_description: ${translation.seo_description}`,
                    `keywords: ${translation.keywords.join(", ")}`,
                    ``,
                    translation.content
                  ].join("\n");
                  copyToClipboard(blob, "Английская версия скопирована целиком");
                },
                children: [
                  /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4 mr-2" }),
                  " Копировать всё"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "EN title" }),
              /* @__PURE__ */ jsx(Input, { value: translation.title, onChange: (e) => setTranslation({ ...translation, title: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "EN slug" }),
              /* @__PURE__ */ jsx(Input, { value: translation.slug, onChange: (e) => setTranslation({ ...translation, slug: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "SEO title (<60)" }),
              /* @__PURE__ */ jsx(Input, { value: translation.seo_title, onChange: (e) => setTranslation({ ...translation, seo_title: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "SEO description (<155)" }),
              /* @__PURE__ */ jsx(Textarea, { rows: 2, value: translation.seo_description, onChange: (e) => setTranslation({ ...translation, seo_description: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Keywords (comma-separated)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  value: translation.keywords.join(", "),
                  onChange: (e) => setTranslation({
                    ...translation,
                    keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean)
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "Card annotation" }),
              /* @__PURE__ */ jsx(Textarea, { rows: 2, value: translation.card_annotation, onChange: (e) => setTranslation({ ...translation, card_annotation: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "EN content (markdown)" }),
              /* @__PURE__ */ jsx(
                Textarea,
                {
                  rows: 14,
                  className: "font-mono text-sm",
                  value: translation.content,
                  onChange: (e) => setTranslation({ ...translation, content: e.target.value })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Перевод не сохранён в БД автоматически — скопируйте поля во вкладку «EN» в редакторе статьи, либо разместите русскую версию и нажмите «Перевести» там, чтобы записать в таблицу ",
            /* @__PURE__ */ jsx("code", { children: "content_translations" }),
            "."
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: previewOpen, onOpenChange: setPreviewOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Eye, { className: "w-5 h-5" }),
        " Превью — как увидит пациент"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "prose dark:prose-invert max-w-none", children: [
        title && /* @__PURE__ */ jsx("h1", { children: title }),
        /* @__PURE__ */ jsx(
          MarkdownArticle,
          {
            content: finalText,
            articleId: (existingRef == null ? void 0 : existingRef.id) || "preview",
            articleSlug: "preview",
            isAdmin: false,
            title
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(Dialog, { open: pickerOpen, onOpenChange: setPickerOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Перепроверить опубликованную статью" }) }),
      /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: "Поиск по заголовку…",
          value: pickerQuery,
          onChange: (e) => setPickerQuery(e.target.value)
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "max-h-[60vh] overflow-y-auto space-y-1 mt-2", children: pickerLoading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-6", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin" }) }) : pickerItems.filter((i) => i.title.toLowerCase().includes(pickerQuery.toLowerCase())).length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-6", children: "Ничего не найдено" }) : pickerItems.filter((i) => i.title.toLowerCase().includes(pickerQuery.toLowerCase())).map((i) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => loadForRecheck(i),
          className: "w-full text-left p-2 rounded hover:bg-accent border border-transparent hover:border-border transition-colors",
          children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium truncate", children: i.title }),
            /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-[10px]", children: i.kind === "disease_articles" ? "Заболевания" : i.kind === "blog_posts" ? "Блог" : "Исследования" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Обновлено: ",
                new Date(i.updated_at).toLocaleDateString("ru-RU")
              ] })
            ] })
          ]
        },
        `${i.kind}:${i.id}`
      )) })
    ] }) })
  ] });
}
export {
  AdminArticleOrchestrator as default
};
