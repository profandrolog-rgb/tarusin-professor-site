import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, MonitorCheck, Shield, Bone, Building, Baby } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import boyIcon from "@/assets/icons/boy-icon.png";
import manIcon from "@/assets/icons/man-icon.svg";
import surgeryIcon from "@/assets/icons/surgery-icon.svg";
import microsurgeryIcon from "@/assets/icons/microsurgery-icon.svg";
type Certificate = {
  id: string;
  title: string;
  image_path: string;
  sort_order: number;
  is_published: boolean;
};
type SpecializationType = {
  icon?: LucideIcon;
  customIcon?: string;
  title: string;
  description: string;
};
const specializations: SpecializationType[] = [{
  customIcon: boyIcon,
  title: "Детская урология-андрология",
  description: "Создатель специальности в России (с 2003 года)"
}, {
  customIcon: manIcon,
  title: "Андрология взрослых",
  description: "Диагностика и лечение мужских заболеваний"
}, {
  icon: Baby,
  title: "Педиатрия",
  description: "Комплексное наблюдение и лечение детей"
}, {
  customIcon: surgeryIcon,
  title: "Детская хирургия",
  description: "Хирургическое лечение врождённых и приобретённых патологий"
}, {
  customIcon: microsurgeryIcon,
  title: "Микрохирургия",
  description: "Операции с точностью офтальмологической хирургии"
}, {
  icon: Sparkles,
  title: "Пластическая хирургия",
  description: "Реконструктивные и эстетические операции"
}, {
  icon: Brain,
  title: "Сексология",
  description: "Консультации по вопросам интимного здоровья"
}, {
  icon: MonitorCheck,
  title: "УЗИ-диагностика",
  description: "Мировой эксперт в УЗИ органов репродуктивной системы"
}, {
  icon: Bone,
  title: "Травматология-ортопедия",
  description: "Лечение травм и патологий опорно-двигательного аппарата"
}, {
  icon: Building,
  title: "Организация здравоохранения",
  description: "Руководство Городским центром охраны репродуктивного здоровья"
}];
const achievements = [{
  value: "42",
  label: "Года опыта"
}, {
  value: "126+",
  label: "Научных статей"
}, {
  value: "6",
  label: "Глав в нац. руководствах"
}, {
  value: "9+",
  label: "Подготовленных кандидатов наук"
}];
const AboutSection = () => {
  const [certApi, setCertApi] = React.useState<CarouselApi>();
  const [certPageCount, setCertPageCount] = React.useState(0);
  const [certCurrentPage, setCertCurrentPage] = React.useState(0);
  const {
    data: certificates = []
  } = useQuery({
    queryKey: ["certificates-public"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("certificates").select("*").eq("is_published", true).order("sort_order", {
        ascending: true
      });
      if (error) throw error;
      return data as Certificate[];
    }
  });
  const getImageUrl = (imagePath: string) => {
    const {
      data
    } = supabase.storage.from("certificates").getPublicUrl(imagePath);
    return data.publicUrl;
  };
  React.useEffect(() => {
    if (!certApi) return;
    const update = () => {
      setCertPageCount(certApi.scrollSnapList().length);
      setCertCurrentPage(certApi.selectedScrollSnap() + 1);
    };
    update();
    certApi.on("reInit", update);
    certApi.on("select", update);
    return () => {
      certApi.off("reInit", update);
      certApi.off("select", update);
    };
  }, [certApi]);
  return <section id="about" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Обо мне
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Доктор медицинских наук (с 2005 года), профессор, член-корреспондент РАЕН, врач высшей категории. 
            В медицине с 13 лет, в хирургии с 14 лет. В 2003 году совместно с профессором Казанской И.В. 
            организовал новую медицинскую специальность «детская урология-андрология» в России.
          </p>
        </div>

        {/* Career Milestones */}
        <Card className="mb-12 md:mb-16 bg-primary/5 border-primary/20">
          <CardContent className="p-6 md:p-10">
            <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
              <Shield className="w-7 h-7 text-primary" />
              Вехи карьеры
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Врач по оказанию экстренной хирургической помощи детям</p>
                <p className="text-sm text-muted-foreground mt-1">Тушинская ДГКБ № 7, ныне: больница им. З.А. Башляевой (с 1993 года)</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Научный сотрудник отдела детской хирургии</p>
                <p className="text-sm text-muted-foreground mt-1">Кафедра хирургии детского возраста РМАПО (с 1994 года)</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Руководитель Центра детской и подростковой андрологии г. Москвы</p>
                <p className="text-sm text-muted-foreground mt-1">С 2001 года</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Директор Научно-практического центра детской андрологии</p>
                <p className="text-sm text-muted-foreground mt-1">С 2003 года</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Руководитель Городского центра охраны репродуктивного здоровья детей и подростков</p>
                <p className="text-sm text-muted-foreground mt-1">Морозовская ДГКБ — единственный в России (с 2018 года)</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Заместитель директора по науке</p>
                <p className="text-sm text-muted-foreground mt-1">Международный центр андрологии, Москва</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Профессор - консультант</p>
                <p className="text-sm text-muted-foreground mt-1">Семейная клиника доктора Матара (с 2018 года)</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="font-medium text-foreground">Сопредседатель Всероссийской школы по детской урологии-андрологии</p>
                <p className="text-sm text-muted-foreground mt-1">С 2012 года</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border md:col-span-2">
                <p className="font-medium text-foreground">Автор и ведущий проекта «Лабиринты детской урологии»</p>
                <p className="text-sm text-muted-foreground mt-1">С 2024 года — образовательный проект для врачей</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio Card */}
        <Card className="mb-12 md:mb-16 bg-card border-border shadow-lg">
          <CardContent className="p-6 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  Мой подход к лечению
                </h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>За более чем 42 года практики я помог тысячам пациентов — от новорождённых до взрослых мужчин. Каждый случай уникален, и я убеждён, что успешное лечение начинается с внимательного отношения к пациенту.</p>
                  <p>
                    Мои операции выполняются с деликатностью, сопоставимой с офтальмологической хирургией. 
                    Использую современные микрохирургические методы при крипторхизме, водянке, 
                    варикоцеле и сперматоцеле.
                  </p>
                  <p>
                    Признанный в мире эксперт в ультразвуковой диагностике органов репродуктивной 
                    системы у детей и подростков.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((item, index) => <div key={index} className="bg-secondary rounded-xl p-6 text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{item.value}</div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                  </div>)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specializations */}
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Мои специализации и сертификаты
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Действующие сертификаты по 10+ направлениям медицины
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {specializations.map((spec, index) => <Card key={index} className="group bg-card border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors overflow-hidden">
                  {spec.customIcon ? <img src={spec.customIcon} alt={spec.title} className="w-8 h-8 object-contain" style={{
                filter: 'invert(32%) sepia(98%) saturate(1234%) hue-rotate(196deg) brightness(94%) contrast(91%)'
              }} /> : spec.icon ? <spec.icon className="w-7 h-7 text-primary" /> : null}
                </div>
                <h4 className="font-semibold text-foreground mb-2 text-sm">{spec.title}</h4>
                <p className="text-xs text-muted-foreground">{spec.description}</p>
              </CardContent>
            </Card>)}
        </div>

        {/* Certificates Gallery */}
        <div className="mt-12 md:mt-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Дипломы и сертификаты
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Подтверждение квалификации и непрерывного профессионального развития
            </p>
          </div>

          {certificates.length === 0 ? <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">на самом деле, я считаю исключительной глупостью систему подготовки кадров в России и бесконечный перевод бумаги на «удостоверения, сертификаты, дипломы, свидетельства». Более пустого времяпрепровождения, чем 40 лет накапливать макулатуру, я за свою жизнь не знал. Здесь представлены не все документы — в целом их у меня большой чемодан. Здесь примерно треть (а всего 188 "бумажек")</p>
              </CardContent>
            </Card> : <div className="relative">
              <Carousel opts={{
            align: "start",
            loop: true,
            slidesToScroll: 1
          }} setApi={setCertApi} className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {certificates.map(cert => <CarouselItem key={cert.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <Card className="overflow-hidden border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                        <CardContent className="p-0">
                          <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                            <img src={getImageUrl(cert.image_path)} alt={cert.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div className="p-3 text-center">
                            <p className="text-sm font-medium text-foreground truncate">{cert.title}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>)}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex left-2 z-10" />
                <CarouselNext className="hidden sm:flex right-2 z-10" />
              </Carousel>

              {certPageCount > 1 && <div className="mt-4 text-center text-sm text-muted-foreground">
                  Страница {certCurrentPage} из {certPageCount}
                </div>}
            </div>}
        </div>

        {/* Fun Fact */}
        <Card className="mt-12 bg-accent/10 border-accent/20">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              🦔 <span className="font-medium text-foreground">Интересный факт:</span> Коллекционирую фигурки ежей — 
              вторая по величине коллекция в мире (более 5800 экземпляров)!
            </p>
          </CardContent>
        </Card>
      </div>
    </section>;
};
export default AboutSection;