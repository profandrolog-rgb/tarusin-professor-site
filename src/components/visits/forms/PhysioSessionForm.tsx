import { useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcAgeText } from "@/lib/surgery/referral";
import { PHYSIO_PROCEDURES, PhysioData, PhysioRow, filledPhysioRows, physioSessionNumbers } from "@/lib/visits/physio";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const ruDate = (s?: string | null) => (s ? new Date(s.slice(0, 10) + "T00:00:00").toLocaleDateString("ru-RU") : "");

export function PhysioSessionForm({ data, onChange, patientName, birthDate, visitDate }: {
  data: PhysioData; onChange: (p: Partial<PhysioData>) => void;
  patientName?: string | null; birthDate?: string | null; visitDate?: string | null;
}) {
  const rows: PhysioRow[] = data.procedures?.length ? data.procedures : [{}];
  const setRow = (i: number, p: Partial<PhysioRow>) => onChange({ procedures: rows.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  const [only, setOnly] = useState("");

  const printSheets = () => {
    const list = filledPhysioRows(rows);
    const nums = physioSessionNumbers(data.sessions_total, Number(only) || null);
    const total = physioSessionNumbers(data.sessions_total).length;
    const age = calcAgeText(birthDate);
    const sheet = (n: number) => `
      <section class="sheet">
        <h1>Протокол физиолечения</h1>
        <div class="sub">Сеанс ${n} из ${total}${data.per_week ? ` · ${esc(data.per_week)} р/нед` : ""}</div>
        <p><b>Дата:</b> ____________ &nbsp; <b>Дата назначения:</b> ${esc(ruDate(visitDate))}</p>
        <p><b>Ф. И. О.:</b> ${esc(patientName)}${age ? ` &nbsp; <b>Возраст:</b> ${esc(age)}` : ""}</p>
        ${data.indications?.trim() ? `<p><b>Показания к проведению процедур:</b> ${esc(data.indications)}</p>` : ""}
        <table><thead><tr><th>№</th><th>Наименование процедуры</th><th>Продолжительность</th><th>Параметры</th><th>Примечания</th></tr></thead>
        <tbody>${list.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td>${esc(r.duration)}</td><td>${esc(r.params)}</td><td>${esc(r.notes)}</td></tr>`).join("")}</tbody></table>
        <p class="sign">Процедуру провёл: ______________________ &nbsp;&nbsp; Подпись пациента: ______________________</p>
      </section>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Физиолечение — ${esc(patientName)}</title><style>
      body{font-family:"Times New Roman",serif;color:#000;margin:0} .sheet{padding:15mm;page-break-after:always;break-after:page}
      .sheet:last-child{page-break-after:auto} h1{text-align:center;font-size:18pt;margin:0} .sub{text-align:center;margin:2mm 0 6mm}
      table{width:100%;border-collapse:collapse;margin-top:4mm;font-size:11pt} th,td{border:1px solid #000;padding:2mm;vertical-align:top;text-align:left}
      th:first-child,td:first-child{width:8mm;text-align:center} .sign{margin-top:12mm} @page{size:A4;margin:0}
    </style></head><body>${nums.map(sheet).join("")}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Показания к проведению процедур</Label>
        <Textarea rows={3} value={data.indications || ""} onChange={(e) => onChange({ indications: e.target.value })} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Процедуры</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <datalist id="physio-procedures">{PHYSIO_PROCEDURES.map((p) => <option key={p} value={p} />)}</datalist>
          {rows.map((r, i) => (
            <div key={i} className="rounded-md border p-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">№ {i + 1}</span>
                {rows.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label={`Удалить процедуру ${i + 1}`}
                    onClick={() => onChange({ procedures: rows.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                ) : null}
              </div>
              <div className="space-y-1"><Label className="text-xs">Наименование процедуры</Label>
                <Input list="physio-procedures" value={r.name || ""} placeholder="выберите из списка или впишите" onChange={(e) => setRow(i, { name: e.target.value })} /></div>
              <div className="grid md:grid-cols-3 gap-2">
                <div className="space-y-1"><Label className="text-xs">Продолжительность</Label>
                  <Input value={r.duration || ""} placeholder="напр. 20 мин" onChange={(e) => setRow(i, { duration: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Параметры процедуры</Label>
                  <Input value={r.params || ""} onChange={(e) => setRow(i, { params: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Примечания</Label>
                  <Input value={r.notes || ""} onChange={(e) => setRow(i, { notes: e.target.value })} /></div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => onChange({ procedures: [...rows, {}] })}>
            <Plus className="h-3.5 w-3.5" /> Добавить процедуру
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Курс и печать листов</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1"><Label className="text-xs">Число сеансов</Label>
            <Input type="number" min={1} max={60} className="w-28" value={data.sessions_total ?? ""} onChange={(e) => onChange({ sessions_total: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Раз в неделю</Label>
            <Input type="number" min={1} max={14} className="w-28" value={data.per_week ?? ""} onChange={(e) => onChange({ per_week: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Только сеанс № (пусто — все)</Label>
            <Input type="number" min={1} className="w-28" value={only} onChange={(e) => setOnly(e.target.value)} /></div>
          <Button type="button" className="gap-1" onClick={printSheets}><Printer className="h-4 w-4" /> Печать листов сеансов</Button>
        </CardContent>
      </Card>
    </div>
  );
}
