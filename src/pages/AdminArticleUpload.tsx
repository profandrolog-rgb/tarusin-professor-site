// AI-загрузка статьи — точка входа: .docx → авто-редирект в Оркестратор с текстом.
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import mammoth from "mammoth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2, FileText, Sparkles } from "lucide-react";

export default function AdminArticleUpload() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);

  if (loading) return <div className="container py-12">Загрузка…</div>;
  if (!user || !isAdmin) return <div className="container py-12">Доступ запрещён</div>;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const { value: rawText } = await mammoth.extractRawText({ arrayBuffer: buf });
      const text = (rawText || "").trim();
      if (text.length < 50) {
        toast({ title: "Слишком короткий текст", description: "В файле менее 50 символов", variant: "destructive" });
        return;
      }
      const title = file.name.replace(/\.[^.]+$/, "");
      toast({ title: "Файл загружен", description: "Открываю Оркестратор…" });
      navigate("/admin/article-orchestrator", { state: { text, title, autoStart: false } });
    } catch (err: any) {
      toast({ title: "Ошибка чтения", description: err?.message || "Не удалось распарсить .docx", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin"><ArrowLeft className="w-4 h-4 mr-1" /> Админ</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-amber-500" /> ИИ-загрузка статьи
        </h1>
        <p className="text-muted-foreground mt-1">
          Загрузите Word-файл — статья автоматически откроется в Оркестраторе для ревью несколькими ИИ.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>1. Загрузить .docx</CardTitle></CardHeader>
        <CardContent>
          <div
            className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-10 text-center cursor-pointer hover:bg-primary/10 transition"
            onClick={() => inputRef.current?.click()}
          >
            {parsing ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <div>Читаю файл…</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-primary" />
                <div className="font-medium">Перетащите или нажмите для выбора .docx</div>
                <div className="text-xs text-muted-foreground">Word-документ с текстом статьи</div>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".docx"
              hidden
              onChange={onFile}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Дальнейший поток</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div className="flex gap-2"><span className="font-mono text-primary">1.</span> Загрузка .docx (здесь)</div>
          <div className="flex gap-2"><span className="font-mono text-primary">2.</span> Авто-открытие <b>Оркестратора</b> — ревью всех моделей</div>
          <div className="flex gap-2"><span className="font-mono text-primary">3.</span> Выбор правок галочками</div>
          <div className="flex gap-2"><span className="font-mono text-primary">4.</span> Переписывание с сохранением вашего голоса</div>
          <div className="flex gap-2"><span className="font-mono text-primary">5.</span> Кнопка «Разместить» → форма импорта (SEO) → Сохранить</div>
        </CardContent>
      </Card>
    </div>
  );
}
