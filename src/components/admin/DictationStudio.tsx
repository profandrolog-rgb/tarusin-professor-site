// DictationStudio
// Непрерывная диктовка с авто-нарезкой по тишине (VAD), распознаванием каждого фрагмента
// и голосовой командой «собери статью» (или нажатием кнопки).
// Каждый фрагмент: WAV (PCM 16k) → ai-transcribe → текст добавляется к черновику,
// аудио сохраняется в storage bucket `article-dictations`, всё пишется в `article_dictations`.
// Когда поймана команда — вызывается clean-dictation (Claude Opus 4.8) и причёсанный текст
// возвращается через onAssembled() в поле «Статья» оркестратора.

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Square, Sparkles, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

type Fragment = { idx: number; text: string; audioPath?: string; ms: number };

// Голосовые команды-триггеры «собери статью» — нормализованные подстроки.
const ASSEMBLE_TRIGGERS = [
  "собери статью", "соберём статью", "соберем статью", "собирай статью",
  "собрать статью", "собери черновик", "свёрстай черновик", "сверстай черновик",
  "причеши текст", "причёсывай текст", "причесывай текст",
  "заверши диктовку", "закончили диктовку", "готово собирай", "готово, собирай",
  "заверши статью", "финал собирай",
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е").replace(/[.,!?;:"«»()\-—]/g, " ").replace(/\s+/g, " ").trim();
}
function detectAssembleTrigger(text: string): { hit: boolean; cleaned: string } {
  const n = normalize(text);
  for (const t of ASSEMBLE_TRIGGERS) {
    if (n.includes(t)) {
      // вырезаем команду из исходного текста (без учёта регистра)
      const re = new RegExp(t.replace(/ё/g, "[её]").replace(/\s+/g, "\\s+"), "i");
      return { hit: true, cleaned: text.replace(re, "").trim() };
    }
  }
  return { hit: false, cleaned: text };
}

