import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Phone, Clock, Send, CheckCircle, Navigation, Train, Bus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Имя должно содержать минимум 2 символа").max(100, "Имя слишком длинное"),
  email: z.string().trim().email("Введите корректный email").max(255, "Email слишком длинный"),
  phone: z.string().trim().min(10, "Введите корректный номер телефона").max(20, "Номер телефона слишком длинный"),
  message: z.string().trim().min(10, "Сообщение должно содержать минимум 10 символов").max(1000, "Сообщение слишком длинное")
});

interface TransportRoute {
  name: string;
  time: string;
  detail: string;
}

interface BusRoute {
  number: string;
  detail: string;
}

interface ParkingInfo {
  emoji: string;
  title: string;
  description: React.ReactNode;
}

interface DirectionsData {
  metro: TransportRoute[];
  buses: BusRoute[];
  extras?: { emoji: string; title: string; description: string }[];
  parking?: ParkingInfo;
}

interface ClinicCardProps {
  name: string;
  address: string;
  phones: { number: string; href: string; label: string; isWhatsApp?: boolean }[];
  schedule: string;
  directions?: DirectionsData;
}

const ClinicCard = ({ name, address, phones, schedule, directions }: ClinicCardProps) => (
  <Card className="bg-card border-border shadow-lg h-full">
    <CardContent className="p-6 md:p-8">
      <h3 className="text-xl font-semibold text-primary mb-6">{name}</h3>
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Место приёма</p>
            <p className="text-muted-foreground text-sm">{address}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Телефоны</p>
            <div className="text-sm space-y-1">
              {phones.map((phone, i) => (
                <div key={i}>
                  <a
                    href={phone.isWhatsApp ? `https://wa.me/${phone.href}` : `tel:${phone.href}`}
                    target={phone.isWhatsApp ? "_blank" : undefined}
                    rel={phone.isWhatsApp ? "noopener noreferrer" : undefined}
                    className="text-primary font-medium hover:underline transition-colors"
                  >
                    {phone.number}
                  </a>
                  <span className="ml-2 text-muted-foreground">({phone.label})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Приём</p>
            <p className="text-muted-foreground text-sm">{schedule}</p>
          </div>
        </div>
      </div>
    </CardContent>

    {/* Directions block */}
    {directions && (
      <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0">
        <Card className="bg-secondary/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-foreground">Как добраться</h4>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {/* Metro */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Train className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Метро / МЦД</span>
                </div>
                <div className="space-y-1.5">
                  {directions.metro.map((r, i) => (
                    <div key={i} className="p-2 bg-card rounded-md border border-border">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-foreground">{r.name}</span>
                        <span className="text-[10px] text-muted-foreground">{r.time}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{r.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buses */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Bus className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Автобусы</span>
                </div>
                <div className="space-y-1.5">
                  {directions.buses.map((b, i) => (
                    <div key={i} className="p-2 bg-card rounded-md border border-border">
                      <div className="text-xs font-medium text-foreground mb-0.5">№ {b.number}</div>
                      <p className="text-[10px] text-muted-foreground">{b.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Extras (walking etc.) */}
            {directions.extras?.map((ex, i) => (
              <div key={i} className="mt-2 p-2 bg-card rounded-md border border-border flex items-start gap-2">
                <span className="text-sm">{ex.emoji}</span>
                <div>
                  <p className="text-xs font-medium text-foreground">{ex.title}</p>
                  <p className="text-[10px] text-muted-foreground">{ex.description}</p>
                </div>
              </div>
            ))}

            {/* Parking */}
            {directions.parking && (
              <div className="mt-2 p-2 bg-card rounded-md border border-border flex items-start gap-2">
                <span className="text-sm">{directions.parking.emoji}</span>
                <div>
                  <p className="text-xs font-medium text-foreground">{directions.parking.title}</p>
                  <p className="text-[10px] text-muted-foreground">{directions.parking.description}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )}
  </Card>
);

const aveClinicDirections: DirectionsData = {
  metro: [
    { name: "М Немчиновка", time: "14 мин", detail: "Пешком (950 м)" },
    { name: "ЖД Немчиновка", time: "13 мин", detail: "Пешком (900 м)" },
  ],
  buses: [
    { number: "794", detail: "до «Немчиновка» — 3 ост." },
    { number: "597м, 597", detail: "до «Немчиновка» — 4 ост." },
  ],
  parking: {
    emoji: "🚗",
    title: "Парковка",
    description: <>Закрытая парковка. Пароль — <span className="font-semibold">«В медицинский центр»</span></>,
  },
};

const mataraClinicDirections: DirectionsData = {
  metro: [
    { name: "М Селигерская", time: "15 мин", detail: "Авт. 672, 179 до «Коровинское ш.»" },
    { name: "М Ховрино", time: "10 мин", detail: "Авт. 672 до «Коровинское ш.»" },
  ],
  buses: [
    { number: "672", detail: "от м. Ховрино / Селигерская" },
    { number: "179", detail: "от м. Селигерская" },
  ],
  extras: [
    {
      emoji: "🚶",
      title: "Пешком от м. Ховрино",
      description: "~20 мин (1.5 км). Выход №3, по Коровинскому шоссе в сторону области до д. 9 к. 2",
    },
  ],
  parking: {
    emoji: "🚗",
    title: "Парковка",
    description: <>Въезд к наружной стороне дома (не во двор). Шлагбаумы <span className="font-semibold">№1</span> и <span className="font-semibold">№3</span> — для открытия позвоните по одному из телефонов клиники.</>,
  },
};

const countryCodes = [
  { code: "+7", country: "🇷🇺 Россия", flag: "🇷🇺" },
  { code: "+7", country: "🇰🇿 Казахстан", flag: "🇰🇿" },
  { code: "+375", country: "🇧🇾 Беларусь", flag: "🇧🇾" },
  { code: "+998", country: "🇺🇿 Узбекистан", flag: "🇺🇿" },
  { code: "+996", country: "🇰🇬 Киргизия", flag: "🇰🇬" },
  { code: "+374", country: "🇦🇲 Армения", flag: "🇦🇲" },
  { code: "+995", country: "🇬🇪 Грузия", flag: "🇬🇪" },
  { code: "+380", country: "🇺🇦 Украина", flag: "🇺🇦" },
  { code: "+90", country: "🇹🇷 Турция", flag: "🇹🇷" },
  { code: "+49", country: "🇩🇪 Германия", flag: "🇩🇪" },
  { code: "+972", country: "🇮🇱 Израиль", flag: "🇮🇱" },
  { code: "+1", country: "🇺🇸 США", flag: "🇺🇸" },
];

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({
        title: "Необходимо согласие",
        description: "Пожалуйста, дайте согласие на обработку персональных данных",
        variant: "destructive"
      });
      return;
    }
    try {
      const validatedData = contactSchema.parse(formData);
      setErrors({});
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в ближайшее время"
      });
      setTimeout(() => {
        setFormData({ name: "", email: "", phone: "", message: "" });
        setAgreed(false);
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Записаться на приём
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Приём ведётся в двух клиниках — выберите удобную для вас
          </p>
        </div>

        {/* Two clinics side by side */}
        <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-5xl mx-auto">
          <ClinicCard
            name="AVE-CLINIC"
            address="с. Немчиновка, 3-я Запрудная ул. дом 16"
            phones={[
              { number: "+7 (495) 374-81-81", href: "+74953748181", label: "для справок" },
              { number: "+7 (926) 600-555-0", href: "79266005550", label: "WhatsApp для записи", isWhatsApp: true },
              { number: "+7 (977) 807-55-44", href: "+79778075544", label: "для срочных вопросов" },
            ]}
            schedule="Только по предварительной записи"
            directions={aveClinicDirections}
          />
          <ClinicCard
            name="Клиника доктора Матара"
            address="г. Москва, Коровинское шоссе д. 9 к. 2"
            phones={[
              { number: "+7 (495) 303-00-00", href: "+74953030000", label: "регистратура" },
              { number: "+7 (926) 303-01-11", href: "+79263030111", label: "запись" },
              { number: "+7 (916) 030-30-31", href: "+79160303031", label: "запись" },
            ]}
            schedule="Только по предварительной записи"
            directions={mataraClinicDirections}
          />
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Форма обратной связи</CardTitle>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Заявка отправлена!</h3>
                  <p className="text-muted-foreground">Мы свяжемся с вами в ближайшее время</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ваше имя *</Label>
                      <Input id="name" name="name" placeholder="Иван Иванов" value={formData.name} onChange={handleChange} className={errors.name ? "border-destructive" : ""} />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+7 (___) ___-__-__"
                        value={formData.phone}
                        onChange={(e) => {
                          // Auto-format phone number
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.startsWith("8")) val = "7" + val.slice(1);
                          if (!val.startsWith("7") && val.length > 0) val = "7" + val;
                          let formatted = "";
                          if (val.length > 0) formatted = "+7";
                          if (val.length > 1) formatted += " (" + val.slice(1, 4);
                          if (val.length >= 4) formatted += ") " + val.slice(4, 7);
                          if (val.length >= 7) formatted += "-" + val.slice(7, 9);
                          if (val.length >= 9) formatted += "-" + val.slice(9, 11);
                          setFormData((prev) => ({ ...prev, phone: formatted }));
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                        }}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" placeholder="example@mail.ru" value={formData.email} onChange={handleChange} className={errors.email ? "border-destructive" : ""} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Сообщение *</Label>
                    <Textarea id="message" name="message" placeholder="Опишите вашу ситуацию или вопрос..." rows={4} value={formData.message} onChange={handleChange} className={errors.message ? "border-destructive" : ""} />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                    <Label htmlFor="agree" className="text-sm text-muted-foreground leading-tight">
                      Я согласен на обработку персональных данных в соответствии с политикой конфиденциальности
                    </Label>
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                    {isSubmitting ? "Отправка..." : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Отправить заявку
                      </>
                    )}
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
