import { Card } from "@/components/ui/card";
import { Phone, FileText, Stethoscope, ClipboardCheck, Scissors, HeartPulse, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: Phone,
    title: "Запись на приём",
    description: "Позвоните или напишите в WhatsApp. Мы подберём удобное время и клинику.",
    detail: "+7 (926) 600-555-0",
  },
  {
    icon: FileText,
    title: "Подготовка",
    description: "Соберите результаты предыдущих обследований, выписки и направления.",
    detail: "Список — в разделе «Памятка пациенту»",
  },
  {
    icon: Stethoscope,
    title: "Первичная консультация",
    description: "Осмотр, УЗИ-диагностика, обсуждение диагноза и плана лечения.",
    detail: "45–60 минут",
  },
  {
    icon: ClipboardCheck,
    title: "Предоперационная подготовка",
    description: "Если нужна операция — назначим анализы и обследования, объясним каждый шаг.",
    detail: "Список анализов выдаём на приёме",
  },
  {
    icon: Scissors,
    title: "Операция",
    description: "Современные микрохирургические методики, щадящий наркоз, минимальная травматичность.",
    detail: "Стационар 1–3 дня",
  },
  {
    icon: HeartPulse,
    title: "Восстановление",
    description: "Подробные рекомендации, связь с врачом в мессенджере, контроль заживления.",
    detail: "Памятка + фотоконтроль",
  },
  {
    icon: CalendarCheck,
    title: "Контрольные осмотры",
    description: "Плановые визиты через 1, 3 и 6 месяцев для оценки результата.",
    detail: "Наблюдение до полного выздоровления",
  },
];

const PatientJourney = () => (
  <section className="py-16 md:py-24 bg-background">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Как проходит лечение
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          От первого звонка до полного выздоровления — прозрачный и понятный путь
        </p>
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* Vertical line */}
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-px hidden sm:block" />

        <div className="space-y-6 sm:space-y-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLeft = i % 2 === 0;

            return (
              <div key={i} className={`relative flex items-start gap-4 sm:gap-0 ${
                isLeft ? "sm:flex-row" : "sm:flex-row-reverse"
              }`}>
                {/* Mobile: icon on left. Desktop: icon on center line */}
                <div className="relative z-10 sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Content card */}
                <div className={`flex-1 sm:w-[calc(50%-2.5rem)] ${
                  isLeft ? "sm:pr-10 sm:text-right" : "sm:pl-10"
                }`}>
                  <Card className="p-4 border-border hover:shadow-md transition-shadow">
                    <div className={`flex items-center gap-2 mb-1 ${isLeft ? "sm:justify-end" : ""}`}>
                      <span className="text-xs font-medium text-primary">Шаг {i + 1}</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                    <p className="text-xs text-primary font-medium">{step.detail}</p>
                  </Card>
                </div>

                {/* Spacer for opposite side on desktop */}
                <div className="hidden sm:block sm:w-[calc(50%-2.5rem)]" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default PatientJourney;
