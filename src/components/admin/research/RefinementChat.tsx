import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Wand2, Rocket, Undo2, Camera, Layers, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { makeEntry, restoreBefore, type RefinementEntry } from '@/lib/research/refinementDiff';
import { uploadResearchFile } from '@/lib/research/uploadToYc';
import { kindLabel, acceptedFileMimes } from '@/lib/research/detectMaterialType';
import type { Material } from './MaterialsPanel';

export type { RefinementEntry } from '@/lib/research/refinementDiff';

// «Объединить с материалами» вынесено в отдельный модал «Вплавить материалы в текст»
const ACTIONS: { key: string; label: string }[] = [
  { key: 'shorten', label: 'Сократить' },
  { key: 'deepen', label: 'Углубить' },
  { key: 'expand', label: 'Расширить/Дополнить' },
  { key: 'rewrite_scientific', label: 'Переписать научнее' },
];

const MAX_FILE = 50 * 1024 * 1024;

interface Props {
  reviewId: string;
  title: string;
  currentContent: string;
  materialsContext: string;
  materials: Material[];
  onMaterialsChange: (m: Material[]) => void;
  history: RefinementEntry[];
  onApply: (newContent: string, entry: RefinementEntry) => void;
  onRollback: (content: string) => void;
  onOrchestrate: () => Promise<void>;
  orchestrating: boolean;
}

function assignMarkers(list: Material[]): Material[] {
  return list.map((m, i) => ({ ...m, marker: m.marker || `[M${i + 1}]` }));
}

