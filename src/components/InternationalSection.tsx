import { Card, CardContent } from "@/components/ui/card";
import { Globe, MapPin, Users, Award } from "lucide-react";
import { useTranslation } from "react-i18next";

const InternationalSection = () => {
  const { t } = useTranslation();

  const countries = [
    { nameKey: "international.kazakhstan", flag: "🇰🇿", activityKey: "international.kazakhstanActivity" },
    { nameKey: "international.uzbekistan", flag: "🇺🇿", activityKey: "international.uzbekistanActivity" },
    { nameKey: "international.armenia", flag: "🇦🇲", activityKey: "international.armeniaActivity" },
    { nameKey: "international.georgia", flag: "🇬🇪", activityKey: "international.georgiaActivity" },
    { nameKey: "international.turkey", flag: "🇹🇷", activityKey: "international.turkeyActivity" },
    { nameKey: "international.germany", flag: "🇩🇪", activityKey: "international.germanyActivity" },
    { nameKey: "international.israel", flag: "🇮🇱", activityKey: "international.israelActivity" },
    { nameKey: "international.italy", flag: "🇮🇹", activityKey: "international.italyActivity" },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Globe size={16} />
            <span>{t("international.badge")}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("international.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("international.subtitle")}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
          <Card className="bg-secondary border-none">
            <CardContent className="p-4 text-center">
              <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold text-primary">8+</div>
              <div className="text-xs text-muted-foreground">{t("international.countries")}</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold text-primary">600+</div>
              <div className="text-xs text-muted-foreground">{t("international.trainedDoctors")}</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-4 text-center">
              <Award className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold text-primary">860+</div>
              <div className="text-xs text-muted-foreground">{t("international.presentationsCount")}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {countries.map((country, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{country.flag}</div>
                <p className="font-medium text-foreground text-sm">{t(country.nameKey)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t(country.activityKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-10 bg-accent/10 border-accent/20 max-w-3xl mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              🌍 <span className="font-medium text-foreground">{t("international.forForeignPatients")}</span> {t("international.forForeignPatientsText")}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default InternationalSection;
