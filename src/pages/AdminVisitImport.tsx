import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Loader2, Check, Trash2, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProtocolImportDialog } from "@/components/visits/ProtocolImportDialog";

interface QueueItem {
  id: string;
  file: File;
  status: "pending" | "done";
  visitId?: string;
}

export default function AdminVisitImport() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: QueueItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      status: "pending",
    }));
    setItems((prev) => [...prev, ...next]);
  };

  const active = items.find((i) => i.id === activeId) || null;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Helmet>
        <title>Импорт протоколов из документов — админ-панель</title>
        <meta name="description" content="Массовое распознавание протоколов осмотров старого формата и перенос их в базу визитов." />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/visits"><ArrowLeft className="h-4 w-4 mr-1" /> К журналу визитов</Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Импорт протоколов</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Документы старого формата</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="file"
                multiple
                className="hidden"
                accept=".docx,.pdf,.txt,.md,.rtf,image/*"
                onChange={(e) => addFiles(e.target.files)}
              />
              <Upload className="h-7 w-7 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium mt-1">Перетащите документы или нажмите для выбора</p>
              <p className="text-xs text-muted-foreground">Word (.docx), PDF, фото/скан, текст — можно сразу несколько</p>
            </label>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                Каждый документ распознаётся отдельно: поля подбираются по смыслу, затем вы проверяете их и сохраняете как визит.
              </p>
            ) : (
              <div className="border rounded-md divide-y">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{item.file.name}</span>
                    {item.status === "done" ? (
                      <>
                        <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> сохранён</Badge>
                        {item.visitId && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/admin/visits/${item.visitId}`}>Открыть</Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button size="sm" onClick={() => setActiveId(item.id)}>
                        <Sparkles className="h-4 w-4 mr-1" /> Распознать
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ProtocolImportDialog
        open={!!active}
        onOpenChange={(open) => { if (!open) setActiveId(null); }}
        initialFile={active?.file || null}
        onSaved={(visitId) => {
          setItems((prev) => prev.map((i) => (i.id === activeId ? { ...i, status: "done", visitId } : i)));
          setActiveId(null);
        }}
      />
    </div>
  );
}
