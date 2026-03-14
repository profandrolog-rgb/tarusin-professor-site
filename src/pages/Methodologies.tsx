import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Microscope, Syringe, Activity, CheckCircle2 } from "lucide-react";

interface MethodItem {
  name: string;
  description: string;
}

const microsurgeryTechniques: MethodItem[] = [
  { name: "Микрохирургическое лечение варикоцеле", description: "Высокоточная операция под оптическим увеличением для устранения варикозного расширения вен семенного канатика. Позволяет сохранить лимфатические сосуды и артерии, минимизируя риск рецидива и осложнений." },
  { name: "Реконструктивные операции на половом члене", description: "Комплекс хирургических вмешательств для восстановления анатомии и функции полового члена после травм, врождённых аномалий или перенесённых заболеваний." },
  { name: "Операции при болезни Пейрони", description: "Хирургическая коррекция фиброзных бляшек белочной оболочки полового члена, вызывающих искривление и болезненную эрекцию. Применяются техники пликации, графтинга и протезирования." },
  { name: "Коррекция искривлений полового члена", description: "Устранение врождённых или приобретённых деформаций полового члена с использованием различных хирургических методик для восстановления нормальной анатомии." },
  { name: "Ревитализация полового члена", description: "Комплекс процедур для улучшения кровоснабжения и чувствительности полового члена, включающий введение факторов роста и стимуляцию регенеративных процессов." },
  { name: "Гиалуроновая пластика полового члена", description: "Инъекционное введение гиалуроновой кислоты для увеличения объёма головки и ствола полового члена, коррекции асимметрии и улучшения эстетического вида." },
  { name: "Удлинение полового члена", description: "Хирургические методики увеличения длины полового члена, включающие рассечение связочного аппарата и применение дополнительных техник удлинения." },
  { name: "Лигаментотомия", description: "Рассечение подвешивающей связки полового члена для визуального удлинения за счёт выведения скрытой части органа. Выполняется с последующим применением экстендеров." },
  { name: "Установка экстендеров", description: "Подбор и обучение использованию специальных устройств для постепенного удлинения полового члена после лигаментотомии или как самостоятельный метод." },
  { name: "Пластика крайней плоти", description: "Хирургическая коррекция крайней плоти при её избытке, недостатке или деформациях, включая устранение рубцовых изменений." },
  { name: "Обрезание крайней плоти", description: "Циркумцизия — удаление крайней плоти по медицинским, гигиеническим или эстетическим показаниям с применением микрохирургической техники." },
  { name: "Френулопластика под микроскопом", description: "Микрохирургическая коррекция короткой уздечки полового члена с использованием оптического увеличения для максимальной точности и минимальной травматизации." },
  { name: "Микрохирургическая вазэктомия", description: "Высокоточная операция по пересечению семявыносящих протоков для мужской контрацепции с минимальным риском осложнений." },
  { name: "Восстановление проходимости семявыносящих путей", description: "Микрохирургическая реконструкция семявыносящих протоков (вазовазостомия, вазоэпидидимостомия) для восстановления фертильности после вазэктомии или обструкции." },
  { name: "Операции при крипторхизме", description: "Хирургическое низведение неопустившегося яичка в мошонку (орхипексия) для обеспечения нормального развития и функции гонады." },
  { name: "Коррекция гидроцеле", description: "Устранение водянки оболочек яичка — скопления жидкости между оболочками, вызывающего увеличение мошонки и дискомфорт." },
  { name: "Гидатидэктомия", description: "Удаление гидатиды яичка или придатка — рудиментарного образования, которое может подвергаться перекруту и вызывать острую боль." },
  { name: "Орхопексия", description: "Фиксация яичка в мошонке при его патологической подвижности или после перенесённого перекрута для предотвращения повторных эпизодов." },
  { name: "Протезирование яичка", description: "Имплантация силиконового протеза яичка после его удаления для восстановления эстетического вида мошонки и психологического комфорта пациента." },
  { name: "Удаление гинекомастии", description: "Хирургическое лечение увеличения грудных желёз у мужчин путём удаления избыточной железистой ткани и липосакции." },
  { name: "Липопластика и липосакция лобка", description: "Удаление избыточной жировой ткани в лобковой области для улучшения эстетики и визуального увеличения полового члена." },
  { name: "PRP полового члена", description: "Инъекции плазмы, обогащённой тромбоцитами, для стимуляции регенерации тканей, улучшения эректильной функции и чувствительности полового члена." }
];

