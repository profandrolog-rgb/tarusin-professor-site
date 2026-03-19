import { useState, useCallback } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock, Users, BookOpen, GraduationCap, Send, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useEmblaCarousel from "embla-carousel-react";

const courses = [
  {
    title: "Основы детской андрологии",
    description: "Курс для педиатров и детских хирургов. Диагностика и лечение урологических заболеваний у мальчиков.",
    fullDescription: "Комплексный курс, охватывающий основные аспекты детской андрологии: анатомия и физиология, диагностика врождённых и приобретённых заболеваний, современные подходы к лечению. Включает разбор клинических случаев и практические рекомендации.",
    duration: "8 часов",
    format: "Очно",
    audience: "Для врачей",
    price: "100 000 ₽",
    badge: "Популярный",
    nextDate: "Сентябрь 2026",
    cta: "Количество мест ограничено — забронируйте место заранее",
    topics: ["Анатомия и физиология", "Крипторхизм и гидроцеле", "Фимоз и гипоспадия", "Варикоцеле у подростков", "Диагностические алгоритмы"],
  },
  {
    title: "Микрохирургические техники",
    description: "Мастер-класс по современным микрохирургическим методикам в андрологии и урологии.",
    fullDescription: "Практический мастер-класс с работой на операционном микроскопе. Участники осваивают технику микрохирургического шва, вазовазостомии, варикоцелэктомии под оптическим увеличением. Ограниченное число участников для максимального внимания.",
    duration: "8 часов",
    format: "Очно",
    audience: "Для хирургов",
    price: "120 000 ₽",
    badge: "Авторский курс",
    nextDate: "Октябрь 2026",
    cta: "Группа до 6 человек — успейте занять место",
    topics: ["Микрохирургический шов", "Варикоцелэктомия", "Вазовазостомия", "Работа с операционным микроскопом"],
  },
  {
    title: "Здоровье мальчика",
    description: "Лекция для родителей о развитии и профилактике урологических проблем у мальчиков разного возраста.",
    fullDescription: "Доступная лекция для родителей: на что обратить внимание в разные периоды развития мальчика, когда обращаться к врачу, какие обследования нужны. Ответы на часто задаваемые вопросы в формате живого общения.",
    duration: "2 часа",
    format: "Онлайн",
    audience: "Для родителей",
    price: "Бесплатно",
    badge: "Бесплатно",
    nextDate: "Ежемесячно",
    cta: "Запишитесь — это бесплатно",
    topics: ["Нормы развития", "Тревожные симптомы", "Профилактические осмотры", "Вопросы и ответы"],
  },
  {
    title: "УЗИ в андрологии",
    description: "Практический курс по ультразвуковой диагностике в детской и взрослой андрологии.",
    fullDescription: "Углублённый практический курс по УЗИ-диагностике органов мошонки, полового члена и предстательной железы. Разбор нормальной и патологической эхоанатомии, допплерография, стандартизация протоколов исследования.",
    duration: "12 часов",
    format: "Очно",
    audience: "Для врачей",
    price: "150 000 ₽",
    badge: "Авторский курс",
    nextDate: "Ноябрь 2026",
    cta: "Практика на реальном оборудовании — места заканчиваются",
    topics: ["Эхоанатомия органов мошонки", "Допплерография", "Диагностика варикоцеле", "Протоколы исследования"],
  },
  {
    title: "Сексология детского и подросткового возраста",
    description: "Курс по вопросам сексуального развития, нарушений полового созревания и психосексуальных особенностей у детей и подростков.",
    fullDescription: "Междисциплинарный курс на стыке андрологии, эндокринологии и психологии. Рассматриваются нормативное половое развитие, задержка и преждевременное пубертатное развитие, гендерная дисфория, расстройства сексуального поведения у подростков. Разбор клинических случаев и алгоритмы маршрутизации пациентов.",
    duration: "16 часов",
    format: "Очно",
    audience: "Для врачей",
    price: "220 000 ₽",
    badge: "Уникальный авторский курс",
    highlighted: true,
    nextDate: "Декабрь 2026",
    cta: "Первый набор — станьте одним из первых выпускников",
    topics: ["Нормативное половое развитие", "Нарушения пубертата", "Психосексуальные расстройства", "Гендерная дисфория", "Междисциплинарный подход"],
  },
  {
    title: "Физические методы реабилитации в андрологии",
    description: "Авторский курс совместно с компанией 4CLINIC. Методики физической реабилитации для восстановления мужского здоровья.",
    fullDescription: "Практико-ориентированный курс на стыке андрологии и реабилитологии. Участники освоят современные физические методы восстановления: тренировки мышц тазового дна, постуральная коррекция, кинезиотерапия при хронической тазовой боли, послеоперационная реабилитация. Совместная программа с экспертами компании 4CLINIC.",
    duration: "12 часов",
    format: "Очно",
    audience: "Для врачей",
    price: "По запросу",
    badge: "Авторский курс",
    nextDate: "Январь 2027",
    cta: "Научите пациента владеть своим телом — создайте свою профессиональную уникальность",
    topics: ["Мышцы тазового дна", "Кинезиотерапия", "Послеоперационная реабилитация", "Хроническая тазовая боль", "Совместно с 4CLINIC"],
  },
];

