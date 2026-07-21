import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Trash2, Upload, Link2, FileText, Sparkles, Youtube, BookOpen, ImageIcon, Table as TableIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { detectUrlKind, acceptedFileMimes, kindLabel, type MaterialKind } from '@/lib/research/detectMaterialType';
import { deleteObject, uploadResearchFile, getDownloadUrl } from '@/lib/research/uploadToYc';
import { extractFromFile, type ExtractedImage, type ExtractedTable } from '@/lib/materials/extract';


export interface Material {
  id: string;
  marker?: string;
  kind: MaterialKind;
  name?: string;
  mime?: string;
  objectKey?: string;
  url?: string;
  text?: string;
  size?: number;
  extractedImages?: ExtractedImage[];
  extractedTables?: ExtractedTable[];
}

const MAX_FILE = 50 * 1024 * 1024;      // 50 MB per file
const MAX_TOTAL = 200 * 1024 * 1024;    // 200 MB total per review

interface Props {
  reviewId: string;
  materials: Material[];
  onChange: (m: Material[]) => void;
  instructions: string;
  onInstructionsChange: (v: string) => void;
  onAnalyze: () => Promise<void>;
  analyzing: boolean;
  analysis: any | null;
  /** Вставка markdown-таблицы в позицию курсора редактора. */
  onInsertTable?: (markdown: string) => void;
}

