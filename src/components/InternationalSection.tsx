import { Card, CardContent } from "@/components/ui/card";
import { Globe, MapPin, Users, Award } from "lucide-react";

const countries = [
  { name: "Казахстан", flag: "🇰🇿", activity: "Мастер-классы, консультации" },
  { name: "Узбекистан", flag: "🇺🇿", activity: "Образовательные программы" },
  { name: "Армения", flag: "🇦🇲", activity: "Консультации" },
  { name: "Грузия", flag: "🇬🇪", activity: "Выступления" },
  { name: "Турция", flag: "🇹🇷", activity: "Международные конференции" },
  { name: "Германия", flag: "🇩🇪", activity: "Научное сотрудничество" },
  { name: "Израиль", flag: "🇮🇱", activity: "Обмен опытом" },
  { name: "Италия", flag: "🇮🇹", activity: "Конференции" },
];

const InternationalSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <Globe size={16} />
            <span>Международная практика</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Признание за рубежом
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Профессор Тарусин регулярно проводит мастер-классы, консультации и выступления 
            в международных медицинских центрах
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
          <Card className="bg-secondary border-none">
            <CardContent className="p-4 text-center">
              <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold text-primary">8+</div>
              <div className="text-xs text-muted-foreground">Стран</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold text-primary">600+</div>
              <div className="text-xs text-muted-foreground">Обученных врачей</div>
            </CardContent>
          </Card>
          <Card className="bg-secondary border-none">
            <CardContent className="p-4 text-center">
              <Award className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold text-primary">860+</div>
              <div className="text-xs text-muted-foreground">Выступлений</div>
            </CardContent>
          </Card>
        </div>

        {/* Countries grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {countries.map((country, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{country.flag}</div>
                <p className="font-medium text-foreground text-sm">{country.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{country.activity}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Note about international patients */}
        <Card className="mt-10 bg-accent/10 border-accent/20 max-w-3xl mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              🌍 <span className="font-medium text-foreground">Для иностранных пациентов:</span> профессор 
              принимает пациентов из любой страны мира. Предварительная онлайн-консультация позволит 
              спланировать визит и сократить время пребывания в Москве.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default InternationalSection;