const CoursesSection = () => {
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: "start", 
    loop: false,
    slidesToScroll: 1,
    containScroll: "trimSnaps"
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitted(true);
    toast({ title: "Заявка отправлена!", description: `Мы свяжемся с вами по поводу курса «${selectedCourse?.title}»` });
    setTimeout(() => {
      setSelectedCourse(null);
      setIsSubmitted(false);
      setForm({ name: "", phone: "", email: "" });
    }, 3000);
    setIsSubmitting(false);
  };

  return (
    <section id="courses" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <GraduationCap size={16} />
            <span>Образовательные программы</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Курсы и обучение
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Делюсь многолетним опытом с коллегами и помогаю родителям 
            лучше понимать здоровье своих детей
          </p>
        </div>

        {/* Courses Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {courses.map((course, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_48%] lg:flex-[0_0_32%]">
                  <Card 
                    className={`border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full ${
                      (course as any).highlighted 
                        ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" 
                        : "bg-card"
                    }`}
                  >
                    <CardHeader className="pb-4">
                      {course.badge && (
                        <Badge 
                          className={`w-fit mb-2 ${
                            course.badge === "Бесплатно" 
                              ? "bg-green-100 text-green-700 hover:bg-green-100" 
                              : course.badge === "Уникальный авторский курс"
                              ? "bg-primary/15 text-primary hover:bg-primary/15"
                              : course.badge === "Авторский курс"
                              ? "bg-primary/10 text-primary/80 hover:bg-primary/10"
                              : "bg-accent/10 text-accent hover:bg-accent/10"
                          }`}
                        >
                          {course.badge}
                        </Badge>
                      )}
                      <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">{course.format}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">{course.audience}</span>
                        </div>
                      </div>
                    </CardContent>
                    {/* Announcement zone */}
                    <div className="mx-4 mb-2 px-3 py-2.5 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-2 text-sm font-semibold text-accent mb-0.5">
                        <span>📅 Старт: {course.nextDate}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{course.cta}</p>
                    </div>
                    <CardFooter className="flex flex-col gap-3 pt-4 border-t border-border">
                      <div className="text-2xl font-bold text-foreground w-full">{course.price}</div>
                      <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setSelectedCourse(course)}>
                        Узнать подробнее
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg bg-background/90 backdrop-blur-sm hidden md:flex"
            onClick={scrollPrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg bg-background/90 backdrop-blur-sm hidden md:flex"
            onClick={scrollNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Не нашли подходящий курс? Свяжитесь со мной для организации индивидуального обучения
          </p>
          <Button 
            variant="outline" 
            size="lg"
            onClick={scrollToContact}
          >
            Связаться для консультации
          </Button>
        </div>
      </div>

      {/* Course Detail Modal */}
      <Dialog open={!!selectedCourse} onOpenChange={(open) => { if (!open) { setSelectedCourse(null); setIsSubmitted(false); setForm({ name: "", phone: "", email: "" }); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedCourse?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedCourse?.fullDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Details */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Clock className="w-4 h-4 mx-auto mb-1 text-primary" />
                <span className="text-muted-foreground">{selectedCourse?.duration}</span>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <BookOpen className="w-4 h-4 mx-auto mb-1 text-primary" />
                <span className="text-muted-foreground">{selectedCourse?.format}</span>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
                <span className="text-muted-foreground">{selectedCourse?.audience}</span>
              </div>
            </div>

            {/* Topics */}
            {selectedCourse?.topics && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">Темы курса:</h4>
                <ul className="space-y-1">
                  {selectedCourse.topics.map((topic, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-2xl font-bold text-foreground">{selectedCourse?.price}</div>

            {/* Application form */}
            {isSubmitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Заявка отправлена!</h3>
                <p className="text-sm text-muted-foreground">Мы свяжемся с вами в ближайшее время</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-3 border-t border-border pt-4">
                <h4 className="font-semibold text-foreground">Оставить заявку</h4>
                <div className="space-y-2">
                  <Label htmlFor="course-name">Ваше имя *</Label>
                  <Input id="course-name" placeholder="Иван Иванов" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-phone">Телефон *</Label>
                  <Input id="course-phone" type="tel" placeholder="+7 (999) 123-45-67" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-email">Email</Label>
                  <Input id="course-email" type="email" placeholder="example@mail.ru" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Отправка..." : <><Send className="w-4 h-4 mr-2" />Записаться на курс</>}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default CoursesSection;
