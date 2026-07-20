import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wand2, Rocket, Undo2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RefinementEntry {
  id: string;
  action: string;
  prompt?: string;
  diff_summary?: string;
  snapshot_content: string;
  created_at: string;
}

const ACTIONS: { key: string; label: string }[] = [
  { key: 'shorten', label: 'Сократить' },
  { key: 'deepen', label: 'Углубить' },
  { key: 'expand', label: 'Расширить/Дополнить' },
  { key: 'merge', label: 'Объединить с материалами' },
  { key: 'rewrite_scientific', label: 'Переписать научнее' },
];

interface Props {
  reviewId: string;
  title: string;
  currentContent: string;
  materialsContext: string;
  history: RefinementEntry[];
  onApply: (newContent: string, entry: RefinementEntry) => void;
  onRollback: (entry: RefinementEntry) => void;
  onOrchestrate: () => Promise<void>;
  orchestrating: boolean;
}

export default function RefinementChat(p: Props) {
  const [busy, setBusy] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  async function run(action: string, custom_prompt?: string) {
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
          materials_context: p.materialsContext,
          title: p.title,
        },
      });
      if (error) throw error;
      if (!data?.new_content) throw new Error('пустой ответ');
      const entry: RefinementEntry = {
        id: crypto.randomUUID(),
        action: action || 'custom',
        prompt: custom_prompt,
        diff_summary: data.diff_summary,
        snapshot_content: p.currentContent,
        created_at: new Date().toISOString(),
      };
      p.onApply(data.new_content, entry);
      toast.success('Правка применена');
      if (!action) setCustomPrompt('');
    } catch (e: any) {
      toast.error(e?.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
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
            <Button
              key={a.key}
              variant="outline"
              size="sm"
              onClick={() => run(a.key)}
              disabled={busy}
            >
              {a.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={2}
            placeholder="Свободный запрос к модели: например, «добавь раздел про диагностику у подростков»…"
          />
          <Button
            size="sm"
            onClick={() => run('', customPrompt)}
            disabled={busy || !customPrompt.trim()}
          >
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
            Применить
          </Button>
        </div>

        {p.history.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <h4 className="text-sm font-semibold">История правок</h4>
            {p.history.slice().reverse().map(h => (
              <div key={h.id} className="flex items-start gap-2 text-xs border rounded px-2 py-1.5 bg-muted/20">
                <div className="flex-1">
                  <div className="font-medium">{h.action}{h.prompt ? `: ${h.prompt.slice(0, 100)}` : ''}</div>
                  {h.diff_summary && <div className="text-muted-foreground">{h.diff_summary}</div>}
                  <div className="text-muted-foreground">{new Date(h.created_at).toLocaleString('ru-RU')}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => p.onRollback(h)} title="Откатить к состоянию до этой правки">
                  <Undo2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
