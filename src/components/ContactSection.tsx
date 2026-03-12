import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Phone, Clock, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Имя должно содержать минимум 2 символа").max(100, "Имя слишком длинное"),
  email: z.string().trim().email("Введите корректный email").max(255, "Email слишком длинный"),
  phone: z.string().trim().min(10, "Введите корректный номер телефона").max(20, "Номер телефона слишком длинный"),
  message: z.string().trim().min(10, "Сообщение должно содержать минимум 10 символов").max(1000, "Сообщение слишком длинное")
});

interface ClinicCardProps {
  name: string;
  subtitle?: string;
  address: string;
  phones: { number: string; href: string; label: string; isWhatsApp?: boolean }[];
  schedule: string;
  directions?: string;
}

const ClinicCard = ({ name, subtitle, address, phones, schedule, directions }: ClinicCardProps) => (
  <Card className="bg-primary text-primary-foreground shadow-lg h-full">
    <CardContent className="p-6 md:p-8">
      <h3 className="text-xl font-semibold mb-6">{name}</h3>
      {subtitle && <p className="text-primary-foreground/80 text-sm mb-4 -mt-4">{subtitle}</p>}
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium mb-1">Место приёма</p>
            <p className="text-primary-foreground/80 text-sm">{address}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium mb-1">Телефоны</p>
            <div className="text-primary-foreground/80 text-sm space-y-1">
              {phones.map((phone, i) => (
                <div key={i}>
                  <a
                    href={phone.isWhatsApp ? `https://wa.me/${phone.href}` : `tel:${phone.href}`}
                    target={phone.isWhatsApp ? "_blank" : undefined}
                    rel={phone.isWhatsApp ? "noopener noreferrer" : undefined}
                    className="hover:text-primary-foreground transition-colors"
                  >
                    {phone.number}
                  </a>
                  <span className="ml-2 opacity-70">({phone.label})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium mb-1">Приём</p>
            <p className="text-primary-foreground/80 text-sm">{schedule}</p>
          </div>
        </div>
      </div>
    </CardContent>
    {directions && (
      <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0">
        <Card className="bg-primary-foreground/10 border-primary-foreground/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-primary-foreground mb-2">Как добраться</h4>
            <p className="text-sm text-primary-foreground/80">{directions}</p>
          </CardContent>
        </Card>
      </div>
    )}
  </Card>
);

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
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
            directions='Клиника расположена в с. Немчиновка, МКАД, наружная сторона, 55 км. Есть парковка для посетителей. На шлагбауме пароль "В клинику"'
          />
          <ClinicCard
            name="Клиника доктора Матара"
            subtitle="Международный андрологический центр"
            address="г. Москва, Коровинское шоссе д. 9 к. 2"
            phones={[
              { number: "+7 (495) 303-00-00", href: "+74953030000", label: "регистратура" },
              { number: "+7 (926) 303-01-11", href: "+79263030111", label: "запись" },
              { number: "+7 (916) 030-30-31", href: "+79160303031", label: "запись" },
            ]}
            schedule="Только по предварительной записи"
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
                      <Input id="phone" name="phone" type="tel" placeholder="+7 (999) 123-45-67" value={formData.phone} onChange={handleChange} className={errors.phone ? "border-destructive" : ""} />
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
