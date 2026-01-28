import { useState } from "react";
import { ArrowLeft, MapPin, Send, Instagram, Youtube, Phone, MessageCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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

const socialLinks = [
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
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Информация</h2>
            
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-accent" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-accent" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Телефоны</h3>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <a 
                            href="tel:+74953748181" 
                            className="text-primary font-medium hover:underline min-w-[170px]"
                          >
                            +7 (495) 374-81-81
                          </a>
                          <span className="text-muted-foreground text-sm">(для справок)</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <a 
                            href="https://wa.me/79266005550" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary font-medium hover:underline min-w-[170px]"
                          >
                            +7 (926) 600-555-0
                          </a>
                          <span className="text-muted-foreground text-sm">(WhatsApp для записи)</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <a 
                            href="tel:+79778075544" 
                            className="text-primary font-medium hover:underline min-w-[170px]"
                          >
                            +7 (977) 807-55-44
                          </a>
                          <span className="text-muted-foreground text-sm">(для срочных вопросов)</span>
                        </div>
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
            <Card className="mb-8 overflow-hidden">
              <CardContent className="p-0">
                <iframe
                  src="https://yandex.ru/map-widget/v1/?ll=37.370515%2C55.723389&z=16&pt=37.370515%2C55.723389%2Cpm2rdm&l=map"
                  width="100%"
                  height="300"
                  frameBorder="0"
                  title="Карта AVE-CLINIC"
                  className="w-full"
                  allowFullScreen
                />
              </CardContent>
            </Card>

            <h3 className="text-lg font-semibold text-foreground mb-4">Социальные сети</h3>
            <div className="grid grid-cols-2 gap-4">
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
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-sm">{social.name}</div>
                          <div className="text-xs text-muted-foreground">{social.handle}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Форма заявки</h2>
            
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Имя *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ваше имя"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Возраст пациента</Label>
                      <Input
                        id="age"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Например: 7 лет"
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+7 (___) ___-__-__"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Краткое описание проблемы *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Опишите вашу ситуацию или вопрос..."
                      rows={5}
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Отправка..."
                    ) : (
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contacts;