// Float32 → 16-bit PCM WAV (mono, downsampled to 16 kHz).
function encodeWav(samples: Float32Array, srcSampleRate: number, dstSampleRate = 16000): Blob {
  const ratio = srcSampleRate / dstSampleRate;
  const newLen = Math.floor(samples.length / ratio);
  const out = new Int16Array(newLen);
  for (let i = 0; i < newLen; i++) {
    const idx = Math.floor(i * ratio);
    let s = samples[idx];
    if (s > 1) s = 1; else if (s < -1) s = -1;
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const buf = new ArrayBuffer(44 + out.length * 2);
  const view = new DataView(buf);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); view.setUint32(4, 36 + out.length * 2, true); w(8, "WAVE");
  w(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, dstSampleRate, true); view.setUint32(28, dstSampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  w(36, "data"); view.setUint32(40, out.length * 2, true);
  let off = 44;
  for (let i = 0; i < out.length; i++, off += 2) view.setInt16(off, out[i], true);
  return new Blob([buf], { type: "audio/wav" });
}

interface Props {
  onAssembled: (cleaned: string, raw: string) => void;
  initialTitle?: string;
}

export default function DictationStudio({ onAssembled, initialTitle }: Props) {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [level, setLevel] = useState(0); // 0..1 для индикатора громкости
  const [dictationId, setDictationId] = useState<string | null>(null);
  const [pendingFragments, setPendingFragments] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // refs для звукового конвейера
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const bufferRef = useRef<Float32Array[]>([]);
  const silenceMsRef = useRef(0);
  const speakingRef = useRef(false);
  const startedAtRef = useRef(0);
  const fragIdxRef = useRef(0);
  const recordingRef = useRef(false);
  const assembleQueuedRef = useRef(false);

  const SILENCE_THRESHOLD = 0.012; // RMS
  const SILENCE_TIMEOUT_MS = 1500; // тишина → нарезать фрагмент
  const MAX_FRAGMENT_MS = 45000;   // защита от слишком длинных фрагментов
  const MIN_FRAGMENT_MS = 700;

  const rawText = fragments.map((f) => f.text).join("\n").trim();

  // создаём строку в article_dictations при первом старте
  const ensureDictationRow = async (): Promise<string | null> => {
    if (dictationId) return dictationId;
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) { setError("Нужна авторизация"); return null; }
    const { data, error: dbErr } = await supabase
      .from("article_dictations")
      .insert({ user_id: u.user.id, title: initialTitle ?? null, status: "recording", raw_dictation: "" })
      .select("id")
      .single();
    if (dbErr) { setError(dbErr.message); return null; }
    setDictationId(data.id);
    return data.id;
  };

  const processFragment = async (pcm: Float32Array, srcRate: number, ms: number, did: string) => {
    setPendingFragments((n) => n + 1);
    const idx = ++fragIdxRef.current;
    try {
      const wav = encodeWav(pcm, srcRate);
      if (wav.size < 4096 || ms < MIN_FRAGMENT_MS) { setPendingFragments((n) => n - 1); return; }

      // STT
      const { data: { session } } = await supabase.auth.getSession();
      const fd = new FormData();
      fd.append("file", wav, `frag-${idx}.wav`);
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: fd,
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || `HTTP ${resp.status}`);
      let text = String(json.text || "").trim();
      if (!text) { setPendingFragments((n) => n - 1); return; }

      // Триггер «собери статью»?
      const trig = detectAssembleTrigger(text);
      const visibleText = trig.cleaned;

      // Параллельно — заливка аудио
      const { data: u } = await supabase.auth.getUser();
      const audioPath = `${u?.user?.id}/${did}/frag-${idx}.wav`;
      supabase.storage.from("article-dictations").upload(audioPath, wav, { contentType: "audio/wav", upsert: true })
        .catch(() => {});

      const frag: Fragment = { idx, text: visibleText, audioPath, ms };
      setFragments((prev) => {
        const next = [...prev, frag].filter((f) => f.text);
        // обновляем БД
        const raw = next.map((f) => f.text).join("\n");
        supabase.from("article_dictations").update({
          raw_dictation: raw,
          fragments: next as any,
          audio_paths: next.map((f) => f.audioPath).filter(Boolean) as string[],
        }).eq("id", did).then(() => {});
        return next;
      });

      if (visibleText) {
        toast({ title: "✓ Фрагмент добавлен", description: "Диктуйте дальше, профессор" });
      }

      if (trig.hit && !assembleQueuedRef.current) {
        assembleQueuedRef.current = true;
        // мягко завершаем запись и запускаем сборку
        stopRecording();
        setTimeout(() => runAssemble(did), 250);
      }
    } catch (e: any) {
      toast({ title: "Ошибка распознавания фрагмента", description: e.message, variant: "destructive" });
    } finally {
      setPendingFragments((n) => Math.max(0, n - 1));
    }
  };

  const flushBuffer = (did: string) => {
    const ctx = ctxRef.current; if (!ctx) return;
    const parts = bufferRef.current; bufferRef.current = [];
    if (!parts.length) return;
    let total = 0; for (const p of parts) total += p.length;
    const merged = new Float32Array(total);
    let o = 0; for (const p of parts) { merged.set(p, o); o += p.length; }
    const ms = (merged.length / ctx.sampleRate) * 1000;
    void processFragment(merged, ctx.sampleRate, ms, did);
    startedAtRef.current = performance.now();
  };

  const startRecording = async () => {
    setError(null);
    const did = await ensureDictationRow();
    if (!did) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
        const copy = new Float32Array(inp.length); copy.set(inp);
        bufferRef.current.push(copy);

        // RMS
        let sum = 0;
        for (let i = 0; i < inp.length; i++) { const v = inp[i]; sum += v * v; }
        const rms = Math.sqrt(sum / inp.length);
        setLevel(Math.min(1, rms * 8));

        const chunkMs = (inp.length / ctx.sampleRate) * 1000;
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
          // тишина в начале — не копим
          if (bufferRef.current.length > 20) bufferRef.current.shift();
        }

        // защита от длинного фрагмента
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
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Нет доступа к микрофону", description: e.message, variant: "destructive" });
    }
  };

  const stopRecording = () => {
    recordingRef.current = false;
    setRecording(false);
    try { procRef.current?.disconnect(); } catch {}
    try { sourceRef.current?.disconnect(); } catch {}
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    // финальный сброс буфера (если осталась речь)
    if (dictationId && speakingRef.current && bufferRef.current.length) {
      flushBuffer(dictationId);
    }
    try { ctxRef.current?.close(); } catch {}
    ctxRef.current = null; procRef.current = null; sourceRef.current = null; streamRef.current = null;
    setLevel(0);
  };

  useEffect(() => () => { if (recordingRef.current) stopRecording(); }, []);

  const runAssemble = async (didArg?: string) => {
    const did = didArg ?? dictationId;
    const raw = fragments.map((f) => f.text).join("\n").trim();
    if (!raw) { toast({ title: "Нет текста для сборки", variant: "destructive" }); return; }
    setAssembling(true);
    try {
      // дожидаемся, чтобы текущие фрагменты успели приехать
      const start = Date.now();
      while (pendingFragments > 0 && Date.now() - start < 8000) {
        await new Promise((r) => setTimeout(r, 250));
      }
      const finalRaw = fragments.map((f) => f.text).join("\n").trim();
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clean-dictation`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: finalRaw, dictationId: did }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || `HTTP ${resp.status}`);
      const cleaned: string = json.cleaned;
      onAssembled(cleaned, finalRaw);
      toast({ title: "Статья собрана и причёсана", description: "Текст вставлен в поле №1. Можно запускать ревью." });
    } catch (e: any) {
      toast({ title: "Не удалось собрать статью", description: e.message, variant: "destructive" });
    } finally {
      setAssembling(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
          <span className="flex items-center gap-2">🎙 Студия диктовки</span>
          <div className="flex items-center gap-2">
            {recording && (
              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 animate-pulse">
                Запись · {fragments.length} фрагм.
              </Badge>
            )}
            {pendingFragments > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> распознаю: {pendingFragments}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          Диктуйте свободно, паузы делят запись на фрагменты. После каждой паузы вы увидите ✓ «Фрагмент добавлен».
          Чтобы закончить — скажите <b>«собери статью»</b> (или нажмите кнопку справа).
        </div>

        {/* индикатор громкости */}
        {recording && (
          <div className="h-2 bg-muted rounded overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round(level * 100)}%` }} />
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {!recording ? (
            <Button onClick={startRecording} disabled={assembling}>
              <Mic className="w-4 h-4 mr-1" /> Начать диктовку
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopRecording}>
              <Square className="w-4 h-4 mr-1" /> Остановить
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => runAssemble()}
            disabled={assembling || !fragments.length || pendingFragments > 0}
          >
            {assembling ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {assembling ? "Собираю…" : "Собрать статью (Claude Opus 4.8)"}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {fragments.length > 0 && (
          <div className="border rounded-md p-3 bg-muted/30 max-h-64 overflow-auto space-y-1.5 text-sm">
            {fragments.map((f) => (
              <div key={f.idx} className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div><span className="text-xs text-muted-foreground mr-1">#{f.idx}</span>{f.text}</div>
              </div>
            ))}
          </div>
        )}

        {rawText && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Сырая диктовка ({rawText.length} симв.)</summary>
            <pre className="mt-2 whitespace-pre-wrap font-sans">{rawText}</pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
