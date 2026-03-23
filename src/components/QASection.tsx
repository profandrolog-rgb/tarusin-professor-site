import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const QASection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: questions = [] } = useQuery({
    queryKey: ["published-questions-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id, author_name, question_text, answer_text, created_at")
        .eq("is_published", true)
        .not("answer_text", "is", null)
        .order("answered_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const goNext = useCallback(() => {
    if (questions.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  }, [questions.length]);

  const goPrev = useCallback(() => {
    if (questions.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
  }, [questions.length]);

  useEffect(() => {
    if (isPaused || questions.length <= 1) return;
    const interval = setInterval(goNext, 6000);
    return () => clearInterval(interval);
  }, [isPaused, goNext, questions.length]);

  if (questions.length === 0) return null;

  const current = questions[currentIndex];

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

        <div
          className="max-w-3xl mx-auto relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation arrows */}
          {questions.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -left-4 md:-left-14 top-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card shadow-md rounded-full"
                onClick={goPrev}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-4 md:-right-14 top-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card shadow-md rounded-full"
                onClick={goNext}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Card */}
          <Card className="border border-border shadow-md transition-all duration-500 min-h-[200px]">
            <CardContent className="p-6 md:p-8">
              <div className="mb-4">
                <p className="font-semibold text-foreground text-lg leading-relaxed">
                  «{current.question_text}»
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {current.author_name} • {new Date(current.created_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <div className="pl-4 border-l-2 border-primary/30 mt-4">
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {current.answer_text}
                </p>
                <p className="text-xs text-primary mt-3 font-medium">— Профессор Тарусин Д.И.</p>
              </div>
            </CardContent>
          </Card>

          {/* Dots */}
          {questions.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "bg-primary w-6"
                      : "bg-primary/25 hover:bg-primary/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <Link to="/qa">
            <Button variant="outline" className="gap-2">
              Все вопросы и ответы
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default QASection;
