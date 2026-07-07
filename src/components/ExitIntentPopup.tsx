import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "exit_popup_shown";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h

const ExitIntentPopup = () => {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const shouldShow = useCallback(() => {
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - Number(last) < COOLDOWN_MS) return false;
    return true;
  }, []);

  const show = useCallback(() => {
    if (!shouldShow()) return;
    setOpen(true);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, [shouldShow]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5) show();
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [show]);

  const scrollToContact = () => {
    setOpen(false);
    setTimeout(() => {
      document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const openWhatsApp = () => {
    setOpen(false);
    window.open("https://wa.me/79266005550", "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEn ? "Have questions?" : "Есть вопросы?"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isEn
              ? "Book a free consultation or send us a message — we'll respond within 24 hours."
              : "Запишитесь на бесплатную консультацию или напишите нам — ответим в течение 24 часов."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <Button onClick={scrollToContact} className="w-full">
            <CalendarCheck className="w-4 h-4 mr-2" />
            {isEn ? "Book Consultation" : "Записаться на приём"}
          </Button>
          <Button variant="outline" onClick={openWhatsApp} className="w-full">
            <MessageCircle className="w-4 h-4 mr-2" />
            {isEn ? "Message via WhatsApp" : "Написать в WhatsApp"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentPopup;