const diagnosticMethods: MethodItem[] = [
  { name: "УЗИ органов мошонки с допплерографией", description: "Ультразвуковое исследование яичек, придатков и семенного канатика с оценкой кровотока для выявления варикоцеле, опухолей, воспалительных процессов." },
  { name: "УЗИ предстательной железы", description: "Трансректальное или трансабдоминальное ультразвуковое исследование простаты для оценки её размеров, структуры и выявления патологических изменений." },
  { name: "УЗИ мочевого пузыря", description: "Ультразвуковое исследование мочевого пузыря для оценки его объёма, толщины стенок, наличия остаточной мочи и патологических образований." },
  { name: "Фармакодопплерография полового члена", description: "Ультразвуковое исследование сосудов полового члена после введения вазоактивного препарата для диагностики причин эректильной дисфункции." },
  { name: "Запись ночной эрекции", description: "Мониторинг ночных пенильных тумесценций (NPT-тест) для дифференциальной диагностики органической и психогенной эректильной дисфункции." },
  { name: "УЗИ мышц тазовой диафрагмы (тазовое дно)", description: "Ультразвуковая оценка состояния мышц тазового дна, их тонуса и координации для диагностики тазовых болей и нарушений мочеиспускания." },
  { name: "УЗИ аорто-мезентериального конфликта", description: "Диагностика сдавления левой почечной вены между аортой и верхней брыжеечной артерией (синдром Щелкунчика), вызывающего варикоцеле и гематурию." },
  { name: "УЗИ щитовидной железы с допплером", description: "Комплексное ультразвуковое исследование щитовидной железы с оценкой кровотока для выявления узлов, изменений структуры и васкуляризации." },
  { name: "УЗД May-Thurner syndrome", description: "Ультразвуковая диагностика синдрома Мэя-Тёрнера — сдавления левой общей подвздошной вены правой общей подвздошной артерией." },
  { name: "Гормональная диагностика", description: "Комплексное исследование гормонального профиля: тестостерон, ЛГ, ФСГ, пролактин, эстрадиол, ГСПГ, гормоны щитовидной железы для оценки эндокринного статуса." },
  { name: "Спермограмма и MAR-тест", description: "Анализ эякулята с оценкой концентрации, подвижности, морфологии сперматозоидов и тест на антиспермальные антитела для диагностики мужского бесплодия." },
  { name: "Биохимия спермы", description: "Исследование биохимических показателей эякулята: фруктоза, цинк, лимонная кислота для оценки функции предстательной железы и семенных пузырьков." },
  { name: "Электронная микроскопия сперматозоидов", description: "Детальное изучение ультраструктуры сперматозоидов для выявления генетических и структурных аномалий, влияющих на фертильность." },
  { name: "Дифференцированный подсчет клеток воспаления в сперме", description: "Определение типов и количества лейкоцитов в эякуляте для диагностики воспалительных заболеваний репродуктивного тракта." },
  { name: "Генетические исследования", description: "Кариотипирование, анализ микроделеций Y-хромосомы, исследование гена CFTR для выявления генетических причин бесплодия и азооспермии." },
  { name: "Биопсия яичка", description: "Диагностическая или терапевтическая биопсия ткани яичка для определения сперматогенеза и получения сперматозоидов для ЭКО/ИКСИ." },
  { name: "Термография мошонки", description: "Инфракрасное исследование температурного распределения в области мошонки для диагностики варикоцеле и оценки терморегуляции яичек." },
  { name: "Психологические тесты с ЭЭГ", description: "Комплексная психофизиологическая диагностика с использованием электроэнцефалографии для оценки психогенных факторов сексуальных расстройств." },
  { name: "Респираторный мониторинг сна", description: "Полисомнографическое исследование для выявления синдрома обструктивного апноэ сна, связанного со снижением тестостерона и эректильной дисфункцией." },
  { name: "Суточный мониторинг артериального давления", description: "24-часовая регистрация артериального давления для выявления гипертензии, влияющей на эректильную функцию и общее состояние здоровья." }
];

const treatmentApproaches: MethodItem[] = [
  { name: "Индивидуальный подход к каждому пациенту", description: "Разработка персонализированной стратегии лечения с учётом особенностей заболевания, сопутствующей патологии, образа жизни и предпочтений пациента." },
  { name: "Малоинвазивные хирургические техники", description: "Применение щадящих методов операций с минимальными разрезами, быстрым восстановлением и низким риском осложнений." },
  { name: "Применение современного микрохирургического оборудования", description: "Использование операционных микроскопов, микроинструментария и современных шовных материалов для максимальной точности вмешательств." },
  { name: "Гормональная терапия", description: "Коррекция гормональных нарушений с использованием заместительной терапии тестостероном, антиэстрогенов, гонадотропинов по индивидуальным схемам." },
  { name: "Реабилитационные программы", description: "Комплексные программы восстановления после операций, включающие физиотерапию, ЛФК, диетотерапию и психологическую поддержку." },
  { name: "Психологическая поддержка пациентов", description: "Консультирование и психотерапия при сексуальных расстройствах, бесплодии и других состояниях, требующих психологической помощи." },
  { name: "Консервативное лечение", description: "Медикаментозная терапия урологических и андрологических заболеваний как альтернатива или дополнение к хирургическому лечению." },
  { name: "Профилактические осмотры", description: "Регулярные обследования для раннего выявления заболеваний мочеполовой системы и предотвращения осложнений." }
];

