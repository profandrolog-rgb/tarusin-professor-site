import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Microscope, 
  Syringe, 
  Activity,
  CheckCircle2
} from "lucide-react";

const microsurgeryTechniques = [
  "Микрохирургическое лечение варикоцеле",
  "Реконструктивные операции на половом члене",
  "Операции при болезни Пейрони",
  "Микрохирургическая вазэктомия",
  "Восстановление проходимости семявыносящих путей",
  "Операции при крипторхизме",
  "Коррекция гидроцеле",
  "Орхопексия",
];

const diagnosticMethods = [
  "УЗИ органов мошонки с допплерографией",
  "УЗИ предстательной железы",
  "УЗИ мочевого пузыря",
  "Гормональная диагностика",
  "Спермограмма и MAR-тест",
  "Генетические исследования",
  "Биопсия яичка",
  "Термография мошонки",
];

const treatmentApproaches = [
  "Индивидуальный подход к каждому пациенту",
  "Малоинвазивные хирургические техники",
  "Применение современного микрохирургического оборудования",
  "Гормональная терапия",
  "Реабилитационные программы",
  "Психологическая поддержка пациентов",
  "Консервативное лечение",
  "Профилактические осмотры",
];

const Methodologies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Методики
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Современные подходы к диагностике и лечению урологических 
                и андрологических заболеваний
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
              {/* Microsurgery */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Microscope className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Микрохирургия</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Высокоточные операции с использованием микроскопа и специализированного инструментария
                  </p>
                  <div className="space-y-2">
                    {microsurgeryTechniques.map((technique, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{technique}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Diagnostics */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Диагностика</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Комплексное обследование с применением современного диагностического оборудования
                  </p>
                  <div className="space-y-2">
                    {diagnosticMethods.map((method, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{method}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Treatment Approaches */}
              <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Syringe className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Подходы к лечению</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Персонализированные программы лечения и реабилитации
                  </p>
                  <div className="space-y-2">
                    {treatmentApproaches.map((approach, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{approach}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Methodologies;
