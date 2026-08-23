import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const AGE_COOKIE = "age_confirmed_18";
/** Отдельное осознанное согласие именно на просмотр клинических материалов. */
const CLINICAL_COOKIE = "clinical_gallery_acknowledged";
const COOKIE_DAYS = 365;
export const CLINICAL_ACK_EVENT = "clinical-gallery-acknowledged";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match?.[2] ?? null;
}

function writeCookie(name: string, value: string) {
  const d = new Date();
  d.setTime(d.getTime() + COOKIE_DAYS * 86400000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

/** Подтверждён ли возраст (общая cookie сайта, в т.ч. со страницы /results). */
export function getAgeConfirmedCookie(): boolean {
  return readCookie(AGE_COOKIE) === "true";
}

/** Принято ли отдельное медицинское предупреждение перед клиническими галереями. */
export function getClinicalAcknowledgedCookie(): boolean {
  return readCookie(CLINICAL_COOKIE) === "1";
}

/** Фиксирует оба состояния: возраст и осознанное согласие на клинические материалы. */
export function setClinicalAcknowledgedCookie() {
  writeCookie(AGE_COOKIE, "true");
  writeCookie(CLINICAL_COOKIE, "1");
  window.dispatchEvent(new Event(CLINICAL_ACK_EVENT));
}

interface Props {
  /** Вызывается после подтверждения совершеннолетия. */
  onConfirm: () => void;
}

/**
 * Шторка 18+ поверх клинической галереи: сильный блюр изображений задаётся
 * снаружи, здесь — затемнение, юридический текст и кнопка подтверждения.
 * Адаптируется к высоте галереи: на низких блоках юридический текст сворачивается.
 */
const ClinicalCurtain = ({ onConfirm }: Props) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const ref = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setCompact(el.clientHeight < 420);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Если согласие принято в другой галерее на этой же странице — открываем и эту.
  useEffect(() => {
    const onExternal = () => onConfirm();
    window.addEventListener(CLINICAL_ACK_EVENT, onExternal);
    return () => window.removeEventListener(CLINICAL_ACK_EVENT, onExternal);
  }, [onConfirm]);

  const showLegal = !compact || expanded;
  // Возраст уже подтверждён ранее — повторно про 18 лет не спрашиваем,
  // но медицинское предупреждение показываем обязательно.
  const [ageKnown] = useState(() => getAgeConfirmedCookie());

  const handleClick = () => {
    setClinicalAcknowledgedCookie();
    onConfirm();
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-20 flex items-center justify-center overflow-auto rounded-lg bg-background/80 backdrop-blur-[2px] p-4 md:p-6"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="w-full max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
          <span className="text-xs md:text-sm font-semibold tracking-widest uppercase text-destructive">
            {isEn ? "Clinical images · 18+" : "Клинические изображения · 18+"}
          </span>
        </div>

        {showLegal ? (
          <div className="space-y-3 text-xs md:text-sm text-muted-foreground leading-relaxed text-left">
            <p>
              {isEn
                ? "This section contains de-identified clinical photographs, including images of the external genitalia of minor patients."
                : "Данный раздел содержит обезличенные клинические фотографии, включая изображения наружных половых органов несовершеннолетних пациентов."}
            </p>
            <p>
              {isEn
                ? "The materials are provided solely for medical, scientific and educational purposes: to demonstrate diseases and developmental anomalies, diagnostic methods, surgical treatment and its results."
                : "Материалы представлены исключительно в медицинских, научных и образовательных целях для демонстрации заболеваний и аномалий развития, методов диагностики, хирургического лечения и его результатов."}
            </p>
            <p>
              {isEn
                ? "Under note 2 to Article 242.1 of the Criminal Code of the Russian Federation, materials containing images of the genitalia of minors and intended for scientific, medical or educational use in the manner established by federal law are not materials containing pornographic images of minors."
                : "В соответствии с примечанием 2 к статье 242.1 УК РФ материалы, содержащие изображения половых органов несовершеннолетних и предназначенные для использования в научных или медицинских целях либо в образовательной деятельности в установленном федеральным законом порядке, не являются материалами с порнографическими изображениями несовершеннолетних."}
            </p>
            <p>
              {isEn
                ? "Access to clinical images is granted only after confirmation of adulthood and the user's informed choice."
                : "Доступ к клиническим изображениям предоставляется только после подтверждения совершеннолетия и осознанного выбора пользователя."}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs text-primary hover:underline"
          >
            {isEn ? "Legal notice — details" : "Правовая информация — подробнее"}
          </button>
        )}

        <p className="mt-4 text-xs md:text-sm text-foreground font-medium">
          {ageKnown
            ? isEn
              ? "By clicking “Open clinical gallery” I confirm that I have read this notice and understand the medical and educational nature of these materials."
              : "Нажимая «Открыть клиническую галерею», я подтверждаю, что ознакомился с предупреждением и понимаю медицинский и образовательный характер представленных материалов."
            : isEn
              ? "By clicking “Open clinical gallery” I confirm that I am 18 years old and that I understand the medical and educational nature of these materials."
              : "Нажимая «Открыть клиническую галерею», я подтверждаю, что мне исполнилось 18 лет и я понимаю медицинский и образовательный характер представленных материалов."}
        </p>

        <Button onClick={handleClick} size="lg" className="mt-4">
          {isEn ? "Open clinical gallery" : "Открыть клиническую галерею"}
        </Button>

        {showLegal && (
          <p className="mt-4 text-[11px] leading-snug text-muted-foreground">
            {isEn
              ? "Legal basis: notes 1 and 2 to Article 242.1 of the Criminal Code of the Russian Federation; Federal Law No. 436-FZ “On the protection of children from information harmful to their health and development”."
              : "Правовые основания: примечания 1 и 2 к ст. 242.1 УК РФ; Федеральный закон №436-ФЗ «О защите детей от информации, причиняющей вред их здоровью и развитию»."}
          </p>
        )}
      </div>
    </div>
  );
};

export default ClinicalCurtain;
