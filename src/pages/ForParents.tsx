import { ArrowLeft, BookOpen, Baby, User, FileText, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageMeta from "@/components/PageMeta";
import AgeConfirmationModal from "@/components/AgeConfirmationModal";
import UsefulMaterials from "@/components/parents/UsefulMaterials";
import DiseaseArticlesList from "@/components/parents/DiseaseArticlesList";
import PublicationsList from "@/components/parents/PublicationsList";
import PatientGuide from "@/components/parents/PatientGuide";

const ForParents = () => {
  return (
    <AgeConfirmationModal>
      <div
        className="min-h-screen bg-background select-none"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
      >
        <PageMeta
          title="Для родителей и пациентов — Проф. Тарусин Д.И."
          description="Полезные материалы о мужском здоровье от профессора Тарусина: статьи, видео и подкасты для родителей и пациентов."
          path="/for-parents"
        />

        {/* Header */}
        <header className="bg-primary text-primary-foreground py-12 md:py-20">
          <div className="container mx-auto px-4">
            <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Для родителей и пациентов</h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
              Полезные материалы о мужском здоровье: статьи, видео и подкасты от профессора Тарусина
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 md:py-16">
          <Tabs defaultValue="useful" className="w-full">
            <TabsList className="w-full grid grid-cols-5 h-auto mb-10">
              <TabsTrigger value="useful" className="flex items-center gap-2 py-3 text-xs md:text-base">
                <BookOpen className="w-4 h-4 hidden sm:block" />
                Полезные материалы
              </TabsTrigger>
              <TabsTrigger value="children" className="flex items-center gap-2 py-3 text-xs md:text-base">
                <Baby className="w-4 h-4 hidden sm:block" />
                О детских болезнях
              </TabsTrigger>
              <TabsTrigger value="adults" className="flex items-center gap-2 py-3 text-xs md:text-base">
                <User className="w-4 h-4 hidden sm:block" />
                О взрослых болезнях
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-2 py-3 text-xs md:text-base">
                <ClipboardList className="w-4 h-4 hidden sm:block" />
                Памятка пациенту
              </TabsTrigger>
              <TabsTrigger value="publications" className="flex items-center gap-2 py-3 text-xs md:text-base">
                <FileText className="w-4 h-4 hidden sm:block" />
                Публикации
              </TabsTrigger>
            </TabsList>

            <TabsContent value="useful">
              <UsefulMaterials />
            </TabsContent>

            <TabsContent value="children">
              <DiseaseArticlesList ageGroup="children" />
            </TabsContent>

            <TabsContent value="adults">
              <DiseaseArticlesList ageGroup="adults" />
            </TabsContent>

            <TabsContent value="guide">
              <PatientGuide />
            </TabsContent>

            <TabsContent value="publications">
              <PublicationsList />
            </TabsContent>
          </Tabs>
        </main>

        {/* CTA Section */}
        <section className="bg-secondary py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Остались вопросы?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Запишитесь на консультацию к профессору Тарусину для индивидуального осмотра и рекомендаций
            </p>
            <Link to="/#contact">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Записаться на приём
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </AgeConfirmationModal>
  );
};

export default ForParents;