const IconFor = ({ kind }: { kind: MaterialKind }) => {
  if (kind === 'youtube') return <Youtube className="w-4 h-4" />;
  if (kind === 'pubmed') return <BookOpen className="w-4 h-4" />;
  if (kind === 'url') return <Link2 className="w-4 h-4" />;
  if (kind === 'text') return <FileText className="w-4 h-4" />;
  return <Upload className="w-4 h-4" />;
};

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / 1024 / 1024).toFixed(1)} МБ`;
}

export default function MaterialsPanel(p: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const pendingDeletions = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const totalBytes = p.materials.reduce((s, m) => s + (m.size || 0), 0);

  function assignMarkers(list: Material[]): Material[] {
    return list.map((m, i) => ({ ...m, marker: m.marker || `[M${i + 1}]` }));
  }


  const [extracting, setExtracting] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    const toUpload = Array.from(files);
    const added: Material[] = [];
    let running = totalBytes;

    for (const f of toUpload) {
      if (f.size > MAX_FILE) {
        toast.error(`${f.name}: файл больше 50 МБ`);
        continue;
      }
      if (running + f.size > MAX_TOTAL) {
        toast.error(`${f.name}: суммарный лимит 200 МБ на обзор превышен`);
        continue;
      }
      const key = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setProgress(prev => ({ ...prev, [key]: 0 }));
      try {
        const res = await uploadResearchFile(p.reviewId, f, (pct) => setProgress(prev => ({ ...prev, [key]: pct })));
        const material: Material = {
          id: crypto.randomUUID(),
          kind: 'file',
          name: f.name,
          mime: f.type || 'application/octet-stream',
          objectKey: res.objectKey,
          size: f.size,
          text: res.text,
        };
        added.push(material);
        running += f.size;

        // Асинхронное извлечение изображений и таблиц.
        const lc = f.name.toLowerCase();
        if (/\.(docx|pptx|pdf)$/i.test(lc)) {
          setExtracting(prev => ({ ...prev, [material.id]: true }));
          extractFromFile(f, p.reviewId).then((ext) => {
            if (ext.images.length || ext.tables.length) {
              material.extractedImages = ext.images;
              material.extractedTables = ext.tables;
              // Мутируем текущий локальный список и передаём обновлённую копию.
              const updated = assignMarkers(p.materials.map(m => m.id === material.id ? { ...m, extractedImages: ext.images, extractedTables: ext.tables } : m));
              // Если материал ещё не вошёл в родительский стейт — добавим в мутацию отдельным путём.
              const exists = updated.some(m => m.id === material.id);
              p.onChange(exists ? updated : [...updated, material]);
              toast.success(`«${f.name}»: извлечено изображений — ${ext.images.length}, таблиц — ${ext.tables.length}`);
            }
          }).catch((e) => {
            console.warn('extractFromFile failed:', e?.message);
          }).finally(() => {
            setExtracting(prev => { const { [material.id]: _, ...rest } = prev; return rest; });
          });
        }
      } catch (e: any) {
        toast.error(`${f.name}: ${e?.message || 'ошибка загрузки'}`);
      } finally {
        setProgress(prev => {
          const { [key]: _, ...rest } = prev;
          return rest;
        });
      }
    }
    setUploading(false);
    if (added.length) {
      p.onChange(assignMarkers([...p.materials, ...added]));
      toast.success(`Загружено файлов: ${added.length}`);
    }
    if (fileInput.current) fileInput.current.value = '';
  }

  function addUrl() {
    const u = urlInput.trim();
    if (!u) return;
    const kind = detectUrlKind(u);
    if (kind === 'text') {
      toast.error('Похоже, это не ссылка');
      return;
    }
    p.onChange(assignMarkers([...p.materials, { id: crypto.randomUUID(), kind, url: u, name: u.slice(0, 80) }]));
    setUrlInput('');
  }

  function addText() {
    const t = textInput.trim();
    if (!t) return;
    p.onChange(assignMarkers([...p.materials, {
      id: crypto.randomUUID(), kind: 'text', text: t,
      name: t.slice(0, 60) + (t.length > 60 ? '…' : ''),
      size: new Blob([t]).size,
    }]));
    setTextInput('');
  }

  function remove(id: string) {
    const m = p.materials.find(x => x.id === id);
    if (!m) return;
    // Убираем из списка сразу, пересчитываем маркеры.
    const remaining = p.materials.filter(x => x.id !== id).map((x, i) => ({ ...x, marker: `[M${i + 1}]` }));
    p.onChange(remaining);

    // Отложенное фактическое удаление из бакета через 8 сек, с возможностью отмены.
    const timer = setTimeout(async () => {
      pendingDeletions.current.delete(id);
      if (m.objectKey) {
        try { await deleteObject(m.objectKey); } catch (e: any) {
          console.warn('delete YC failed:', e?.message);
        }
      }
    }, 8000);
    pendingDeletions.current.set(id, timer);

    toast(`Материал «${m.name || m.marker || m.kind}» удалён`, {
      duration: 8000,
      action: {
        label: 'Отменить',
        onClick: () => {
          const t = pendingDeletions.current.get(id);
          if (t) { clearTimeout(t); pendingDeletions.current.delete(id); }
          // Возвращаем материал на исходную позицию по id (через merge + пересчёт маркеров).
          const restored = [...p.materials];
          const idx = restored.findIndex(x => x.id === id);
          if (idx === -1) {
            const merged: Material[] = [...remaining, m];
            p.onChange(merged.map((x, i) => ({ ...x, marker: `[M${i + 1}]` })));
          }
        },
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span>
            Материалы для обзора ({p.materials.length}) —{' '}
            <span className={totalBytes > MAX_TOTAL * 0.9 ? 'text-destructive' : 'text-muted-foreground'}>
              {fmtBytes(totalBytes)} / 200 МБ
            </span>
          </span>
          <Button size="sm" onClick={p.onAnalyze} disabled={p.analyzing || p.materials.length === 0}>
            {p.analyzing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Проанализировать
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm">Файлы (PDF, DOCX, PPTX, изображения, аудио — до 50 МБ каждый, 200 МБ суммарно)</Label>
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation(); setDragOver(false);
              if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInput.current?.click()}
            role="button"
            tabIndex={0}
            className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40'
            }`}
          >
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={acceptedFileMimes()}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="text-sm font-medium">
              {uploading ? 'Загрузка…' : dragOver ? 'Отпустите, чтобы загрузить' : 'Перетащите файлы сюда или нажмите'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              PDF · DOCX · PPTX · XLSX · изображения · аудио · схемы · интеллект-карты
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Прямая загрузка в Yandex Object Storage через presigned URL
          </div>
          {Object.entries(progress).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(progress).map(([k, pct]) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <Progress value={pct} className="h-1.5 flex-1" />
                  <span className="w-10 text-right text-muted-foreground">{pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>


        <div>
          <Label className="text-sm">Ссылка (YouTube, PubMed, любой URL)</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              onKeyDown={(e) => e.key === 'Enter' && addUrl()}
            />
            <Button variant="outline" size="sm" onClick={addUrl}><Link2 className="w-4 h-4 mr-1" /> Добавить</Button>
          </div>
        </div>

        <div>
          <Label className="text-sm">Свободный текст / выдержка из документа</Label>
          <div className="flex gap-2 mt-1">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={2}
              placeholder="Вставьте цитату, тезисы или содержание документа…"
            />
            <Button variant="outline" size="sm" onClick={addText}><FileText className="w-4 h-4 mr-1" /> Добавить</Button>
          </div>
        </div>

        {p.materials.length > 0 && (
          <div className="space-y-1.5">
            {p.materials.map(m => {
              const imgCount = m.extractedImages?.length || 0;
              const tblCount = m.extractedTables?.length || 0;
              const isOpen = expanded[m.id];
              const isExtracting = extracting[m.id];
              return (
                <div key={m.id} className="border rounded bg-muted/30">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <IconFor kind={m.kind} />
                    <Badge variant="outline" className="text-xs font-mono">{m.marker || ''}</Badge>
                    <Badge variant="secondary" className="text-xs">{kindLabel(m.kind)}</Badge>
                    <span className="text-sm flex-1 truncate">{m.name || m.url || m.text}</span>
                    {isExtracting && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                    {imgCount > 0 && (
                      <Badge variant="outline" className="text-xs gap-1"><ImageIcon className="w-3 h-3" />{imgCount}</Badge>
                    )}
                    {tblCount > 0 && (
                      <Badge variant="outline" className="text-xs gap-1"><TableIcon className="w-3 h-3" />{tblCount}</Badge>
                    )}
                    {(imgCount > 0 || tblCount > 0) && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpanded(e => ({ ...e, [m.id]: !e[m.id] }))}>
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                    )}
                    {m.size ? <span className="text-xs text-muted-foreground">{fmtBytes(m.size)}</span> : null}
                    <Button variant="ghost" size="sm" onClick={() => remove(m.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  {isOpen && (
                    <div className="border-t px-2 py-2 space-y-2 bg-background/50">
                      {imgCount > 0 && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Извлечённые изображения — доступны в диалоге вставки галереи</div>
                          <div className="grid grid-cols-6 gap-1.5">
                            {m.extractedImages!.slice(0, 24).map((img, i) => (
                              <ExtractedThumb key={i} img={img} />
                            ))}
                            {imgCount > 24 && <span className="text-xs text-muted-foreground self-center">и ещё {imgCount - 24}</span>}
                          </div>
                        </div>
                      )}
                      {tblCount > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Извлечённые таблицы</div>
                          {m.extractedTables!.map((t, i) => (
                            <div key={i} className="flex items-start gap-2 border rounded p-2 bg-muted/20">
                              <pre className="text-xs whitespace-pre-wrap flex-1 max-h-24 overflow-auto font-mono">{t.markdown.split('\n').slice(0, 4).join('\n')}{t.markdown.split('\n').length > 4 ? '\n…' : ''}</pre>
                              {p.onInsertTable && (
                                <Button size="sm" variant="outline" onClick={() => p.onInsertTable!(t.markdown)}>
                                  Вставить
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div>
          <Label className="text-sm">Дополнительные указания модели (опционально)</Label>
          <Textarea
            value={p.instructions}
            onChange={(e) => p.onInstructionsChange(e.target.value)}
            rows={2}
            placeholder="Например: сфокусируйся на педиатрической популяции, избегай коммерческих источников…"
          />
        </div>

        {p.analysis && (
          <div className="border rounded p-3 bg-primary/5 space-y-2">
            <h4 className="font-semibold text-sm">Первичный анализ</h4>
            {p.analysis.summary && <p className="text-sm whitespace-pre-wrap">{p.analysis.summary}</p>}
            {Array.isArray(p.analysis.key_points) && p.analysis.key_points.length > 0 && (
              <ul className="text-sm list-disc pl-5 space-y-0.5">
                {p.analysis.key_points.map((k: string, i: number) => <li key={i}>{k}</li>)}
              </ul>
            )}
            {p.analysis.draft_outline && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">План обзора</summary>
                <pre className="whitespace-pre-wrap mt-1 text-xs">{p.analysis.draft_outline}</pre>
              </details>
            )}
            {Array.isArray(p.analysis.detected_sources) && p.analysis.detected_sources.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">Источников: {p.analysis.detected_sources.length}</summary>
                <ul className="text-xs mt-1 space-y-1">
                  {p.analysis.detected_sources.map((s: any, i: number) => (
                    <li key={i}>
                      {s.marker ? <span className="font-mono text-primary mr-1">{s.marker}</span> : null}
                      {[s.authors, s.title, s.journal, s.year, s.doi_or_pmid].filter(Boolean).join('. ')}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExtractedThumb({ img }: { img: ExtractedImage }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const requested = useRef(false);
  if (!requested.current) {
    requested.current = true;
    getDownloadUrl(img.objectKey).then(setUrl).catch(() => setErr(true));
  }
  return (
    <div className="aspect-square rounded border bg-muted overflow-hidden relative" title={`Стр. ${img.page ?? '?'}, ${img.width}×${img.height}`}>
      {url && !err ? (
        <img src={url} alt="" loading="lazy" onError={() => setErr(true)} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
