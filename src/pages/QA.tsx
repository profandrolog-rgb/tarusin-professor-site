import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/PageMeta";

const QA = () => {
  const [search, setSearch] = useState("");
  const [questionOpen, setQuestionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", question: "" });
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const { data: questions = [] } = useQuery({
    queryKey: ["published-questions-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions_public" as any).select("*").eq("is_published", true).not("answer_text", "is", null).order("answered_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = questions.filter(q => q.question_text.toLowerCase().includes(search.toLowerCase()) || (q.answer_text && q.answer_text.toLowerCase().includes(search.toLowerCase())));

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.question.trim()) {
      toast({ title: t("sticky.fillAll"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("questions").insert({ author_name: formData.name.trim(), author_email: formData.email.trim(), question_text: formData.question.trim() });
      if (error) throw error;
      toast({ title: t("sticky.questionSent"), description: t("sticky.questionSentDesc") });
      setFormData({ name: "", email: "", question: "" });
      setQuestionOpen(false);
    } catch { toast({ title: t("sticky.errorSending"), variant: "destructive" }); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title={isEn ? "Q&A — Prof. Tarusin D.I." : "Вопросы и ответы — Проф. Тарусин Д.И."} description={isEn ? "Answers from Professor Tarusin to patient questions." : "Ответы профессора Тарусина Д.И. на вопросы пациентов."} path="/qa" />
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"><ArrowLeft className="w-4 h-4" />{isEn ? "Back to Home" : "На главную"}</Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{isEn ? "Questions & Answers" : "Вопросы и ответы"}</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">{isEn ? "My answers to patient and parent questions" : "Мои ответы на вопросы пациентов и их родителей"}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={isEn ? "Search questions..." : "Поиск по вопросам..."} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"><MessageCircle className="w-4 h-4" />{isEn ? "Ask a Question" : "Задать вопрос"}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{t("sticky.questionTitle")}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div className="space-y-2"><Label>{t("sticky.yourName")}</Label><Input placeholder="..." value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{t("sticky.emailForReply")}</Label><Input type="email" placeholder="example@mail.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{t("sticky.yourQuestion")}</Label><Textarea placeholder="..." rows={4} value={formData.question} onChange={(e) => setFormData(p => ({ ...p, question: e.target.value }))} /></div>
                <p className="text-xs text-muted-foreground">{t("sticky.questionHint")}</p>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>{isSubmitting ? t("sticky.sendingQuestion") : t("sticky.sendQuestion")}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="max-w-3xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{search ? (isEn ? "Nothing found for your query" : "Ничего не найдено по вашему запросу") : (isEn ? "No published questions yet" : "Пока нет опубликованных вопросов")}</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {filtered.map((q) => (
                <AccordionItem key={q.id} value={q.id} className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-md transition-shadow">
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <div>
                      <p className="font-medium text-foreground text-base">{q.question_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{q.author_name} • {new Date(q.created_at).toLocaleDateString(isEn ? "en-US" : "ru-RU")}</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="pl-4 border-l-2 border-primary/30">
                      <p className="text-muted-foreground whitespace-pre-line">{q.answer_text}</p>
                      <p className="text-xs text-primary mt-2 font-medium">{t("qa.answeredBy")}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </main>
    </div>
  );
};

export default QA;
