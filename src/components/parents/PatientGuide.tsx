import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ClipboardList, Stethoscope, Scissors, HeartPulse, Phone, FileText, AlertTriangle, CheckCircle } from "lucide-react";

const guideCategories = [
  {
    id: "before-visit",
    icon: ClipboardList,
    title: "Подготовка к приёму",
    items: [
      {
        question: "Какие документы взять на приём?",
        answer: "Паспорт (свидетельство о рождении ребёнка), полис ОМС или ДМС, направление (при наличии), результаты предыдущих обследований (УЗИ, анализы крови, спермограмма), выписки из стационаров, фотографии (если есть).",
      },
      {
        question: "Какие анализы подготовить заранее?",
        answer: "Общий анализ крови и мочи (не старше 2 недель), УЗИ органов мошонки / паховых каналов (если есть). Профессор проводит экспертное УЗИ на приёме, но наличие предыдущих исследований поможет оценить динамику.",
      },
      {
        question: "Как подготовить ребёнка к визиту?",
        answer: "Объясните ребёнку в спокойной обстановке, что врач — друг, который хочет помочь. Не пугайте и не обманывайте. Для маленьких детей можно взять любимую игрушку. Профессор имеет большой опыт работы с детьми всех возрастов и умеет находить подход даже к самым тревожным пациентам.",
      },
      {
        question: "Сколько длится первичный приём?",
        answer: "Первичная консультация длится 30–60 минут. Включает подробный сбор анамнеза, осмотр, УЗИ-диагностику (при необходимости), постановку диагноза и обсуждение плана лечения. Профессор уделяет достаточно времени, чтобы ответить на все ваши вопросы.",
      },
    ],
  },
  {
    id: "before-surgery",
    icon: Scissors,
    title: "Подготовка к операции",
    items: [
      {
        question: "Какие анализы нужны перед операцией?",
        answer: "Общий анализ крови (с лейкоцитарной формулой), общий анализ мочи, биохимический анализ крови, коагулограмма, группа крови и резус-фактор, ЭКГ, рентген грудной клетки (по показаниям), консультация анестезиолога. Все анализы должны быть не старше 14 дней.",
      },
      {
        question: "Как подготовиться в день операции?",
        answer: "Последний приём пищи — за 6 часов до операции, прозрачные жидкости — за 2 часа. Приём необходимо вымыть ребёнка, надеть чистое бельё. Возьмите с собой сменную одежду, тапочки, средства гигиены, воду без газа. Не наносите кремы и мази на область операции.",
      },
      {
        question: "Какую анестезию используют?",
        answer: "В зависимости от объёма операции и возраста пациента применяется комбинированная анестезия: общий наркоз + местная или региональная анестезия. Это обеспечивает полное обезболивание во время и после операции. Анестезиолог проводит предварительную консультацию.",
      },
    ],
  },
  {
    id: "after-surgery",
    icon: HeartPulse,
    title: "Послеоперационный период",
    items: [
      {
        question: "Как ухаживать за ребёнком после операции?",
        answer: "Соблюдайте все рекомендации хирурга. Обеспечьте покой и ограничение физической активности. Перевязки и обработка швов — по назначению врача. Регулярно измеряйте температуру первые 3 дня. Диета — щадящая, обильное питьё.",
      },
      {
        question: "Когда можно вернуться к обычной жизни?",
        answer: "Зависит от вида операции. После микрохирургических операций (варикоцеле) — через 5–7 дней. После операций на органах мошонки — через 7–10 дней. Полное заживление и снятие ограничений по физической нагрузке — через 3–4 недели. Школа/детский сад — через 7–14 дней.",
      },
      {
        question: "Когда нужно срочно обратиться к врачу?",
        answer: "Немедленно обращайтесь при: повышении температуры выше 38°С, нарастающем отёке и покраснении, выделениях из раны, сильной боли, не снимаемой назначенными препаратами, тошноте и рвоте. Звоните по указанным телефонам — профессор Тарусин доступен для своих пациентов.",
      },
    ],
  },
  {
    id: "useful-info",
    icon: FileText,
    title: "Полезная информация",
    items: [
      {
        question: "Можно ли получить консультацию онлайн?",
        answer: "Да, профессор проводит предварительные онлайн-консультации. Вы можете отправить результаты обследований и фотографии для оценки ситуации. Это поможет определить, нужен ли очный визит, и подготовиться к нему. Свяжитесь по телефонам клиник или через форму на сайте.",
      },
      {
        question: "Принимаете ли иногородних пациентов?",
        answer: "Да, к профессору Тарусину обращаются пациенты со всей России и из-за рубежа. Для иногородних пациентов мы стараемся максимально сконцентрировать обследование и лечение, чтобы сократить время пребывания в Москве. Предварительная онлайн-консультация позволит спланировать визит.",
      },
      {
        question: "Как записаться на операцию?",
        answer: "Запись на операцию возможна только после очной консультации. На приёме профессор определит показания, объём и сроки вмешательства. Далее вы получите список необходимых анализов и дату операции. Обычно ожидание составляет 1–3 недели.",
      },
    ],
  },
];

const PatientGuide = () => {
  return (
    <div className="space-y-8">
      {/* Intro */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Памятка для пациентов и родителей
              </h3>
              <p className="text-muted-foreground">
                Здесь собрана практическая информация, которая поможет вам подготовиться к визиту, 
                операции и послеоперационному периоду. Если у вас остались вопросы — не стесняйтесь 
                звонить или писать.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgent contact */}
      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Экстренная связь</h4>
              <p className="text-sm text-muted-foreground mb-3">
                При срочных послеоперационных вопросах звоните:
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="tel:+79778075544" className="inline-flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors">
                  <Phone className="w-4 h-4" />
                  +7 (977) 807-55-44
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {guideCategories.map((category) => (
        <div key={category.id}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <category.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">{category.title}</h3>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {category.items.map((item, idx) => (
              <AccordionItem key={idx} value={`${category.id}-${idx}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium text-left hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
};

export default PatientGuide;
