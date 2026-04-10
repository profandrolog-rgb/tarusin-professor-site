import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ResultsCTA = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {isEn ? "View Surgical Results" : "Результаты операций"}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {isEn
              ? "Photo documentation of before-and-after surgical results is available in a separate protected section (18+). Access requires age confirmation."
              : "Фотодокументация результатов операций «до и после» доступна в отдельном защищённом разделе (18+). Для доступа необходимо подтверждение возраста."
            }
          </p>
          <Link to="/results">
            <Button size="lg" className="gap-2">
              {isEn ? "View Results (18+)" : "Просмотреть результаты (18+)"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ResultsCTA;
