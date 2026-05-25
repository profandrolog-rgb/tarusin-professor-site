import { useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, FileDown, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import type { PlanItem } from "@/components/treatment/PlanItemRow";
import {
  buildMarkdown, buildProfileLine, filterItems, groupBySection,
  downloadBlob, type AnonLevel, type ExportFormat,
} from "@/lib/treatment/patternExport";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: PlanItem[];
  durationDays: number;
  totalCost: number | null;
  lab: Array<{ control_point: string | null; at_day: number | null }>;
  clinicalSummary: string;
  profile: { sex?: string | null; age?: number | null; diagnosisShort?: string | null };
}

const FOOTER_DISCLAIMER = "Информация представлена в образовательных целях, не является инструкцией к применению.";

export function PatternExportDialog({
  open, onOpenChange, items, durationDays, totalCost, lab, clinicalSummary, profile,
}: Props) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [anonLevel, setAnonLevel] = useState<AnonLevel>("profile");
  const [incLab, setIncLab] = useState(true);
  const [incLifestyle, setIncLifestyle] = useState(true);
  const [incCost, setIncCost] = useState(true);
  const [incDuration, setIncDuration] = useState(true);
  const [summary, setSummary] = useState(clinicalSummary || "");
  const [busy, setBusy] = useState(false);
  const pngRef = useRef<HTMLDivElement | null>(null);

  const input = useMemo(() => ({
    format, anonLevel,
    include: { items: true as const, lab: incLab, lifestyle: incLifestyle, cost: incCost, duration: incDuration },
    clinicalSummary: summary,
    durationDays, items, totalCost, lab, profile,
  }), [format, anonLevel, incLab, incLifestyle, incCost, incDuration, summary, durationDays, items, totalCost, lab, profile]);

  const groups = useMemo(() => groupBySection(filterItems(input)), [input]);
  const profileLine = useMemo(() => buildProfileLine(profile), [profile]);

  const handleExport = async () => {
    setBusy(true);
    try {
      const ts = new Date().toISOString().slice(0, 10);
      if (format === "markdown") {
        const md = buildMarkdown(input);
        downloadBlob(new Blob([md], { type: "text/markdown;charset=utf-8" }), `pattern-${ts}.md`);
      } else if (format === "png") {
        if (!pngRef.current) throw new Error("PNG layout not ready");
        const dataUrl = await toPng(pngRef.current, { pixelRatio: 1, cacheBust: true, width: 1080, height: 1080 });
        const blob = await (await fetch(dataUrl)).blob();
        downloadBlob(blob, `pattern-${ts}.png`);
      } else {
        await exportPdf(input);
      }
      toast({ title: "Экспортировано", description: `Файл pattern-${ts}.${format === "markdown" ? "md" : format}` });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Ошибка экспорта", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = async (inp: typeof input) => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const W = 210, H = 297, M = 18;
    let y = M;
    // Header / brand
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.setTextColor(20, 60, 130);
    doc.text("МАЦ — Медико-академический центр", M, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Терапевтический паттерн", W - M, y, { align: "right" });
    y += 4;
    doc.setDrawColor(20, 60, 130); doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 7;

    doc.setTextColor(30);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text("Клиническая ситуация", M, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const sit = inp.anonLevel === "profile" ? profileLine : "Структурный паттерн без профилирования.";
    y = writeWrap(doc, sit, M, y, W - 2 * M, 4.5);
    y += 3;

    if (inp.clinicalSummary.trim()) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Клиническое назначение", M, y); y += 5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      y = writeWrap(doc, inp.clinicalSummary.trim(), M, y, W - 2 * M, 4.5);
      y += 3;
    }

    if (inp.include.duration) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(`Длительность курса: `, M, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${inp.durationDays} дн.`, M + 38, y);
      y += 6;
    }

    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text("Состав терапии", M, y); y += 5;
    const grps = groupBySection(filterItems(inp));
    for (const g of grps) {
      if (y > H - 35) { doc.addPage(); y = M; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5);
      doc.setTextColor(20, 60, 130);
      doc.text(g.section.label, M, y); y += 4.5;
      doc.setTextColor(30);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      for (const it of g.list) {
        if (y > H - 30) { doc.addPage(); y = M; }
        const line = formatItemLine(it);
        y = writeWrap(doc, "• " + line, M + 2, y, W - 2 * M - 2, 4.3);
        y += 0.5;
      }
      y += 2;
    }

    if (inp.include.lab && inp.lab.length > 0) {
      if (y > H - 35) { doc.addPage(); y = M; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("Лабораторный контроль", M, y); y += 5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      for (const l of inp.lab) {
        if (y > H - 30) { doc.addPage(); y = M; }
        const d = l.at_day != null ? ` (день ${l.at_day})` : "";
        y = writeWrap(doc, "• " + (l.control_point || "—") + d, M + 2, y, W - 2 * M - 2, 4.3);
      }
      y += 3;
    }

    if (inp.include.cost && inp.totalCost != null) {
      if (y > H - 35) { doc.addPage(); y = M; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      doc.text("Ориентировочная стоимость курса:", M, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${new Intl.NumberFormat("ru-RU").format(Math.round(inp.totalCost))} ₽`, M + 73, y);
      y += 6;
    }

    // Footer on every page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200); doc.line(M, H - 18, W - M, H - 18);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(20, 60, 130);
      doc.text("МАЦ · Автор: проф. Д.И. Тарусин", M, H - 13);
      doc.setFont("helvetica", "italic"); doc.setFontSize(7.5); doc.setTextColor(110);
      const fLines = doc.splitTextToSize(FOOTER_DISCLAIMER, W - 2 * M);
      doc.text(fLines, M, H - 9);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(150);
      doc.text(`${i} / ${pageCount}`, W - M, H - 9, { align: "right" });
    }

    doc.save(`pattern-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Share2 className="w-5 h-5"/>Экспорт паттерна для презентации</DialogTitle>
          <DialogDescription>
            Анонимизированный паттерн без ФИО, № карты, дат и контактов. Для презентаций, блога, Telegram.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="pdf">PDF (A4)</TabsTrigger>
            <TabsTrigger value="png">PNG (1080×1080)</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Что включить</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox checked disabled/> Назначения (всегда)
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={incLab} onCheckedChange={(v) => setIncLab(!!v)}/> Лабконтроль
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={incLifestyle} onCheckedChange={(v) => setIncLifestyle(!!v)}/> Образ жизни
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={incCost} onCheckedChange={(v) => setIncCost(!!v)}/> Стоимость (агрегированно)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={incDuration} onCheckedChange={(v) => setIncDuration(!!v)}/> Длительность курса
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Уровень анонимизации</Label>
                <RadioGroup value={anonLevel} onValueChange={(v) => setAnonLevel(v as AnonLevel)} className="mt-2 space-y-2">
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="full" id="anon-full" className="mt-0.5"/>
                    <div>
                      <div>Полная</div>
                      <div className="text-xs text-muted-foreground">Только структура, без профиля</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="profile" id="anon-profile" className="mt-0.5"/>
                    <div>
                      <div>Профильная</div>
                      <div className="text-xs text-muted-foreground italic">«{profileLine}»</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cs" className="text-xs font-semibold uppercase text-muted-foreground">Клиническое назначение (редактируется)</Label>
              <Textarea id="cs" value={summary} onChange={(e) => setSummary(e.target.value)} rows={10}
                placeholder="Краткое клиническое обоснование назначения (по умолчанию — из clinical_summary)…"/>
              <div className="text-xs text-muted-foreground">
                Будет показано как раздел «Клиническое назначение». Удаление поля скроет раздел.
              </div>
            </div>
          </div>

          <TabsContent value="pdf" className="mt-3">
            <div className="text-xs text-muted-foreground border rounded-md p-2 bg-muted/30">
              А4 портрет · брендирование МАЦ · подвал с подписью автора и дисклеймером.
            </div>
          </TabsContent>
          <TabsContent value="png" className="mt-3">
            <div className="text-xs text-muted-foreground border rounded-md p-2 bg-muted/30">
              1080×1080 для Instagram · тёмный фон, белая типографика, акцент МАЦ.
            </div>
          </TabsContent>
          <TabsContent value="markdown" className="mt-3">
            <div className="text-xs text-muted-foreground border rounded-md p-2 bg-muted/30">
              .md с заголовками — для Telegram-постов и блога.
            </div>
          </TabsContent>
        </Tabs>

        {/* Hidden PNG render target */}
        <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}>
          <div
            ref={pngRef}
            style={{
              width: 1080, height: 1080, padding: 56, boxSizing: "border-box",
              background: "linear-gradient(135deg, #0a1a3a 0%, #0d2756 60%, #1a3c7a 100%)",
              color: "#ffffff", fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, color: "#9bc7ff" }}>МАЦ</div>
                <div style={{ fontSize: 14, opacity: 0.8, textTransform: "uppercase", letterSpacing: 2 }}>Терапевтический паттерн</div>
              </div>
              <div style={{ fontSize: 18, opacity: 0.85, marginBottom: 8 }}>Клиническая ситуация</div>
              <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.25, marginBottom: 22 }}>
                {anonLevel === "profile" ? profileLine : "Структурный паттерн"}
              </div>
              {summary.trim() && (
                <div style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.45, marginBottom: 22, maxHeight: 130, overflow: "hidden" }}>
                  {summary.trim()}
                </div>
              )}
              <div style={{ fontSize: 16, opacity: 0.8, marginBottom: 6 }}>Состав терапии</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", maxHeight: 460, overflow: "hidden" }}>
                {groups.map(g => (
                  <div key={g.section.key} style={{ fontSize: 13, lineHeight: 1.35 }}>
                    <div style={{ color: "#9bc7ff", fontWeight: 700, marginBottom: 2 }}>{g.section.label}</div>
                    {g.list.slice(0, 6).map((it, i) => (
                      <div key={i} style={{ opacity: 0.95 }}>• {compactItem(it)}</div>
                    ))}
                    {g.list.length > 6 && <div style={{ opacity: 0.6 }}>+ ещё {g.list.length - 6}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", gap: 16, fontSize: 14, marginBottom: 14, opacity: 0.9 }}>
                {incDuration && <span>⏱ {durationDays} дн.</span>}
                {incCost && totalCost != null && (
                  <span>💵 ≈ {new Intl.NumberFormat("ru-RU").format(Math.round(totalCost))} ₽</span>
                )}
                {incLab && lab.length > 0 && <span>🧪 контроль: {lab.length}</span>}
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.2)", marginBottom: 12 }}/>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9bc7ff" }}>Автор: проф. Д.И. Тарусин</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, fontStyle: "italic" }}>{FOOTER_DISCLAIMER}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Отмена</Button>
          <Button onClick={handleExport} disabled={busy || items.length === 0} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileDown className="w-4 h-4"/>}
            Скачать {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatItemLine(it: PlanItem): string {
  const bits: string[] = [it.name_snapshot];
  if (it.dose != null) bits.push(`${it.dose}${it.dose_unit ? " " + it.dose_unit : ""}`);
  if (it.frequency) bits.push(it.frequency);
  if (it.duration_days != null) bits.push(`${it.duration_days} дн.`);
  if (it.day_pattern) bits.push(`дни: ${it.day_pattern}`);
  return bits.join(" · ");
}

function compactItem(it: PlanItem): string {
  const bits: string[] = [it.name_snapshot];
  if (it.dose != null) bits.push(`${it.dose}${it.dose_unit ? it.dose_unit : ""}`);
  if (it.frequency) bits.push(it.frequency);
  return bits.join(" · ");
}

function writeWrap(doc: jsPDF, text: string, x: number, y: number, maxW: number, lh: number): number {
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * lh;
}
