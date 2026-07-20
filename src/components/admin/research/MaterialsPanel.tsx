import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, Upload, Link2, FileText, Sparkles, Youtube, BookOpen } from 'lucide-react';
import { detectUrlKind, acceptedFileMimes, kindLabel, type MaterialKind } from '@/lib/research/detectMaterialType';

export interface Material {
  id: string;
  kind: MaterialKind;
  name?: string;
  mime?: string;
  storage_path?: string;
  url?: string;
  text?: string;
  size?: number;
}

interface Props {
  reviewId: string;
  materials: Material[];
  onChange: (m: Material[]) => void;
  instructions: string;
  onInstructionsChange: (v: string) => void;
  onAnalyze: () => Promise<void>;
  analyzing: boolean;
  analysis: any | null;
}

const IconFor = ({ kind }: { kind: MaterialKind }) => {
  if (kind === 'youtube') return <Youtube className="w-4 h-4" />;
  if (kind === 'pubmed') return <BookOpen className="w-4 h-4" />;
  if (kind === 'url') return <Link2 className="w-4 h-4" />;
  if (kind === 'text') return <FileText className="w-4 h-4" />;
  return <Upload className="w-4 h-4" />;
};

export default function MaterialsPanel(p: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    const added: Material[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 25 * 1024 * 1024) {
        toast.error(`${f.name}: файл больше 25 МБ`);
        continue;
      }
      const path = `${p.reviewId}/${Date.now()}-${f.name.replace(/[^\w.\-]+/g, '_')}`;
      const { error } = await supabase.storage.from('research-materials').upload(path, f, { upsert: false });
      if (error) {
        toast.error(`${f.name}: ${error.message}`);
        continue;
      }
      added.push({
        id: crypto.randomUUID(),
        kind: 'file',
        name: f.name,
        mime: f.type || 'application/octet-stream',
        storage_path: path,
        size: f.size,
      });
    }
    setUploading(false);
    if (added.length) {
      p.onChange([...p.materials, ...added]);
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
    p.onChange([...p.materials, { id: crypto.randomUUID(), kind, url: u, name: u.slice(0, 80) }]);
    setUrlInput('');
  }

  function addText() {
    const t = textInput.trim();
    if (!t) return;
    p.onChange([...p.materials, { id: crypto.randomUUID(), kind: 'text', text: t, name: t.slice(0, 60) + (t.length > 60 ? '…' : '') }]);
    setTextInput('');
  }

  function remove(id: string) {
    const m = p.materials.find(x => x.id === id);
    if (m?.storage_path) {
      supabase.storage.from('research-materials').remove([m.storage_path]).catch(() => {});
    }
    p.onChange(p.materials.filter(x => x.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Материалы для обзора ({p.materials.length})</span>
          <Button
            size="sm"
            onClick={p.onAnalyze}
            disabled={p.analyzing || p.materials.length === 0}
          >
            {p.analyzing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Проанализировать
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm">Файлы (PDF, изображения, аудио — до 25 МБ)</Label>
          <div className="flex items-center gap-2 mt-1">
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={acceptedFileMimes()}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
              Выбрать файлы
            </Button>
            <span className="text-xs text-muted-foreground">
              DOCX/PPTX — экспортируйте в PDF или вставьте текст ниже
            </span>
          </div>
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
              placeholder="Вставьте цитату, тезисы или содержание DOCX/PPTX…"
            />
            <Button variant="outline" size="sm" onClick={addText}><FileText className="w-4 h-4 mr-1" /> Добавить</Button>
          </div>
        </div>

        {p.materials.length > 0 && (
          <div className="space-y-1.5">
            {p.materials.map(m => (
              <div key={m.id} className="flex items-center gap-2 border rounded px-2 py-1.5 bg-muted/30">
                <IconFor kind={m.kind} />
                <Badge variant="secondary" className="text-xs">{kindLabel(m.kind)}</Badge>
                <span className="text-sm flex-1 truncate">{m.name || m.url || m.text}</span>
                <Button variant="ghost" size="sm" onClick={() => remove(m.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
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
            {p.analysis.summary && <p className="text-sm">{p.analysis.summary}</p>}
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
                <summary className="cursor-pointer font-medium">Найдено источников: {p.analysis.detected_sources.length}</summary>
                <ul className="text-xs mt-1 space-y-1">
                  {p.analysis.detected_sources.map((s: any, i: number) => (
                    <li key={i}>{[s.authors, s.title, s.journal, s.year, s.doi_or_pmid].filter(Boolean).join('. ')}</li>
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
