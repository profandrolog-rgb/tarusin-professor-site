import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QASection = () => {
  const { data: questions = [] } = useQuery({
    queryKey: ["published-questions-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id, author_name, question_text, answer_text, created_at")
        .eq("is_published", true)
        .not("answer_text", "is", null)
        .order("answered_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  if (questions.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <MessageCircle size={16} />
            <span>Часто задаваемые вопросы</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Вопросы и ответы
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ответы профессора Тарусина Д.И. на вопросы пациентов
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {questions.map((q) => (
              <AccordionItem key={q.id} value={q.id} className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <div>
                    <p className="font-medium text-foreground text-base">{q.question_text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{q.author_name}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <div className="pl-4 border-l-2 border-primary/30">
                    <p className="text-muted-foreground whitespace-pre-line">{q.answer_text}</p>
                    <p className="text-xs text-primary mt-2 font-medium">— Профессор Тарусин Д.И.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-8">
            <Link to="/qa">
              <Button variant="outline" className="gap-2">
                Все вопросы и ответы
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QASection;
