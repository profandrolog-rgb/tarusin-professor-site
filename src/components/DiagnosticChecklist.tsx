import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertTriangle, Info, ArrowRight, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

const weights = [3, 2, 3, 2, 2, 3, 2, 2, 1, 2, 1, 2];

const DiagnosticChecklist = () => {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const { t } = useTranslation();

  const items = t("checklist.items", { returnObjects: true }) as string[];

  const toggle = (idx: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
    setShowResult(false);
  };

  const totalWeight = Array.from(checked).reduce((sum, idx) => sum + (weights[idx] || 0), 0);

  const getResult = () => {
    if (totalWeight === 0) return null;
    if (totalWeight <= 2) return {
      level: "low" as const,
      title: t("checklist.lowTitle"),
      text: t("checklist.lowText"),
      color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: <Info className="w-5 h-5" />,
    };
    if (totalWeight <= 5) return {
      level: "medium" as const,
      title: t("checklist.medTitle"),
      text: t("checklist.medText"),
      color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      icon: <AlertTriangle className="w-5 h-5" />,
    };
    return {
      level: "high" as const,
      title: t("checklist.highTitle"),
      text: t("checklist.highText"),
      color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      icon: <AlertTriangle className="w-5 h-5" />,
    };
  };

  const result = getResult();

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("checklist.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("checklist.subtitle")}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                {t("checklist.markSymptoms")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, i) => (
                <label key={i} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checked.has(i) ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:bg-muted/50"
                }`}>
                  <Checkbox checked={checked.has(i)} onCheckedChange={() => toggle(i)} className="mt-0.5" />
                  <span className="text-sm text-foreground leading-snug">{item}</span>
                </label>
              ))}

              <div className="pt-4 flex gap-3">
                <Button onClick={() => setShowResult(true)} disabled={checked.size === 0} className="flex-1">
                  {t("checklist.getResult")} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                {checked.size > 0 && (
                  <Button variant="outline" onClick={() => { setChecked(new Set()); setShowResult(false); }}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {showResult && result && (
                <div className={`mt-4 p-4 rounded-xl border ${result.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.icon}
                    <h3 className="font-semibold">{result.title}</h3>
                  </div>
                  <p className="text-sm mb-3">{result.text}</p>
                  {result.level !== "low" && (
                    <Button asChild size="sm" className="mt-1">
                      <a href="#contact">{t("nav.bookAppointmentFull")} <ArrowRight className="w-3 h-3 ml-1" /></a>
                    </Button>
                  )}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center pt-2">{t("checklist.disclaimer")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DiagnosticChecklist;
