import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, FileText, Printer, Eraser, Loader2 } from 'lucide-react';
import { stripMarkers, countMarkers } from '@/lib/research/markers';
import { exportReviewDocx } from '@/lib/research/exportReviewDocx';
import { exportReviewPdf } from '@/lib/research/exportReviewPdf';

interface Props {
  title: string;
  annotation?: string;
  content: string;
  contentWithMarkers?: string;
  references: any[];
  onStripMarkers: () => void;
  onPrint: () => void;
}

export default function PublishBar(p: Props) {
  const [busy, setBusy] = useState<'docx' | 'pdf' | null>(null);
  const markerCount = countMarkers(p.content);

  async function doDocx() {
    setBusy('docx');
    try {
      await exportReviewDocx({
        title: p.title || 'Обзор',
        annotation: p.annotation,
        content: p.content,
        references: p.references || [],
      });
      toast.success('DOCX сохранён');
    } catch (e: any) {
      toast.error(e?.message || 'Ошибка DOCX');
    } finally {
      setBusy(null);
    }
  }

  async function doPdf() {
    setBusy('pdf');
    try {
      await exportReviewPdf({
        title: p.title || 'Обзор',
        annotation: p.annotation,
        content: p.content,
        references: p.references || [],
      });
      toast.success('PDF сохранён');
    } catch (e: any) {
      toast.error(e?.message || 'Ошибка PDF');
    } finally {
      setBusy(null);
    }
  }

  function doStrip() {
    if (markerCount === 0) {
      toast.info('Маркеров нет — очищать нечего');
      return;
    }
    p.onStripMarkers();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            Экспорт и подготовка к публикации
            {markerCount > 0 && <Badge variant="outline" className="font-mono">маркеров: {markerCount}</Badge>}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={doStrip} disabled={markerCount === 0}>
          <Eraser className="w-4 h-4 mr-1" /> Убрать маркеры источников
        </Button>
        <Button variant="outline" size="sm" onClick={doDocx} disabled={busy !== null}>
          {busy === 'docx' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
          Скачать DOCX
        </Button>
        <Button variant="outline" size="sm" onClick={doPdf} disabled={busy !== null}>
          {busy === 'pdf' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
          Скачать PDF
        </Button>
        <Button variant="outline" size="sm" onClick={p.onPrint}>
          <Printer className="w-4 h-4 mr-1" /> Печать
        </Button>
        {p.contentWithMarkers && countMarkers(p.contentWithMarkers) > 0 && countMarkers(p.content) === 0 && (
          <span className="text-xs text-muted-foreground self-center ml-2">
            Размеченная версия сохранена в content_with_markers ({countMarkers(p.contentWithMarkers)} маркеров).
          </span>
        )}
      </CardContent>
    </Card>
  );
}
