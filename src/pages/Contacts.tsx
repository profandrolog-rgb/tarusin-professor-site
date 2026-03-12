import { useState } from "react";
import { ArrowLeft, MapPin, Send, Instagram, Youtube, Phone, Clock, Train, Bus, Navigation, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const VkIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.136.678-1.252.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.473 4 7.996c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.472 2.27 4.638 2.86 4.638.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.148-3.574 2.148-3.574.119-.254.305-.491.744-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const socialLinks = [
  {
    name: "Telegram",
    Icon: TelegramIcon,
    url: "https://t.me/Professor_DI",
    handle: "@Professor_DI"
  },
  {
    name: "WhatsApp",
    Icon: MessageCircle,
    url: "https://wa.me/79778075544",
    handle: "+7 (977) 807-55-44"
  },
  {
    name: "Instagram",
    Icon: Instagram,
    url: "https://www.instagram.com/androlog_di/",
    handle: "@androlog_di"
  },
  {
    name: "ВКонтакте",
    Icon: VkIcon,
    url: "https://vk.com/androlog_di",
    handle: "androlog_di"
  },
  {
    name: "Facebook",
    Icon: FacebookIcon,
    url: "https://www.facebook.com/andrologDI/",
    handle: "andrologDI"
  },
  {
    name: "YouTube",
    Icon: Youtube,
    url: "https://www.youtube.com/@tarusindi",
    handle: "@tarusindi"
  }
];

const Contacts = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from("appointment_requests")
      .insert({
        parent_name: formData.name,
        contact_email: formData.email,
        contact_phone: formData.phone || null,
        child_age: formData.age || "Не указан",
        problem_description: formData.message,
      });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить заявку. Попробуйте позже.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    toast({
      title: "Заявка отправлена",
      description: "Мы свяжемся с вами в ближайшее время",
    });
    
    setFormData({
      name: "",
      email: "",
      phone: "",
      age: "",
      message: ""
    });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Контакты</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            Свяжитесь со мной для записи на консультацию или по любым вопросам
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Two Clinics Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Clinic 1 - AVE-CLINIC */}
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-foreground mb-6">AVE-CLINIC</h2>
            
            {/* Info Card */}
            <Card className="mb-6 flex-shrink-0">
              <CardContent className="p-6">
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-accent" />
                      </div>
                      <h3 className="font-semibold text-foreground">Телефоны</h3>
                    </div>
                    <div className="space-y-2 ml-14">
                      <div className="flex items-center">
                        <a href="tel:+74953748181" className="text-primary font-medium hover:underline">+7 (495) 374-81-81</a>
                        <span className="text-muted-foreground text-sm ml-3">(для справок)</span>
                      </div>
                      <div className="flex items-center">
                        <a href="https://wa.me/79266005550" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">+7 (926) 600-555-0</a>
                        <span className="text-muted-foreground text-sm ml-3">(WhatsApp для записи)</span>
                      </div>
                      <div className="flex items-center">
                        <a href="tel:+79778075544" className="text-primary font-medium hover:underline">+7 (977) 807-55-44</a>
                        <span className="text-muted-foreground text-sm ml-3">(для срочных вопросов)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Место приёма</h3>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">AVE-CLINIC</span><br />
                        с. Немчиновка, 3-я Запрудная ул. дом 16
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Приём</h3>
                      <p className="text-muted-foreground">Только по предварительной записи</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="mb-6 overflow-hidden flex-shrink-0">
              <CardContent className="p-0">
                <iframe
                  src="https://yandex.ru/map-widget/v1/?ll=37.370515%2C55.723389&z=16&pt=37.370515%2C55.723389%2Cpm2rdm&l=map"
                  width="100%"
                  height="280"
                  frameBorder="0"
                  title="Карта AVE-CLINIC"
                  className="w-full"
                  allowFullScreen
                />
              </CardContent>
            </Card>

            {/* How to get there */}
            <Card className="flex-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">Как добраться</h3>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Train className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground text-sm">Метро и МЦД</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-primary">М Немчиновка</span>
                          <span className="text-muted-foreground text-xs">14 мин</span>
                        </div>
                        <p className="text-muted-foreground text-xs">Пешком (950 м)</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-primary">ЖД Немчиновка</span>
                          <span className="text-muted-foreground text-xs">13 мин</span>
                        </div>
                        <p className="text-muted-foreground text-xs">Пешком (900 м)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Bus className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground text-sm">Автобусы</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <div className="font-medium text-foreground mb-1">№ 794</div>
                        <p className="text-muted-foreground text-xs">до «Немчиновка» — 3 ост.</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <div className="font-medium text-foreground mb-1">№ 597м, 597</div>
                        <p className="text-muted-foreground text-xs">до «Немчиновка» — 4 ост.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parking */}
                <div className="mt-4 p-3 bg-accent/10 rounded-lg flex items-start gap-3">
                  <span className="text-lg">🚗</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Парковка</p>
                    <p className="text-xs text-muted-foreground">
                      Закрытая парковка. Пароль — <span className="font-semibold text-primary">«В медицинский центр»</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clinic 2 - Клиника доктора Матара */}
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-foreground mb-6">Клиника доктора Матара</h2>
            
            {/* Info Card */}
            <Card className="mb-6 flex-shrink-0">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground font-medium mb-4">Международный андрологический центр</p>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-accent" />
                      </div>
                      <h3 className="font-semibold text-foreground">Телефоны</h3>
                    </div>
                    <div className="space-y-2 ml-14">
                      <div className="flex items-center">
                        <a href="tel:+74953030000" className="text-primary font-medium hover:underline">+7 (495) 303-00-00</a>
                        <span className="text-muted-foreground text-sm ml-3">(регистратура)</span>
                      </div>
                      <div className="flex items-center">
                        <a href="tel:+79263030111" className="text-primary font-medium hover:underline">+7 (926) 303-01-11</a>
                        <span className="text-muted-foreground text-sm ml-3">(запись)</span>
                      </div>
                      <div className="flex items-center">
                        <a href="tel:+79160303031" className="text-primary font-medium hover:underline">+7 (916) 030-30-31</a>
                        <span className="text-muted-foreground text-sm ml-3">(запись)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Место приёма</h3>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Клиника доктора Матара</span><br />
                        г. Москва, Коровинское шоссе д. 9 к. 2
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Приём</h3>
                      <p className="text-muted-foreground">Только по предварительной записи</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="mb-6 overflow-hidden flex-shrink-0">
              <CardContent className="p-0">
                <iframe
                  src="https://yandex.ru/map-widget/v1/?ll=37.556500%2C55.893000&z=16&pt=37.556500%2C55.893000%2Cpm2rdm&l=map"
                  width="100%"
                  height="280"
                  frameBorder="0"
                  title="Карта Клиники доктора Матара"
                  className="w-full"
                  allowFullScreen
                />
              </CardContent>
            </Card>

            {/* How to get there */}
            <Card className="flex-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">Как добраться</h3>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Train className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground text-sm">Метро</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-primary">М Селигерская</span>
                          <span className="text-muted-foreground text-xs">15 мин</span>
                        </div>
                        <p className="text-muted-foreground text-xs">Авт. 672, 179 до «Коровинское ш.»</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-primary">М Ховрино</span>
                          <span className="text-muted-foreground text-xs">10 мин</span>
                        </div>
                        <p className="text-muted-foreground text-xs">Авт. 672 до «Коровинское ш.»</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Bus className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground text-sm">Автобусы</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <div className="font-medium text-foreground mb-1">№ 672</div>
                        <p className="text-muted-foreground text-xs">от м. Ховрино / Селигерская</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <div className="font-medium text-foreground mb-1">№ 179</div>
                        <p className="text-muted-foreground text-xs">от м. Селигерская</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* On foot */}
                <div className="mt-4 p-3 bg-accent/10 rounded-lg flex items-start gap-3">
                  <span className="text-lg">🚶</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Пешком от м. Ховрино</p>
                    <p className="text-xs text-muted-foreground">
                      ~20 мин (1.5 км). Выход №3, по Коровинскому шоссе в сторону области до д. 9 к. 2
                    </p>
                  </div>
                </div>

                {/* Parking */}
                <div className="mt-4 p-3 bg-accent/10 rounded-lg flex items-start gap-3">
                  <span className="text-lg">🚗</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Парковка</p>
                    <p className="text-xs text-muted-foreground">
                      Въезд к наружной стороне дома (не во двор). Шлагбаумы <span className="font-semibold text-primary">№1</span> и <span className="font-semibold text-primary">№3</span> — для открытия позвоните по одному из телефонов клиники.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Shared Social Links */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-4">Социальные сети</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {socialLinks.map((social, index) => {
              const IconComponent = social.Icon;
              return (
                <Card 
                  key={index}
                  className="group cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                  onClick={() => window.open(social.url, "_blank")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground text-sm">{social.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{social.handle}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Contact Form - Full Width */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Форма заявки</h2>
          
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ваше имя" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Возраст пациента</Label>
                    <Input id="age" name="age" value={formData.age} onChange={handleChange} placeholder="Например: 7 лет" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Краткое описание проблемы *</Label>
                  <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Опишите вашу ситуацию или вопрос..." rows={5} required />
                </div>
                <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                  {isSubmitting ? "Отправка..." : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Отправить заявку
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                </p>
              </form>
            </CardContent>
          </Card>
          
          {/* Parking Info */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🚗</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Парковка (AVE-CLINIC)</h3>
                  <p className="text-muted-foreground">
                    Для пациентов предусмотрена закрытая парковка. На охране сообщить пароль — <span className="font-semibold text-primary">«В медицинский центр»</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Contacts;
