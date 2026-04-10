import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

const ProfessorMessageSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-primary/5 border-primary/20 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-8">
                <Quote className="w-8 h-8 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t("professorMessage.title")}</h2>
              </div>
              <div className="space-y-5 text-muted-foreground leading-relaxed">
                <p className="text-lg">{t("professorMessage.greeting")}</p>
                <p>{t("professorMessage.p1")}</p>
                <p>{t("professorMessage.p2")}</p>
                <p>{t("professorMessage.p3")}</p>
                <p>{t("professorMessage.p4")}</p>
                <p className="text-foreground font-medium italic">{t("professorMessage.signature")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProfessorMessageSection;
