import { Card } from "@/components/ui/card";
import { Phone, FileText, Stethoscope, ClipboardCheck, Scissors, HeartPulse, CalendarCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

const stepsRu = [
  { icon: Phone, title: "Запись на приём", description: "Позвоните или напишите в WhatsApp. Мы подберём удобное время и клинику.", detail: "+7 (926) 600-555-0" },
  { icon: FileText, title: "Подготовка", description: "Соберите результаты предыдущих обследований, выписки и направления.", detail: "Список — в разделе «Памятка пациенту»" },
  { icon: Stethoscope, title: "Первичная консультация", description: "Осмотр, УЗИ-диагностика, обсуждение диагноза и плана лечения.", detail: "45–60 минут" },
  { icon: ClipboardCheck, title: "Предоперационная подготовка", description: "Если нужна операция — назначим анализы и обследования, объясним каждый шаг.", detail: "Список анализов выдаём на приёме" },
  { icon: Scissors, title: "Операция", description: "Современные микрохирургические методики, щадящий наркоз, минимальная травматичность.", detail: "Стационар 1–3 дня" },
  { icon: HeartPulse, title: "Восстановление", description: "Подробные рекомендации, связь с врачом в мессенджере, контроль заживления.", detail: "Памятка + фотоконтроль" },
  { icon: CalendarCheck, title: "Контрольные осмотры", description: "Плановые визиты через 1, 3 и 6 месяцев для оценки результата.", detail: "Наблюдение до полного выздоровления" },
];

const stepsEn = [
  { icon: Phone, title: "Book an Appointment", description: "Call or message via WhatsApp. We'll find a convenient time and clinic.", detail: "+7 (926) 600-555-0" },
  { icon: FileText, title: "Preparation", description: "Gather results of previous examinations, medical records and referrals.", detail: "See 'Patient Memo' section" },
  { icon: Stethoscope, title: "Initial Consultation", description: "Examination, ultrasound diagnostics, discussion of diagnosis and treatment plan.", detail: "45–60 minutes" },
  { icon: ClipboardCheck, title: "Pre-operative Preparation", description: "If surgery is needed — we'll order tests and examinations, explaining every step.", detail: "Test list provided at the visit" },
  { icon: Scissors, title: "Surgery", description: "Modern microsurgical techniques, gentle anesthesia, minimal invasiveness.", detail: "Hospital stay 1–3 days" },
  { icon: HeartPulse, title: "Recovery", description: "Detailed recommendations, doctor contact via messenger, healing monitoring.", detail: "Instructions + photo monitoring" },
  { icon: CalendarCheck, title: "Follow-up Visits", description: "Scheduled visits at 1, 3, and 6 months to assess results.", detail: "Monitoring until full recovery" },
];

const PatientJourney = () => {
  const { t, i18n } = useTranslation();
  const steps = i18n.language === "en" ? stepsEn : stepsRu;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("journey.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("journey.subtitle")}</p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-px hidden sm:block" />
          <div className="space-y-6 sm:space-y-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLeft = i % 2 === 0;
              return (
                <div key={i} className={`relative flex items-start gap-4 sm:gap-0 ${isLeft ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                  {/* Hidden center dot for timeline continuity */}
                  <div className="hidden sm:block sm:absolute sm:left-1/2 sm:-translate-x-1/2 w-3 h-3 rounded-full bg-primary z-10 mt-4" />
                  <div className={`flex-1 sm:w-[calc(50%-1.5rem)] ${isLeft ? "sm:pr-6" : "sm:pl-6"}`}>
                    <Card className="p-4 border-border hover:shadow-md transition-shadow">
                      <div className={`flex items-center gap-3 mb-2 ${isLeft ? "sm:flex-row-reverse" : ""}`}>
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className={`flex-1 ${isLeft ? "sm:text-right" : ""}`}>
                          <span className="text-xs font-medium text-primary">{t("journey.step", { n: i + 1 })}</span>
                          <h3 className="font-semibold text-foreground">{step.title}</h3>
                        </div>
                      </div>
                      <p className={`text-sm text-muted-foreground mb-2 ${isLeft ? "sm:text-right" : ""}`}>{step.description}</p>
                      <p className={`text-xs text-primary font-medium ${isLeft ? "sm:text-right" : ""}`}>{step.detail}</p>
                    </Card>
                  </div>
                  <div className="hidden sm:block sm:w-[calc(50%-1.5rem)]" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PatientJourney;
