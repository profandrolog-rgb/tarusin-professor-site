import { useState, useCallback } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock, Users, BookOpen, GraduationCap, Send, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import useEmblaCarousel from "embla-carousel-react";

const CoursesSection = () => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const courses = [1, 2, 3, 4, 5, 6].map(n => ({
    title: t(`courses.course${n}Title`),
    description: t(`courses.course${n}Desc`),
    fullDescription: t(`courses.course${n}FullDesc`),
    duration: t(`courses.course${n}Duration`),
    format: t(`courses.course${n}Format`),
    audience: t(`courses.course${n}Audience`),
    price: t(`courses.course${n}Price`),
    badge: t(`courses.course${n}Badge`),
    nextDate: t(`courses.course${n}Date`),
    cta: t(`courses.course${n}CTA`),
    topics: t(`courses.courseTopicsList${n}`, { returnObjects: true }) as string[],
    highlighted: n === 5,
  }));

  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false, slidesToScroll: 1, containScroll: "trimSnaps" });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: t("courses.fillRequired"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitted(true);
    toast({ title: t("courses.courseSubmitted"), description: t("courses.courseSubmittedDesc") });
    setTimeout(() => { setSelectedCourse(null); setIsSubmitted(false); setForm({ name: "", phone: "", email: "" }); }, 3000);
    setIsSubmitting(false);
  };

  const freeBadge = isEn ? "Free" : "Бесплатно";
  const uniqueBadge = isEn ? "Unique Author's Course" : "Уникальный авторский курс";
  const authorBadge = isEn ? "Author's Course" : "Авторский курс";

  return (
    <section id="courses" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <GraduationCap size={16} />
            <span>{t("courses.badge")}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("courses.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("courses.subtitle")}</p>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {courses.map((course, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_48%] lg:flex-[0_0_32%]">
                  <Card className={`border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full ${course.highlighted ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" : "bg-card"}`}>
                    <CardHeader className="pb-4">
                      {course.badge && (
                        <Badge className={`w-fit mb-2 ${course.badge === freeBadge ? "bg-green-100 text-green-700 hover:bg-green-100" : course.badge === uniqueBadge ? "bg-primary/15 text-primary hover:bg-primary/15" : course.badge === authorBadge ? "bg-primary/10 text-primary/80 hover:bg-primary/10" : "bg-accent/10 text-accent hover:bg-accent/10"}`}>
                          {course.badge}
                        </Badge>
                      )}
                      <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-primary" /><span className="text-muted-foreground">{course.duration}</span></div>
                        <div className="flex items-center gap-2 text-sm"><BookOpen className="w-4 h-4 text-primary" /><span className="text-muted-foreground">{course.format}</span></div>
                        <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-primary" /><span className="text-muted-foreground">{course.audience}</span></div>
                      </div>
                    </CardContent>
                    <div className="mx-4 mb-2 px-3 py-2.5 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-2 text-sm font-semibold text-accent mb-0.5">
                        <span>📅 {t("courses.startDate", { date: course.nextDate })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{course.cta}</p>
                    </div>
                    <CardFooter className="flex flex-col gap-3 pt-4 border-t border-border">
                      <div className="text-2xl font-bold text-foreground w-full">{course.price}</div>
                      <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setSelectedCourse(course)}>
                        {t("courses.learnMore")}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          </div>
          <Button variant="outline" size="icon" className="absolute -left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg bg-background/90 backdrop-blur-sm hidden md:flex" onClick={scrollPrev}><ChevronLeft className="w-5 h-5" /></Button>
          <Button variant="outline" size="icon" className="absolute -right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg bg-background/90 backdrop-blur-sm hidden md:flex" onClick={scrollNext}><ChevronRight className="w-5 h-5" /></Button>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">{t("courses.noCourseFound")}</p>
          <Button variant="outline" size="lg" onClick={scrollToContact}>{t("courses.contactForConsultation")}</Button>
        </div>
      </div>

      <Dialog open={!!selectedCourse} onOpenChange={(open) => { if (!open) { setSelectedCourse(null); setIsSubmitted(false); setForm({ name: "", phone: "", email: "" }); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedCourse?.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{selectedCourse?.fullDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center p-3 bg-muted rounded-lg"><Clock className="w-4 h-4 mx-auto mb-1 text-primary" /><span className="text-muted-foreground">{selectedCourse?.duration}</span></div>
              <div className="text-center p-3 bg-muted rounded-lg"><BookOpen className="w-4 h-4 mx-auto mb-1 text-primary" /><span className="text-muted-foreground">{selectedCourse?.format}</span></div>
              <div className="text-center p-3 bg-muted rounded-lg"><Users className="w-4 h-4 mx-auto mb-1 text-primary" /><span className="text-muted-foreground">{selectedCourse?.audience}</span></div>
            </div>
            {selectedCourse?.topics && (
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t("courses.courseTopics")}</h4>
                <ul className="space-y-1">
                  {selectedCourse.topics.map((topic, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />{topic}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="text-2xl font-bold text-foreground">{selectedCourse?.price}</div>
            {isSubmitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3"><CheckCircle className="w-7 h-7 text-primary" /></div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{t("courses.courseSubmitted")}</h3>
                <p className="text-sm text-muted-foreground">{t("courses.courseSubmittedDesc")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-3 border-t border-border pt-4">
                <h4 className="font-semibold text-foreground">{isEn ? "Submit Request" : "Оставить заявку"}</h4>
                <div className="space-y-2">
                  <Label htmlFor="course-name">{t("courses.courseName")}</Label>
                  <Input id="course-name" placeholder="..." value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-phone">{t("courses.coursePhone")}</Label>
                  <Input id="course-phone" type="tel" placeholder="+7 (999) 123-45-67" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-email">{t("courses.courseEmail")}</Label>
                  <Input id="course-email" type="email" placeholder="example@mail.com" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("courses.courseSubmitting") : <><Send className="w-4 h-4 mr-2" />{t("courses.courseSubmit")}</>}
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
