import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  FileText, 
  Camera, 
  ClipboardList, 
  ArrowLeft,
  Loader2,
  Award,
  Pill,
  Stethoscope,
  BarChart3,
  ExternalLink,
  TrendingUp,
  Eye,
  MousePointer,
  Clock,
  BookOpen,
  Baby,
  ClipboardCheck,
  Settings,
  Headphones
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecentVisitsWidget } from "@/components/visits/RecentVisitsWidget";
import { DbHealthWidget } from "@/components/admin/DbHealthWidget";
import { warmAdminChunks } from "@/lib/prefetchAdmin";

// === КЛИНИЧЕСКАЯ РАБОТА: пациенты, протоколы, ИИ, назначения ===
const clinicalSections = [
  {
    title: "Карточки пациентов",
    description: "Портал пациентов: карточки, документы, чат",
    icon: Users,
    href: "/admin/patient-cards",
    color: "text-violet-500",
  },
  {
    title: "Журнал визитов и протоколы",
    description: "9 типов клинических протоколов: первичный осмотр, динамика, УЗИ, послеоп",
    icon: ClipboardList,
    href: "/admin/visits",
    color: "text-cyan-600",
  },
  {
    title: "Онлайн-консультации",
    description: "Кейсы консультаций, ИИ-анализ, заключения",
    icon: Stethoscope,
    href: "/admin/consultations",
    color: "text-sky-500",
  },
  {
    title: "Выписка рецептов",
    description: "Форма 107/у — рецепт на лекарственные препараты",
    icon: Pill,
    href: "/admin/prescriptions",
    color: "text-red-500",
  },
  {
    title: "Листы назначений",
    description: "Комплексная терапия: в/в, в/м, БАД, пептиды, процедуры",
    icon: ClipboardList,
    href: "/admin/treatment-plans",
    color: "text-fuchsia-500",
  },
  {
    title: "Обследования",
    description: "УЗИ, анализы, антропометрия",
    icon: Stethoscope,
    href: "/admin/prescriptions?section=examinations",
    color: "text-indigo-500",
  },
  {
    title: "Операционный журнал",
    description: "Учёт проведённых операций",
    icon: BookOpen,
    href: "/admin/operations-journal",
    color: "text-rose-500",
  },
  {
    title: "🤖 Кабинет (ИИ-чат)",
    description: "Приватный чат с моделями Claude, GPT, Gemini, Grok через OpenRouter",
    icon: Settings,
    href: "/cabinet",
    color: "text-fuchsia-600",
  },
  {
    title: "Шаблоны текстов протоколов",
    description: "Универсальные и операционные шаблоны для полей форм визитов",
    icon: ClipboardList,
    href: "/admin/visit-templates",
    color: "text-teal-600",
  },
  {
    title: "📚 Медицинские справочники",
    description: "Препараты, операции, программы физ. нагрузки, диеты — для назначений в протоколах",
    icon: BookOpen,
    href: "/admin/medical-references",
    color: "text-emerald-600",
  },
];

