import { useEffect, useRef, useState } from "react";
import { assessDocument, recognizePart, type DocumentAssessment } from "@/lib/visits/documentRecognition";
import type { ParsedProtocol } from "@/lib/visits/protocolImport";

export interface PartResult {
  id: string;
  label: string;
  state: "waiting" | "busy" | "done" | "error";
  parsed?: ParsedProtocol;
  error?: string;
}

export function useDocumentRecognition() {
  const [phase, setPhase] = useState<"idle" | "assessment" | "fragmentation" | "recognition" | "results">("idle");
  const [assessment, setAssessment] = useState<DocumentAssessment | null>(null);
  const [parts, setParts] = useState<PartResult[]>([]);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const activeAssessment = useRef<DocumentAssessment | null>(null);
  const results = useRef<PartResult[]>([]);
  const mounted = useRef(true);
  const busy = phase === "assessment" || phase === "recognition";
  const update = (next: PartResult[]) => { results.current = next; if (mounted.current) setParts(next); };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      void activeAssessment.current?.dispose();
    };
  }, []);

  const run = async (value: DocumentAssessment) => {
    const request = new AbortController();
    controller.current = request;
    setError("");
    setPhase("recognition");
    try {
      for (const part of value.parts) {
        const previous = results.current.find((row) => row.id === part.id);
        if (previous?.state === "done") continue;
        if (request.signal.aborted) break;
        update(results.current.map((row) => row.id === part.id ? { ...row, state: "busy", error: undefined } : row));
        try {
          const parsed = await recognizePart(part, request.signal);
          if (request.signal.aborted) break;
          update(results.current.map((row) => row.id === part.id ? { ...row, state: "done", parsed } : row));
        } catch (cause) {
          update(results.current.map((row) => row.id === part.id ? { ...row, state: "error", error: request.signal.aborted ? "Остановлено. Часть не распознана." : cause instanceof Error ? cause.message : "Не удалось распознать часть" } : row));
          // Следующая часть не отправляется после ошибки; повтор — только вручную.
          break;
        }
      }
    } finally {
      update(results.current.map((row) => row.state === "busy" ? { ...row, state: "error", error: "Остановлено. Часть не распознана." } : row));
      if (mounted.current) setPhase("results");
      controller.current = null;
    }
  };

  const start = async (file: File | null, text = "") => {
    if (controller.current) return;
    await activeAssessment.current?.dispose();
    activeAssessment.current = null;
    setAssessment(null);
    update([]);
    setError("");
    setPhase("assessment");
    const request = new AbortController();
    controller.current = request;
    try {
      const value = await assessDocument(file, text, request.signal);
      if (request.signal.aborted || !mounted.current) { await value.dispose(); return; }
      activeAssessment.current = value;
      setAssessment(value);
      update(value.parts.map((part) => ({ id: part.id, label: part.label, state: "waiting" })));
      controller.current = null;
      if (value.requiresFragmentation) setPhase("fragmentation");
      else await run(value);
    } catch (cause) {
      if (mounted.current) {
        setError(request.signal.aborted ? "Оценка остановлена" : cause instanceof Error ? cause.message : "Не удалось оценить документ");
        setPhase("idle");
      }
    } finally {
      controller.current = null;
      if (request.signal.aborted && mounted.current && !activeAssessment.current) setPhase("idle");
    }
  };

  const reset = () => {
    if (controller.current) return;
    void activeAssessment.current?.dispose();
    activeAssessment.current = null;
    setAssessment(null);
    update([]);
    setError("");
    setPhase("idle");
  };

  return { phase, assessment, parts, error, busy, start, reset,
    stop: () => controller.current?.abort(),
    resume: () => { if (!controller.current && activeAssessment.current) void run(activeAssessment.current); },
  };
}
