import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Phone, Clock, Send, CheckCircle, Navigation, Train, Bus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { z } from "zod";

interface TransportRoute { name: string; time: string; detail: string; }
interface BusRoute { number: string; detail: string; }
interface ParkingInfo { emoji: string; title: string; description: React.ReactNode; }
interface DirectionsData { metro: TransportRoute[]; buses: BusRoute[]; extras?: { emoji: string; title: string; description: string }[]; parking?: ParkingInfo; }

interface ClinicCardProps {
  name: string; address: string;
  phones: { number: string; href: string; label: string; isWhatsApp?: boolean }[];
  schedule: string; directions?: DirectionsData;
  labels: { reception: string; phones: string; schedule: string; howToGet: string; metro: string; buses: string; parking: string };
}

const ClinicCard = ({ name, address, phones, schedule, directions, labels }: ClinicCardProps) => (
  <Card className="bg-card border-border shadow-lg h-full">
    <CardContent className="p-6 md:p-8">
      <h3 className="text-xl font-semibold text-primary mb-6">{name}</h3>
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-primary" /></div>
          <div><p className="font-medium text-foreground mb-1">{labels.reception}</p><p className="text-muted-foreground text-sm">{address}</p></div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5 text-primary" /></div>
          <div><p className="font-medium text-foreground mb-1">{labels.phones}</p>
            <div className="text-sm space-y-1">
              {phones.map((phone, i) => (
                <div key={i}><a href={phone.isWhatsApp ? `https://wa.me/${phone.href}` : `tel:${phone.href}`} target={phone.isWhatsApp ? "_blank" : undefined} rel={phone.isWhatsApp ? "noopener noreferrer" : undefined} className="text-primary font-medium hover:underline transition-colors">{phone.number}</a><span className="ml-2 text-muted-foreground">({phone.label})</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-primary" /></div>
          <div><p className="font-medium text-foreground mb-1">{labels.schedule}</p><p className="text-muted-foreground text-sm">{schedule}</p></div>
        </div>
      </div>
    </CardContent>
    {directions && (
      <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0">
        <Card className="bg-secondary/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3"><Navigation className="w-4 h-4 text-primary" /><h4 className="font-semibold text-foreground">{labels.howToGet}</h4></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-2"><Train className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-foreground">{labels.metro}</span></div>
                <div className="space-y-1.5">{directions.metro.map((r, i) => (<div key={i} className="p-2 bg-card rounded-md border border-border"><div className="flex items-center justify-between mb-0.5"><span className="text-xs font-medium text-foreground">{r.name}</span><span className="text-[10px] text-muted-foreground">{r.time}</span></div><p className="text-[10px] text-muted-foreground">{r.detail}</p></div>))}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2"><Bus className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-foreground">{labels.buses}</span></div>
                <div className="space-y-1.5">{directions.buses.map((b, i) => (<div key={i} className="p-2 bg-card rounded-md border border-border"><div className="text-xs font-medium text-foreground mb-0.5">№ {b.number}</div><p className="text-[10px] text-muted-foreground">{b.detail}</p></div>))}</div>
              </div>
            </div>
            {directions.extras?.map((ex, i) => (<div key={i} className="mt-2 p-2 bg-card rounded-md border border-border flex items-start gap-2"><span className="text-sm">{ex.emoji}</span><div><p className="text-xs font-medium text-foreground">{ex.title}</p><p className="text-[10px] text-muted-foreground">{ex.description}</p></div></div>))}
            {directions.parking && (<div className="mt-2 p-2 bg-card rounded-md border border-border flex items-start gap-2"><span className="text-sm">{directions.parking.emoji}</span><div><p className="text-xs font-medium text-foreground">{directions.parking.title}</p><p className="text-[10px] text-muted-foreground">{directions.parking.description}</p></div></div>)}
          </CardContent>
        </Card>
      </div>
    )}
  </Card>
);

const ContactSection = () => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactSchema = z.object({
    name: z.string().trim().min(2, isEn ? "Name must be at least 2 characters" : "Имя должно содержать минимум 2 символа").max(100),
    email: z.string().trim().email(isEn ? "Enter a valid email" : "Введите корректный email").max(255),
    phone: z.string().trim().min(10, isEn ? "Enter a valid phone number" : "Введите корректный номер телефона").max(20),
    message: z.string().trim().min(10, isEn ? "Message must be at least 10 characters" : "Сообщение должно содержать минимум 10 символов").max(1000)
  });

  const labels = {
    reception: t("contact.reception"), phones: t("contact.phones"), schedule: t("contact.schedule"),
    howToGet: t("contact.howToGet"), metro: t("contact.metro"), buses: t("contact.buses"), parking: t("contact.parking"),
  };

  const aveDirections: DirectionsData = {
    metro: [
      { name: isEn ? "Nemchinovka Station" : "М Немчиновка", time: isEn ? "14 min" : "14 мин", detail: isEn ? "Walk (950 m)" : "Пешком (950 м)" },
      { name: isEn ? "Nemchinovka Railway" : "ЖД Немчиновка", time: isEn ? "13 min" : "13 мин", detail: isEn ? "Walk (900 m)" : "Пешком (900 м)" },
    ],
    buses: [
      { number: "794", detail: isEn ? "to 'Nemchinovka' — 3 stops" : "до «Немчиновка» — 3 ост." },
      { number: "597м, 597", detail: isEn ? "to 'Nemchinovka' — 4 stops" : "до «Немчиновка» — 4 ост." },
    ],
    parking: { emoji: "🚗", title: isEn ? "Parking" : "Парковка", description: isEn ? <>Gated parking. Password — <span className="font-semibold">"To the medical center"</span></> : <>Закрытая парковка. Пароль — <span className="font-semibold">«В медицинский центр»</span></> },
  };

  const mataraDirections: DirectionsData = {
    metro: [
      { name: isEn ? "Seligerskaya Station" : "М Селигерская", time: isEn ? "15 min" : "15 мин", detail: isEn ? "Bus 672, 179 to 'Korovinskoye Hwy'" : "Авт. 672, 179 до «Коровинское ш.»" },
      { name: isEn ? "Khovrino Station" : "М Ховрино", time: isEn ? "10 min" : "10 мин", detail: isEn ? "Bus 672 to 'Korovinskoye Hwy'" : "Авт. 672 до «Коровинское ш.»" },
    ],
    buses: [
      { number: "672", detail: isEn ? "from Khovrino / Seligerskaya" : "от м. Ховрино / Селигерская" },
      { number: "179", detail: isEn ? "from Seligerskaya" : "от м. Селигерская" },
    ],
    extras: [{ emoji: "🚶", title: isEn ? "Walk from Khovrino" : "Пешком от м. Ховрино", description: isEn ? "~20 min (1.5 km). Exit #3, along Korovinskoye Hwy towards the suburbs to Bldg 9/2" : "~20 мин (1.5 км). Выход №3, по Коровинскому шоссе в сторону области до д. 9 к. 2" }],
    parking: { emoji: "🚗", title: isEn ? "Parking" : "Парковка", description: isEn ? <>Enter from the outer side (not the courtyard). Gates <span className="font-semibold">#1</span> and <span className="font-semibold">#3</span> — call the clinic to open.</> : <>Въезд к наружной стороне дома (не во двор). Шлагбаумы <span className="font-semibold">№1</span> и <span className="font-semibold">№3</span> — для открытия позвоните по одному из телефонов клиники.</> },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast({ title: t("contact.consentRequired"), variant: "destructive" }); return; }
    try {
      contactSchema.parse(formData);
      setErrors({});
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      toast({ title: t("contact.sent"), description: t("contact.sentDesc") });
      setTimeout(() => { setFormData({ name: "", email: "", phone: "", message: "" }); setAgreed(false); setIsSubmitted(false); }, 3000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => { if (err.path[0]) newErrors[err.path[0] as string] = err.message; });
        setErrors(newErrors);
      }
    } finally { setIsSubmitting(false); }
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("contact.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("contact.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-5xl mx-auto">
          <ClinicCard
            name="AVE-CLINIC"
            address={isEn ? "Nemchinovka, 3rd Zaprudnaya St. 16" : "с. Немчиновка, 3-я Запрудная ул. дом 16"}
            phones={[
              { number: "+7 (495) 374-81-81", href: "+74953748181", label: isEn ? "inquiries" : "для справок" },
              { number: "+7 (926) 600-555-0", href: "79266005550", label: isEn ? "WhatsApp booking" : "WhatsApp для записи", isWhatsApp: true },
              { number: "+7 (977) 807-55-44", href: "+79778075544", label: isEn ? "urgent" : "для срочных вопросов" },
            ]}
            schedule={isEn ? "By appointment only" : "Только по предварительной записи"}
            directions={aveDirections}
            labels={labels}
          />
          <ClinicCard
            name={isEn ? "Dr. Matara's Clinic" : "Клиника доктора Матара"}
            address={isEn ? "Moscow, Korovinskoye Hwy 9, Bldg 2" : "г. Москва, Коровинское шоссе д. 9 к. 2"}
            phones={[
              { number: "+7 (495) 303-00-00", href: "+74953030000", label: isEn ? "reception" : "регистратура" },
              { number: "+7 (926) 303-01-11", href: "+79263030111", label: isEn ? "booking" : "запись" },
              { number: "+7 (916) 030-30-31", href: "+79160303031", label: isEn ? "booking" : "запись" },
            ]}
            schedule={isEn ? "By appointment only" : "Только по предварительной записи"}
            directions={mataraDirections}
            labels={labels}
          />
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader><CardTitle className="text-xl">{t("contact.formTitle")}</CardTitle></CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-primary" /></div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{t("contact.sent")}</h3>
                  <p className="text-muted-foreground">{t("contact.sentDesc")}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t("contact.name")}</Label>
                      <Input id="name" name="name" placeholder={t("contact.namePlaceholder")} value={formData.name} onChange={handleChange} className={errors.name ? "border-destructive" : ""} />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("contact.phone")}</Label>
                      <Input id="phone" name="phone" type="tel" placeholder={t("contact.phonePlaceholder")} value={formData.phone} onChange={handleChange} className={errors.phone ? "border-destructive" : ""} />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("contact.email")}</Label>
                    <Input id="email" name="email" type="email" placeholder={t("contact.emailPlaceholder")} value={formData.email} onChange={handleChange} className={errors.email ? "border-destructive" : ""} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{t("contact.message")}</Label>
                    <Textarea id="message" name="message" placeholder={t("contact.messagePlaceholder")} rows={4} value={formData.message} onChange={handleChange} className={errors.message ? "border-destructive" : ""} />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                    <Label htmlFor="agree" className="text-sm text-muted-foreground leading-tight">{t("contact.consent")}</Label>
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                    {isSubmitting ? t("contact.sending") : <><Send className="w-4 h-4 mr-2" />{t("contact.send")}</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
