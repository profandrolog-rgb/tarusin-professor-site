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
  Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const adminSections = [
  {
    title: "Заявки на приём",
    description: "Просмотр и обработка заявок от посетителей",
    icon: ClipboardList,
    href: "/admin/requests",
    color: "text-orange-500",
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
    title: "Размышлизмы",
    description: "Блог профессора — публикация заметок",
    icon: FileText,
    href: "/blog",
    color: "text-teal-500",
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
            Управление контентом сайта профессора Тарусина Д.И.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {adminSections.map((section) => (
            <Link key={section.href} to={section.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-secondary ${section.color}`}>
                      <section.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

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