export default function RefinementChat(p: Props) {
  const [busy, setBusy] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Модал «Вплавить материалы в текст»
  const [mergeOpen, setMergeOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadingInModal, setUploadingInModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function openMerge() {
    setSelectedIds(new Set(p.materials.map(m => m.id)));
    setMergeOpen(true);
  }

  function toggle(id: string, checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }

  async function handleModalFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploadingInModal(true);
    const added: Material[] = [];
    for (const f of Array.from(files)) {
      if (f.size > MAX_FILE) { toast.error(`${f.name}: файл больше 50 МБ`); continue; }
      setUploadProgress(0);
      try {
        const res = await uploadResearchFile(p.reviewId, f, (pct) => setUploadProgress(pct));
        added.push({
          id: crypto.randomUUID(),
          kind: 'file',
          name: f.name,
          mime: f.type || 'application/octet-stream',
          objectKey: res.objectKey,
          size: f.size,
          text: res.text,
        });
      } catch (e: any) {
        toast.error(`${f.name}: ${e?.message || 'ошибка загрузки'}`);
      } finally {
        setUploadProgress(null);
      }
    }
    setUploadingInModal(false);
    if (added.length) {
      const next = assignMarkers([...p.materials, ...added]);
      p.onMaterialsChange(next);
      // Автоматически отмечаем свежедобавленные
      setSelectedIds(prev => {
        const s = new Set(prev);
        for (const m of added) s.add(m.id);
        return s;
      });
      toast.success(`Добавлено: ${added.length}`);
    }
  }

  function buildMergeContext(selected: Material[]): string {
    return selected.map(m => {
      const head = `${m.marker || ''} ${kindLabel(m.kind)} — ${m.name || m.url || ''}`.trim();
      const body = m.text ? `\n${m.text.slice(0, 4000)}` : '';
      return head + body;
    }).join('\n\n');
  }

  async function run(action: string, custom_prompt?: string, contextOverride?: string) {
    if (!p.currentContent && !custom_prompt) {
      toast.error('Нет текста для правки. Сначала запустите оркестратор или добавьте текст обзора.');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('research-materials-refine', {
        body: {
          current_content: p.currentContent,
          action,
          custom_prompt,
          materials_context: contextOverride ?? p.materialsContext,
          title: p.title,
        },
      });
      if (error) throw error;
      if (!data?.new_content) throw new Error('пустой ответ');
      const entry = makeEntry({
        action: action || 'custom',
        prompt: custom_prompt,
        diff_summary: data.diff_summary,
        before: p.currentContent,
        after: data.new_content,
        historyLength: p.history.length,
      });
      p.onApply(data.new_content, entry);
      toast.success('Правка применена');
      if (!action) setCustomPrompt('');
    } catch (e: any) {
      toast.error(e?.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function applyMerge() {
    const selected = p.materials.filter(m => selectedIds.has(m.id));
    if (!selected.length) return;
    const ctx = buildMergeContext(selected);
    setMergeOpen(false);
    await run('merge', undefined, ctx);
  }

  function handleRollback(idx: number) {
    if (!confirm('Откатить контент к состоянию до этой правки?')) return;
    const restored = restoreBefore(p.history, idx);
    if (restored == null) { toast.error('Не удалось восстановить: ближайший снапшот не найден'); return; }
    p.onRollback(restored);
    toast.success('Откат выполнен');
  }

  function scrollToMaterials() {
    setMergeOpen(false);
    document.getElementById('materials-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span>Правки и оркестрация</span>
          <Button size="sm" onClick={p.onOrchestrate} disabled={p.orchestrating}>
            {p.orchestrating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Rocket className="w-4 h-4 mr-1" />}
            Отправить в оркестратор (3 звонка)
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map(a => (
            <Button key={a.key} variant="outline" size="sm" onClick={() => run(a.key)} disabled={busy}>
              {a.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={openMerge} disabled={busy}>
            <Layers className="w-4 h-4 mr-1" />
            Вплавить материалы в текст
          </Button>
        </div>

        <div className="flex gap-2">
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={2}
            placeholder="Свободный запрос к модели: «добавь раздел про диагностику у подростков»…"
          />
          <Button size="sm" onClick={() => run('', customPrompt)} disabled={busy || !customPrompt.trim()}>
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
            Применить
          </Button>
        </div>

        {p.history.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <h4 className="text-sm font-semibold">История правок (снапшоты каждые 5 шагов)</h4>
            {p.history.map((h, i) => {
              const idx = i;
              return (
                <div key={h.id} className="flex items-start gap-2 text-xs border rounded px-2 py-1.5 bg-muted/20">
                  {h.is_snapshot && <Camera className="w-3.5 h-3.5 text-primary mt-0.5" />}
                  <div className="flex-1">
                    <div className="font-medium">
                      #{idx + 1} · {h.action}{h.prompt ? `: ${h.prompt.slice(0, 100)}` : ''}
                      {h.is_pre_orchestrate && <span className="ml-2 text-primary">(перед оркестратором)</span>}
                    </div>
                    {h.diff_summary && <div className="text-muted-foreground">{h.diff_summary}</div>}
                    <div className="text-muted-foreground">{new Date(h.created_at).toLocaleString('ru-RU')}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleRollback(idx)} title="Откатить к состоянию до этой правки">
                    <Undo2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            }).reverse()}
          </div>
        )}
      </CardContent>

      {/* Модал: «Какие материалы вплавить в текст обзора» */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Какие материалы вплавить в текст обзора</DialogTitle>
          </DialogHeader>

          {p.materials.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center space-y-3">
              <div>Сначала загрузите материалы.</div>
              <Button variant="outline" size="sm" onClick={scrollToMaterials}>
                Перейти к панели материалов
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {p.materials.map(m => {
                const checked = selectedIds.has(m.id);
                return (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 border rounded px-2 py-1.5 cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox checked={checked} onCheckedChange={(v) => toggle(m.id, v === true)} />
                    <Badge variant="outline" className="text-xs font-mono">{m.marker || ''}</Badge>
                    <Badge variant="secondary" className="text-xs">{kindLabel(m.kind)}</Badge>
                    <span className="text-sm flex-1 truncate">{m.name || m.url || (m.text?.slice(0, 60))}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Компактная зона добавления ещё материалов */}
          <div>
            <input
              id="merge-add-file"
              type="file"
              multiple
              accept={acceptedFileMimes()}
              onChange={(e) => handleModalFiles(e.target.files)}
              className="hidden"
            />
            <div
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault(); e.stopPropagation(); setDragOver(false);
                if (e.dataTransfer?.files?.length) handleModalFiles(e.dataTransfer.files);
              }}
              onClick={() => document.getElementById('merge-add-file')?.click()}
              role="button"
              tabIndex={0}
              className={`border-2 border-dashed rounded p-3 text-center text-sm cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40'
              }`}
            >
              <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              {uploadingInModal
                ? `Загрузка… ${uploadProgress ?? 0}%`
                : dragOver ? 'Отпустите, чтобы загрузить' : 'Добавить ещё материал: перетащите файл или нажмите'}
            </div>
            {uploadingInModal && uploadProgress !== null && (
              <Progress value={uploadProgress} className="h-1.5 mt-2" />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>Отмена</Button>
            <Button
              disabled={busy || uploadingInModal || selectedIds.size === 0 || p.materials.length === 0}
              onClick={applyMerge}
            >
              {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Layers className="w-4 h-4 mr-1" />}
              Объединить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
