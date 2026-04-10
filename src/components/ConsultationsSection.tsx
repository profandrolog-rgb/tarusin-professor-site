import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, CheckCircle2, FileText, Stethoscope, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

const ConsultationsSection = () => {
  const { t } = useTranslation();

  const childSymptoms: string[] = t("consultations.childSymptoms", { returnObjects: true }) as string[];
  const adultSymptoms: string[] = t("consultations.adultSymptoms", { returnObjects: true }) as string[];
  const preparations: string[] = t("consultations.preparations", { returnObjects: true }) as string[];

  const steps = Array.from({ length: 9 }, (_, i) => ({
    title: t(`consultations.step${i + 1}Title`),
    desc: t(`consultations.step${i + 1}Desc`),
  }));

  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="consultations" className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("consultations.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("consultations.subtitle")}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">{t("consultations.patientPath")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">{t("consultations.whatProblems")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <span className="text-sm font-semibold text-primary">{t("consultations.children")}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {childSymptoms.map((symptom, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                    <span className="text-sm font-semibold text-primary">{t("consultations.men")}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {adultSymptoms.map((symptom, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card border-border shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{t("consultations.howToPrepare")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {preparations.map((prep, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{prep}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-semibold text-lg">{t("consultations.contactInfo")} — AVE-CLINIC</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">{t("consultations.aveAddress")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">+7 (495) 374-81-81 ({t("consultations.forInquiries")})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">+7 (926) 600-555-0 ({t("consultations.whatsappBooking")})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">+7 (977) 807-55-44 ({t("consultations.urgentQuestions")})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm">{t("consultations.byAppointment")}</span>
                  </div>
                </div>
                <Button onClick={scrollToContact} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4">
                  {t("consultations.bookAppointment")}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-semibold text-lg">{t("consultations.contactInfo")} — {t("consultations.mataraName")}</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">{t("consultations.mataraAddress")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">+7 (495) 303-00-00 ({t("consultations.reception")})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">+7 (926) 303-01-11 ({t("consultations.booking")})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">+7 (916) 030-30-31 ({t("consultations.booking")})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm">{t("consultations.byAppointment")}</span>
                  </div>
                </div>
                <Button onClick={scrollToContact} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4">
                  {t("consultations.bookAppointment")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsultationsSection;
