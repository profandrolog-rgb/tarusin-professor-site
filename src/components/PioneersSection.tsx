import { Trophy, Star, Lightbulb, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

const PioneersSection = () => {
  const { t } = useTranslation();

  const pioneerItems = [
    { icon: Trophy, numKey: "1" },
    { icon: Lightbulb, numKey: "2" },
    { icon: Globe, numKey: "3" },
    { icon: Star, numKey: "4" },
    { icon: Lightbulb, numKey: "5" },
    { icon: Globe, numKey: "6" },
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Trophy size={16} />
            <span>{t("pioneers.badge")}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("pioneers.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("pioneers.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pioneerItems.map((item, index) => (
            <Card key={index} className="group bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-primary mb-1">{t(`pioneers.item${item.numKey}Year`)}</div>
                    <h3 className="font-semibold text-foreground mb-2 text-sm leading-snug">{t(`pioneers.item${item.numKey}Title`)}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t(`pioneers.item${item.numKey}Desc`)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PioneersSection;
