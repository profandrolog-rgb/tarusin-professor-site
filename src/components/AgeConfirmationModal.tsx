import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

const COOKIE_NAME = "age_confirmed_18";
const COOKIE_DAYS = 365;

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name: string, value: string, days: number) {
  const d = new Date();
  d.setTime(d.getTime() + days * 86400000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

interface AgeConfirmationModalProps {
  children: React.ReactNode;
}

const AgeConfirmationModal = ({ children }: AgeConfirmationModalProps) => {
  const [confirmed, setConfirmed] = useState(true); // default true to prevent flash

  useEffect(() => {
    setConfirmed(getCookie(COOKIE_NAME) === "true");
  }, []);

  const handleConfirm = () => {
    setCookie(COOKIE_NAME, "true", COOKIE_DAYS);
    setConfirmed(true);
  };

  return (
    <>
      <Dialog open={!confirmed} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-destructive" />
              </div>
              <DialogTitle className="text-xl">Возрастное ограничение 18+</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Материалы данного раздела носят научно-образовательный характер и содержат
              медицинские изображения и видео клинических случаев. Они не предназначены
              для возбуждения сексуального интереса и не являются «информацией порнографического
              характера» в смысле п.&nbsp;8 ст.&nbsp;2 ФЗ №&nbsp;436‑ФЗ.
              <br /><br />
              Все материалы опубликованы на основании универсального информированного согласия
              для использования в научных, аналитических, учебных и просветительских целях.
              Просмотр осуществляется на ваш страх и риск.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleConfirm} className="w-full mt-4" size="lg">
            Мне есть 18 лет, продолжить
          </Button>
        </DialogContent>
      </Dialog>
      {children}
    </>
  );
};

export default AgeConfirmationModal;
