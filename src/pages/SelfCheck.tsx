import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, HeartPulse } from "lucide-react";
import { allChecklists } from "@/data/checklists";
import PageMeta from "@/components/PageMeta";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const iconMap: Record<string, React.ElementType> = {
  HeartPulse,
};

const SelfCheck = () => {
  return (
    <>
      <PageMeta
        title="Самодиагностика — Профессор Тарусин"
        description="Пройдите бесплатные тесты для предварительной оценки урологических проблем. Результат не заменяет консультацию врача."
        path="/self-check"
      />
      <Header />
      <main className="min-h-screen bg-background">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Самодиагностика</h1>
              <p className="text-lg text-muted-foreground">
                Пройдите короткий тест для предварительной оценки проблемы. 
                Это не заменяет консультацию врача, но поможет понять, стоит ли обратиться к специалисту.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
              {allChecklists.map(cl => {
                const Icon = iconMap[cl.icon] || HeartPulse;
                return (
                  <Link key={cl.slug} to={`/self-check/${cl.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary/50 group">
                      <CardContent className="p-6 space-y-4">
                        <div className="p-3 rounded-lg bg-primary/10 w-fit">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {cl.shortTitle}
                          </h2>
                          <p className="text-sm text-muted-foreground">{cl.description}</p>
                        </div>
                        <div className="flex items-center text-primary text-sm font-medium">
                          Пройти тест <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default SelfCheck;
