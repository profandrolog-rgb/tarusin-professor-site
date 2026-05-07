import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, RotateCcw, CheckCircle, AlertTriangle, Info, Calendar } from "lucide-react";
import { ChecklistDefinition, ChecklistResultRule } from "@/data/checklists/types";
import { supabase } from "@/integrations/supabase/client";

function getAnonymousId(): string {
  const KEY = "anonymous_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

interface Props {
  checklist: ChecklistDefinition;
}

type Phase = "intro" | "questions" | "result";

export default function ChecklistRunner({ checklist }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [consent, setConsent] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; score: number }>>({});
  const [resultRule, setResultRule] = useState<ChecklistResultRule | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const startTime = useRef<number>(0);

  const questions = checklist.questions;
  const progress = ((currentQ + 1) / questions.length) * 100;

  const handleStart = useCallback(() => {
    startTime.current = Date.now();
    setPhase("questions");
  }, []);

  const handleAnswer = useCallback((questionId: string, value: string, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: { value, score } }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
    } else {
      // Calculate result
      const score = Object.values(answers).reduce((s, a) => s + a.score, 0);
      setTotalScore(score);
      const rule = checklist.results.find(r => score >= r.minScore && score <= r.maxScore) || checklist.results[checklist.results.length - 1];
      setResultRule(rule);
      setPhase("result");

      // Save to DB silently
      const durationSec = Math.round((Date.now() - startTime.current) / 1000);
      const payload = {
        checklist_slug: checklist.slug,
        answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.value])),
        result_level: rule.level,
        result_score: score,
        duration_sec: durationSec,
        anonymous_id: getAnonymousId(),
        user_agent: navigator.userAgent,
      };
      supabase.from("checklist_responses").insert(payload).then(({ error }) => {
        if (error) console.error("Failed to save checklist response:", error);
      });
    }
  }, [currentQ, questions.length, answers, checklist]);

  const handleBack = useCallback(() => {
    if (currentQ > 0) setCurrentQ(c => c - 1);
  }, [currentQ]);

  const handleRestart = useCallback(() => {
    setPhase("intro");
    setConsent(false);
    setCurrentQ(0);
    setAnswers({});
    setResultRule(null);
    setTotalScore(0);
  }, []);

  const currentQuestion = questions[currentQ];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const resultColors: Record<string, string> = {
    low: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  };

  const resultIcons: Record<string, JSX.Element> = {
    low: <Info className="w-6 h-6" />,
    medium: <AlertTriangle className="w-6 h-6" />,
    high: <AlertTriangle className="w-6 h-6" />,
  };

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <Card className="border-border shadow-lg">
              <CardContent className="p-6 md:p-8 space-y-6">
                <h2 className="text-2xl font-bold text-foreground">{checklist.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{checklist.intro}</p>
                <p className="text-sm text-muted-foreground">Тест содержит {questions.length} вопросов и займёт около 2 минут.</p>
                <label className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30 cursor-pointer">
                  <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
                  <span className="text-sm text-foreground leading-snug">{checklist.consentLabel}</span>
                </label>
                <Button onClick={handleStart} disabled={!consent} className="w-full" size="lg">
                  Начать проверку <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "questions" && currentQuestion && (
          <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
            <Card className="border-border shadow-lg">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Вопрос {currentQ + 1} из {questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{currentQuestion.text}</h3>
                  {currentQuestion.description && <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>}
                </div>

                <div className="space-y-2">
                  {currentQuestion.options.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentAnswer?.value === opt.value
                          ? "bg-primary/5 border-primary/30"
                          : "bg-card border-border hover:bg-muted/50"
                      }`}
                      onClick={() => handleAnswer(currentQuestion.id, opt.value, opt.score)}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        currentAnswer?.value === opt.value ? "border-primary bg-primary" : "border-muted-foreground/40"
                      }`}>
                        {currentAnswer?.value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                      </div>
                      <span className="text-sm text-foreground">{opt.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  {currentQ > 0 && (
                    <Button variant="outline" onClick={handleBack}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Назад
                    </Button>
                  )}
                  <Button onClick={handleNext} disabled={!currentAnswer} className="flex-1">
                    {currentQ < questions.length - 1 ? (
                      <>Далее <ArrowRight className="w-4 h-4 ml-2" /></>
                    ) : (
                      <>Получить результат <CheckCircle className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "result" && resultRule && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <Card className="border-border shadow-lg">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className={`p-5 rounded-xl border ${resultColors[resultRule.level]}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {resultIcons[resultRule.level]}
                    <h3 className="text-xl font-bold">{resultRule.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed">{resultRule.text}</p>
                </div>

                {resultRule.level !== "low" && (
                  <Button asChild size="lg" className="w-full">
                    <a href="/#contact">
                      <Calendar className="w-4 h-4 mr-2" /> Записаться на консультацию
                    </a>
                  </Button>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleRestart} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" /> Пройти заново
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  Результат носит информационный характер и не является медицинским диагнозом. 
                  Для точной диагностики обратитесь к врачу.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
