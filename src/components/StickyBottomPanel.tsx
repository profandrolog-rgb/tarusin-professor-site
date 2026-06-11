import { useState } from "react";
import { Phone, MessageCircleQuestion, X, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const StickyBottomPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", question: "" });
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.question.trim()) {
      toast({ title: t("sticky.fillAll"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("questions").insert({
        author_name: formData.name.trim(),
        author_email: formData.email.trim(),
        question_text: formData.question.trim(),
      });
      if (error) throw error;
      toast({ title: t("sticky.questionSent"), description: t("sticky.questionSentDesc") });
      setFormData({ name: "", email: "", question: "" });
      setQuestionOpen(false);
    } catch {
      toast({ title: t("sticky.errorSending"), description: t("sticky.tryLater"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {isExpanded && (
        <div className="bg-card border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-foreground">{t("sticky.bookAppointment")}</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}><X className="w-5 h-5" /></Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-accent/10 border-2 border-accent/30 relative">
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full uppercase tracking-wider">{t("sticky.priority")}</div>
                <h4 className="font-semibold text-foreground mb-2 mt-1">{isEn ? "Dr. Matara's Clinic" : t("hero.mataraClinic")}</h4>
                <p className="text-xs text-muted-foreground mb-3">{isEn ? "Moscow, Korovinskoye Hwy 9, Bldg 2" : "Москва, Коровинское шоссе д. 9 к. 2"}</p>
                <div className="space-y-1.5">
                  <a href="tel:+74953030000" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"><Phone className="w-3.5 h-3.5" /> +7 (495) 303-00-00 <span className="text-xs text-muted-foreground font-normal">({t("sticky.reception")})</span></a>
                  <a href="tel:+79263030111" className="flex items-center gap-2 text-sm text-primary hover:underline"><Phone className="w-3.5 h-3.5" /> +7 (926) 303-01-11 <span className="text-xs text-muted-foreground font-normal">({t("sticky.booking")})</span></a>
                  <a href="tel:+79160303031" className="flex items-center gap-2 text-sm text-primary hover:underline"><Phone className="w-3.5 h-3.5" /> +7 (916) 030-30-31 <span className="text-xs text-muted-foreground font-normal">({t("sticky.booking")})</span></a>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <h4 className="font-semibold text-foreground mb-2">{t("hero.aveClinic")}</h4>
                <p className="text-xs text-muted-foreground mb-3">{isEn ? "Nemchinovka, 3rd Zaprudnaya St. 16" : "с. Немчиновка, 3-я Запрудная ул. дом 16"}</p>
                <div className="space-y-1.5">
                  <a href="https://wa.me/79266005550" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline"><Phone className="w-3.5 h-3.5" /> +7 (926) 600-555-0 <span className="text-xs text-muted-foreground font-normal">(WhatsApp, Telegram, MAX)</span></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)} className="text-primary-foreground hover:bg-primary-foreground/10 gap-2 font-semibold">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">{t("sticky.bookAppointment")}</span>
              <span className="sm:hidden">{t("sticky.bookShort")}</span>
              <ChevronUp className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </Button>
            <div className="hidden md:flex items-center gap-4">
              <a href="tel:+74953030000" className="text-sm text-primary-foreground/90 hover:text-primary-foreground transition-colors">+7 (495) 303-00-00</a>
              <span className="text-primary-foreground/30">|</span>
              <a href="tel:+79266005550" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">+7 (926) 600-555-0</a>
            </div>
            <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                  <MessageCircleQuestion className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("sticky.askQuestion")}</span>
                  <span className="sm:hidden">{t("sticky.askShort")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{t("sticky.questionTitle")}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmitQuestion} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="q-name">{t("sticky.yourName")}</Label><Input id="q-name" placeholder="..." value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label htmlFor="q-email">{t("sticky.emailForReply")}</Label><Input id="q-email" type="email" placeholder="example@mail.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="space-y-2"><Label htmlFor="q-text">{t("sticky.yourQuestion")}</Label><Textarea id="q-text" placeholder="..." rows={4} value={formData.question} onChange={(e) => setFormData(p => ({ ...p, question: e.target.value }))} /></div>
                  <p className="text-xs text-muted-foreground">{t("sticky.questionHint")}</p>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                    {isSubmitting ? t("sticky.sendingQuestion") : t("sticky.sendQuestion")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyBottomPanel;
