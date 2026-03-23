import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminQuestions = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "answered">("all");
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, loading, navigate]);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const answerMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const { error } = await supabase
        .from("questions")
        .update({
          answer_text: answer,
          status: "answered",
          answered_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Ответ сохранён" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("questions")
        .update({ is_published: published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Статус обновлён" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      toast({ title: "Вопрос удалён" });
    },
  });

  const filtered = questions.filter((q) => {
    if (filter === "pending") return q.status === "pending";
    if (filter === "answered") return q.status === "answered";
    return true;
  });

  const pendingCount = questions.filter((q) => q.status === "pending").length;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Панель управления
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Вопросы пациентов</h1>
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} без ответа</Badge>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {([
            ["all", "Все", questions.length],
            ["pending", "Без ответа", pendingCount],
            ["answered", "С ответом", questions.length - pendingCount],
          ] as const).map(([key, label, count]) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(key)}
            >
              {label} ({count})
            </Button>
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {filtered.map((q) => (
            <Card key={q.id} className={q.status === "pending" ? "border-accent/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{q.question_text}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {q.author_name} • {q.author_email} • {new Date(q.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.status === "pending" ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <Clock className="w-3 h-3 mr-1" /> Ожидает
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" /> Отвечен
                      </Badge>
                    )}
                    {q.is_published && (
                      <Badge className="bg-primary/10 text-primary">Опубликован</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Answer */}
                {q.status === "answered" && q.answer_text ? (
                  <div className="pl-4 border-l-2 border-primary/30 bg-secondary/30 rounded-r-lg p-3">
                    <p className="text-sm text-foreground whitespace-pre-line">{q.answer_text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Ответ дан {q.answered_at && new Date(q.answered_at).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                ) : null}

                {/* Answer form */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Введите ответ..."
                    value={answerDrafts[q.id] ?? q.answer_text ?? ""}
                    onChange={(e) => setAnswerDrafts((p) => ({ ...p, [q.id]: e.target.value }))}
                    rows={3}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => {
                        const answer = answerDrafts[q.id]?.trim();
                        if (!answer) return;
                        answerMutation.mutate({ id: q.id, answer });
                        setAnswerDrafts((p) => {
                          const next = { ...p };
                          delete next[q.id];
                          return next;
                        });
                      }}
                      disabled={answerMutation.isPending}
                      className="gap-1"
                    >
                      <Send className="w-3 h-3" />
                      {q.status === "answered" ? "Обновить ответ" : "Ответить"}
                    </Button>
                    {q.status === "answered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePublishMutation.mutate({ id: q.id, published: !q.is_published })}
                      >
                        {q.is_published ? (
                          <><EyeOff className="w-3 h-3 mr-1" /> Скрыть</>
                        ) : (
                          <><Eye className="w-3 h-3 mr-1" /> Опубликовать</>
                        )}
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Удалить вопрос?</AlertDialogTitle>
                          <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(q.id)}>
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Нет вопросов</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminQuestions;
