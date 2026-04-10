import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, MonitorCheck, Shield, Bone, Building, Baby } from "lucide-react";
import { LucideIcon } from "lucide-react";
import boyIcon from "@/assets/icons/boy-icon.png";
import manIcon from "@/assets/icons/man-icon.svg";
import surgeryIcon from "@/assets/icons/surgery-icon.svg";
import microsurgeryIcon from "@/assets/icons/microsurgery-icon.svg";
import { useTranslation } from "react-i18next";
import CertificateLightbox from "@/components/CertificateLightbox";

type Certificate = {
  id: string;
  title: string;
  image_path: string;
  sort_order: number;
  is_published: boolean;
};

const MAX_PUBLIC_CERTIFICATES = 60;

const AboutSection = () => {
  const { t } = useTranslation();
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const specializations = [
    { customIcon: boyIcon, titleKey: "about.specPedUroAndro", descKey: "about.specPedUroAndroDesc" },
    { customIcon: manIcon, titleKey: "about.specAdultAndro", descKey: "about.specAdultAndroDesc" },
    { icon: Baby, titleKey: "about.specPediatrics", descKey: "about.specPediatricsDesc" },
    { customIcon: surgeryIcon, titleKey: "about.specPedSurgery", descKey: "about.specPedSurgeryDesc" },
    { customIcon: microsurgeryIcon, titleKey: "about.specMicrosurgery", descKey: "about.specMicrosurgeryDesc" },
    { icon: Sparkles, titleKey: "about.specPlasticSurgery", descKey: "about.specPlasticSurgeryDesc" },
    { icon: Brain, titleKey: "about.specSexology", descKey: "about.specSexologyDesc" },
    { icon: MonitorCheck, titleKey: "about.specUltrasound", descKey: "about.specUltrasoundDesc" },
    { icon: Bone, titleKey: "about.specOrthopedics", descKey: "about.specOrthopedicsDesc" },
    { icon: Building, titleKey: "about.specHealthAdmin", descKey: "about.specHealthAdminDesc" },
  ];

  const achievements = [
    { value: "42", labelKey: "about.achYears" },
    { value: "126+", labelKey: "about.achArticles" },
    { value: "6", labelKey: "about.achChapters" },
    { value: "9+", labelKey: "about.achCandidates" },
  ];

  const careerItems = Array.from({ length: 9 }, (_, i) => ({
    titleKey: `about.career${i + 1}Title`,
    descKey: `about.career${i + 1}Desc`,
  }));

  const { data: certificates = [] } = useQuery({
    queryKey: ["certificates-public", MAX_PUBLIC_CERTIFICATES],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id,title,image_path,sort_order,is_published")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .limit(MAX_PUBLIC_CERTIFICATES);
      if (error) throw error;
      return data as Certificate[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const getImageUrl = (imagePath: string) => {
    const { data } = supabase.storage.from("certificates").getPublicUrl(imagePath);
    return data.publicUrl;
  };

  const certImages = React.useMemo(
    () => certificates.map((c) => ({ id: c.id, title: c.title, url: getImageUrl(c.image_path) })),
    [certificates]
  );

  return (
    <section id="about" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("about.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{t("about.description")}</p>
        </div>

        <Card className="mb-12 md:mb-16 bg-primary/5 border-primary/20">
          <CardContent className="p-6 md:p-10">
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <Shield className="w-7 h-7 text-primary" />
              {t("about.careerTitle")}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {careerItems.map((item, i) => (
                <div key={i} className={`bg-background rounded-lg p-4 border border-border ${i === 8 ? "md:col-span-2" : ""}`}>
                  <p className="font-medium text-foreground">{t(item.titleKey)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t(item.descKey)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-12 md:mb-16 bg-card border-border shadow-lg">
          <CardContent className="p-6 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">{t("about.approachTitle")}</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>{t("about.approachP1")}</p>
                  <p>{t("about.approachP2")}</p>
                  <p>{t("about.approachP3")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((item, index) => (
                  <div key={index} className="bg-secondary rounded-xl p-6 text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{item.value}</div>
                    <div className="text-sm text-muted-foreground">{t(item.labelKey)}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{t("about.specTitle")}</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("about.specSubtitle")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {specializations.map((spec, index) => (
            <Card key={index} className="group bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors overflow-hidden">
                  {spec.customIcon ? (
                    <img src={spec.customIcon} alt={t(spec.titleKey)} className="w-8 h-8 object-contain" style={{ filter: 'invert(32%) sepia(98%) saturate(1234%) hue-rotate(196deg) brightness(94%) contrast(91%)' }} />
                  ) : spec.icon ? (
                    <spec.icon className="w-7 h-7 text-primary" />
                  ) : null}
                </div>
                <h4 className="font-semibold text-foreground mb-2 text-sm">{t(spec.titleKey)}</h4>
                <p className="text-xs text-muted-foreground">{t(spec.descKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 md:mt-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{t("about.diplomasTitle")}</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("about.diplomasSubtitle")}</p>
          </div>

          <Card className="mb-8 bg-muted/30 border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                💬 <span className="font-medium text-foreground">{t("about.opinionLabel")}</span> {t("about.opinionText")}
              </p>
            </CardContent>
          </Card>

          {certificates.length === 0 ? (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">{t("about.noCerts")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {certificates.map((cert, idx) => (
                  <Card
                    key={cert.id}
                    className="overflow-hidden border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                        <img src={getImageUrl(cert.image_path)} alt={cert.title} loading="lazy" decoding="async" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-3 text-center">
                        <p className="text-sm font-medium text-foreground truncate">{cert.title}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <CertificateLightbox
                images={certImages}
                initialIndex={lightboxIndex}
                open={lightboxOpen}
                onOpenChange={setLightboxOpen}
              />
            </>
          )}
        </div>

        <Card className="mt-12 bg-accent/10 border-accent/20">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              🦔 <span className="font-medium text-foreground">{t("about.funFactLabel")}</span> {t("about.funFact")}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AboutSection;