// === САЙТ И АДМИНИСТРИРОВАНИЕ: контент, заявки, аналитика, инфраструктура ===
const siteSections = [
  {
    title: "Заявки на приём",
    description: "Просмотр и обработка заявок от посетителей",
    icon: ClipboardList,
    href: "/admin/requests",
    color: "text-orange-500",
  },
  {
    title: "Вопросы пациентов",
    description: "Ответы на вопросы, публикация Q&A",
    icon: ClipboardList,
    href: "/admin/questions",
    color: "text-cyan-500",
  },
  {
    title: "Команда профессора",
    description: "Управление специалистами команды",
    icon: Users,
    href: "/team",
    color: "text-blue-500",
  },
  {
    title: "Клинические случаи",
    description: "Добавление и редактирование кейсов",
    icon: FileText,
    href: "/clinical-cases",
    color: "text-green-500",
  },
  {
    title: "Материалы о заболеваниях",
    description: "Статьи-лонгриды про болезни (детские и взрослые)",
    icon: Baby,
    href: "/admin/disease-articles",
    color: "text-pink-500",
  },
  {
    title: "«Полезные материалы» для родителей",
    description: "Карточки статей, YouTube-видео и подкастов на /for-parents",
    icon: BookOpen,
    href: "/admin/parents-materials",
    color: "text-fuchsia-500",
  },
  {
    title: "Наши исследования",
    description: "Публикации и научные статьи",
    icon: FileText,
    href: "/research",
    color: "text-emerald-500",
  },
  {
    title: "Размышлизмы",
    description: "Блог профессора — публикация заметок",
    icon: FileText,
    href: "/blog",
    color: "text-teal-500",
  },
  {
    title: "🎙️ Исходники для подкастов",
    description: "Скачать тексты блога, статей, исследований и кейсов для NotebookLM",
    icon: Headphones,
    href: "/admin/podcast-sources",
    color: "text-fuchsia-600",
  },
  {
    title: "📤 ИИ-загрузка статьи",
    description: "Загрузить .docx → авто-открытие в Оркестраторе для ревью",
    icon: FileText,
    href: "/admin/article-upload",
    color: "text-emerald-600",
  },
  {
    title: "✨ Оркестратор статей",
    description: "Параллельное ревью текста несколькими ИИ, голосование, арбитраж и переписывание",
    icon: FileText,
    href: "/admin/article-orchestrator",
    color: "text-amber-600",
  },
  {
    title: "📥 Финальный импорт (SEO)",
    description: "Финальная форма: заголовок, slug, ключевые слова, аннотация, сохранение",
    icon: FileText,
    href: "/admin/article-import",
    color: "text-cyan-600",
  },
  {
    title: "Путевые заметки",
    description: "Управление фотогалереей путешествий",
    icon: Camera,
    href: "/travel-notes",
    color: "text-purple-500",
  },
  {
    title: "Сертификаты и дипломы",
    description: "Управление галереей сертификатов",
    icon: Award,
    href: "/admin/certificates",
    color: "text-amber-500",
  },
  {
    title: "Самодиагностика",
    description: "Статистика прохождений тестов самодиагностики",
    icon: ClipboardCheck,
    href: "/admin/self-check",
    color: "text-lime-500",
  },
  {
    title: "📊 Аналитика",
    description: "Статистика использования каталога, шаблонов, секций и динамика по месяцам",
    icon: BarChart3,
    href: "/admin/analytics",
    color: "text-indigo-500",
  },
  {
    title: "Системные настройки",
    description: "Статус cron-задач, авто-парсинг цен, лог запусков",
    icon: Settings,
    href: "/admin/system-settings",
    color: "text-slate-500",
  },
  {
    title: "📦 Резервное копирование",
    description: "Бэкап и восстановление данных treatment-plans, история снапшотов",
    icon: Settings,
    href: "/admin/system-backup",
    color: "text-amber-600",
  },
];

const analyticsServices = [
  {
    name: "Яндекс.Метрика",
    id: "107724120",
    icon: "📊",
    dashboardUrl: "https://metrika.yandex.ru/dashboard?id=107724120",
    features: ["Вебвизор", "Карта кликов", "Источники трафика", "Показатель отказов"],
    color: "border-yellow-500/50 bg-yellow-500/5",
  },
  {
    name: "Google Analytics 4",
    id: "G-5M2VCL4QN5",
    icon: "📈",
    dashboardUrl: "https://analytics.google.com/analytics/web/",
    features: ["Воронки конверсий", "Когортный анализ", "Демография", "Поведение"],
    color: "border-blue-500/50 bg-blue-500/5",
  },
];

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin" } });
    }
  }, [user, isAdmin, loading, navigate]);

  // Прогреваем чанки админ-страниц, чтобы клики по карточкам открывались мгновенно.
  useEffect(() => {
    if (user && isAdmin) warmAdminChunks();
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Административная панель
          </h1>
          <p className="text-muted-foreground">
            Управление контентом сайта
          </p>
        </div>

        <div className="mb-10">
          <DbHealthWidget />
        </div>

        {/* Analytics Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Аналитика и счётчики</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {analyticsServices.map((service) => (
              <Card key={service.id} className={`border ${service.color}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{service.icon}</span>
                      <div>
                        <CardTitle className="text-base">{service.name}</CardTitle>
                        <CardDescription className="text-xs font-mono">{service.id}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Активен
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {service.features.map((feature) => (
                      <span key={feature} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <a
                    href={service.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-2 mt-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Открыть личный кабинет
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick tips */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Eye className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Просмотры</p>
                <p className="text-sm font-medium text-foreground">Метрика → Сводка</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Источники</p>
                <p className="text-sm font-medium text-foreground">GA4 → Источники</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <MousePointer className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Карта кликов</p>
                <p className="text-sm font-medium text-foreground">Метрика → Карты</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Время на сайте</p>
                <p className="text-sm font-medium text-foreground">GA4 → Вовлечённость</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent visits widget */}
        <div className="mb-8">
          <RecentVisitsWidget />
        </div>

        {/* Clinical Work — pinned to top */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Клиническая работа</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Пациенты, протоколы, ИИ-ассистент, назначения и рецепты
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clinicalSections.map((section) => (
              <Link key={section.href} to={section.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-primary/20 hover:border-primary/60 bg-primary/[0.02]">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-secondary ${section.color}`}>
                        <section.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <CardDescription className="text-xs">{section.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Site Content & Administration */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Сайт и администрирование</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Контент, заявки, аналитика, инфраструктура
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {siteSections.map((section) => (
              <Link key={section.href} to={section.href}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer hover:border-primary/40">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-secondary ${section.color}`}>
                        <section.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <CardDescription className="text-xs">{section.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>


        <div className="mt-8 p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Вы вошли как: <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;
