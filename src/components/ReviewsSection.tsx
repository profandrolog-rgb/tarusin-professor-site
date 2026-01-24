import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const reviews = [
  // Отзывы с клиники доктора Матара
  {
    name: "Кристина",
    date: "Сентябрь 2025",
    rating: 5,
    text: "Начну с благодарности за оперативно качественное проведение операции, за отношение, за терпеливость и понимание к нашим вопросам в период реабилитации. Мы всегда получали ответы на волнующие нас вопросы. Прошел год, как мы оперировались по гипоспадии. Операция прошла хорошо. В период реабилитации доктор был всегда на связи. В клинике царит домашняя и уютная атмосфера. Спасибо за то, что теперь у моего сына всё хорошо!",
    source: "Клиника доктора Матара",
  },
  {
    name: "Семья Можаевых",
    date: "Сентябрь 2025",
    rating: 5,
    text: "У нас с супругой около 6 лет не было детей. Проходили лечение в нескольких учреждениях, безрезультатно. Уже отчаялись... С последней надеждой попали к этому замечательному доктору и вот спустя 8 месяцев лечения мы ждем малыша! Спасибо Вам и всему персоналу клиники за поддержку и теплое отношение! Вы сотворили чудо!",
    source: "Клиника доктора Матара",
  },
  {
    name: "Мария",
    date: "Август 2025",
    rating: 5,
    text: "Доктор провел операцию нашему малышу по поводу гипоспадии. Мы в восторге от результата! Врач очень внимательный, перезванивал лично после выписки, интересовался состоянием. Чувствуется настоящая забота о пациентах.",
    source: "Клиника доктора Матара",
  },
  {
    name: "Мама мальчика 6 лет",
    date: "Август 2025",
    rating: 5,
    text: "У моего ребенка гипоспадия мошоночная форма. В первый раз нас оперировали в другом месте, второй раз тоже, но разошелся шов. Нам посоветовали очень хорошего врача в Москве. Он прооперировал мальчика очень хорошо. Ребенок ходил в туалет сидя до операции, теперь может ходить стоя. Он сам этому очень рад. Большое спасибо доктору и всему коллективу!",
    source: "Клиника доктора Матара",
  },
  {
    name: "Пациент",
    date: "Декабрь 2025",
    rating: 5,
    text: "Хочу выразить благодарность всей клинике! Делали операцию ребенку, мы так переживали и как все замечательно прошло! Лучший врач в своей профессии, чуткий, внимательный, отзывчивый, очень грамотный и опытный специалист своего дела! В клинике царит домашняя и уютная атмосфера, это очень приятно! Обязательно буду рекомендовать.",
    source: "Клиника доктора Матара",
  },
  {
    name: "Катерина",
    date: "Ноябрь 2025",
    rating: 5,
    text: "Выражаю благодарность за профессионально проведённую операцию по устранению водянки яичка. Клиника оснащена современным оборудованием, подход индивидуальный. Результат отличный. Рекомендую.",
    source: "Клиника доктора Матара",
  },
  {
    name: "Сюзанна Эльдин",
    date: "Ноябрь 2025",
    rating: 5,
    text: "Отличная клиника! Очень нравится весь персонал, оперативное решение ситуаций, все врачи, медсестры и администраторы — профессионалы своего дела. Всегда помогают записаться на ближайшее время, даже если нет окошек, перезванивают и предлагают. Очень приятно, когда есть обратная связь, и оперируют отличные врачи! Буду рекомендовать вашу клинику.",
    source: "Клиника доктора Матара",
  },
  {
    name: "Надежда",
    date: "Сентябрь 2025",
    rating: 5,
    text: "Моего сына наблюдает доктор более 3-х лет. Сыну сделали операцию по коррекции сильного косоглазия обоих глаз и сегодня мы приезжали на контроль. Доктор похвалил нас, что сын соблюдает режим охраны зрения и результат операции сохранился на все 100%. Я, как медик, ценю тёплое, внимательное отношение к пациентам, которое начинается с рецепции. В эту клинику хочется приезжать снова и снова!",
    source: "Клиника доктора Матара",
  },
  {
    name: "Евгения",
    date: "Сентябрь 2025",
    rating: 5,
    text: "Посетили в очередной раз клинику. Остались очень довольны. Доктор всё объяснил и можно сказать расставил нам все точки над «И», что касаемо оперативного лечения, дал рекомендации. В клинике всё чисто, спокойно, стоят кулеры с водой, кофемашина. Вообщем на 5. Рекомендую к посещению.",
    source: "Клиника доктора Матара",
  },
];

const ReviewsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 3;

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + 1 >= reviews.length - reviewsPerPage + 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? reviews.length - reviewsPerPage : prev - 1
    );
  };

  const displayReviews = reviews.slice(currentIndex, currentIndex + reviewsPerPage);

  return (
    <section id="reviews" className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Отзывы пациентов
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Доверие пациентов — моя главная награда. Вот что говорят те, 
            кто уже обращался за помощью
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-lg font-semibold text-foreground">5.0</span>
            <span className="text-muted-foreground">на основе {reviews.length}+ отзывов</span>
          </div>
        </div>

        {/* Reviews Carousel */}
        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6">
            {displayReviews.map((review, index) => (
              <Card 
                key={`${review.name}-${currentIndex}-${index}`}
                className="bg-card border-border shadow-lg"
              >
                <CardContent className="p-6">
                  <Quote className="w-10 h-10 text-primary/20 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-6">
                    "{review.text}"
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="font-semibold text-foreground">{review.name}</p>
                      <p className="text-sm text-muted-foreground">{review.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex mb-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{review.source}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.ceil(reviews.length / reviewsPerPage) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i * reviewsPerPage > reviews.length - reviewsPerPage ? reviews.length - reviewsPerPage : i * reviewsPerPage)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    Math.floor(currentIndex / reviewsPerPage) === i 
                      ? "bg-primary" 
                      : "bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-border">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{reviews.length}+</div>
            <div className="text-sm text-muted-foreground">Отзывов</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Рекомендуют</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">5.0</div>
            <div className="text-sm text-muted-foreground">Средняя оценка</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Оставить отзыв можно на любой удобной платформе
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm">Яндекс</Button>
            <Button variant="outline" size="sm">ПроДокторов</Button>
            <Button variant="outline" size="sm">Google</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