const physiotherapyMethods: MethodItem[] = [
  { name: "Термовибротерапия простаты", description: "Физиотерапевтическое воздействие на предстательную железу с использованием локального нагрева и вибрации для улучшения микроциркуляции и уменьшения воспаления." },
  { name: "HILT мочевого пузыря, тазовых мышц, нервов таза (семенного канатика, полового члена, тазового нервного сплетения), простаты и семенных пузырьков", description: "Высокоинтенсивная лазерная терапия для глубокого воздействия на ткани, уменьшения боли, воспаления и стимуляции регенерации." },
  { name: "HIMS,SYS мочевого пузыря, тазовых мышц, нервов таза (семенного канатика, полового члена, тазового нервного сплетения), простаты и семенных пузырьков", description: "Высокоинтенсивная магнитная стимуляция для укрепления мышц тазового дна, улучшения нервной проводимости и лечения хронических болевых синдромов." },
  { name: "HFT+MT - мягкая коррекция вегетативных расстройств по принципам китайской традиции", description: "Комплексная методика сочетания высокочастотной терапии и мануальных техник на основе принципов традиционной китайской медицины для восстановления баланса вегетативной нервной системы." },
  { name: "Иглорефлексотерапия", description: "Воздействие на биологически активные точки тонкими иглами для регуляции функций организма, снятия болевых синдромов и улучшения кровообращения." },
  { name: "Dry Needle", description: "Методика сухого иглоукалывания для устранения миофасциальных триггерных точек, снятия мышечного спазма и хронической тазовой боли." },
  { name: "Пост изометрическая релаксация", description: "Мануальная техника расслабления мышц после их кратковременного изометрического напряжения для лечения мышечных спазмов тазового дна." }
];

const generateId = (name: string) => {
  return name.toLowerCase().replace(/[^а-яёa-z0-9]/gi, '-').replace(/-+/g, '-');
};

const scrollToDescription = (name: string) => {
  const id = generateId(name);
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const Methodologies = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageMeta title="Методики лечения — Проф. Тарусин Д.И." description="Микрохирургические, диагностические и физиотерапевтические методики профессора Тарусина для лечения урологических и андрологических заболеваний." path="/methodologies" />
      <main className="pt-20">
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Методики
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Инновационные авторские подходы к диагностике и лечению урологических и андрологических заболеваний
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
                  <p className="text-sm text-muted-foreground mb-4 font-normal">
                    Высокоточные операции с использованием микроскопа и специализированного инструментария. <span className="font-bold">Precision surgery</span>
                  </p>
                  <div className="space-y-2">
                    {microsurgeryTechniques.map((technique, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <button
                          onClick={() => scrollToDescription(technique.name)}
                          className="text-sm text-muted-foreground hover:text-primary hover:underline text-left transition-colors"
                        >
                          {technique.name}
                        </button>
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
                        <button
                          onClick={() => scrollToDescription(method.name)}
                          className="text-sm text-muted-foreground hover:text-primary hover:underline text-left transition-colors"
                        >
                          {method.name}
                        </button>
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
                        <button
                          onClick={() => scrollToDescription(approach.name)}
                          className="text-sm text-muted-foreground hover:text-primary hover:underline text-left transition-colors"
                        >
                          {approach.name}
                        </button>
                      </div>
                    ))}
                  </div>

                  <hr className="my-4 border-border" />

                  <p className="text-sm text-muted-foreground mb-4 font-medium">
                    Физиотерапия и альтернативные методы
                  </p>
                  <div className="space-y-2">
                    {physiotherapyMethods.map((method, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <button
                          onClick={() => scrollToDescription(method.name)}
                          className="text-sm text-muted-foreground hover:text-primary hover:underline text-left transition-colors"
                        >
                          {method.name}
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Detailed Descriptions Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-12 text-center">
              Подробное описание методик
            </h2>

            {/* Microsurgery Descriptions */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Microscope className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-foreground">Микрохирургия</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {microsurgeryTechniques.map((technique, index) => (
                  <Card key={index} id={generateId(technique.name)} className="bg-card border-border scroll-mt-24">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-primary">{technique.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{technique.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Diagnostics Descriptions */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-foreground">Диагностика</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {diagnosticMethods.map((method, index) => (
                  <Card key={index} id={generateId(method.name)} className="bg-card border-border scroll-mt-24">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-primary">{method.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Treatment Approaches Descriptions */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Syringe className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-foreground">Подходы к лечению</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {treatmentApproaches.map((approach, index) => (
                  <Card key={index} id={generateId(approach.name)} className="bg-card border-border scroll-mt-24">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-primary">{approach.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{approach.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Physiotherapy Descriptions */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Syringe className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-foreground">Физиотерапия и альтернативные методы</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {physiotherapyMethods.map((method, index) => (
                  <Card key={index} id={generateId(method.name)} className="bg-card border-border scroll-mt-24">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-primary">{method.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Methodologies;
