import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const reviews = [
  {
    name: "Елена М.",
    date: "Январь 2024",
    rating: 5,
    text: "Огромная благодарность профессору Тарусину! Обратились с сыном 5 лет, были очень напуганы диагнозом. Дмитрий Игоревич всё подробно объяснил, успокоил и провёл операцию блестяще. Через месяц ребёнок уже забыл о проблеме!",
    source: "Яндекс",
  },
  {
    name: "Александр К.",
    date: "Декабрь 2023",
    rating: 5,
    text: "Долго искал специалиста по моей проблеме. Профессор Тарусин — врач от Бога. Грамотный, внимательный, человечный. Результатом лечения доволен на 100%. Рекомендую всем мужчинам не стесняться и обращаться!",
    source: "ПроДокторов",
  },
  {
    name: "Ольга В.",
    date: "Ноябрь 2023",
    rating: 5,
    text: "Привела сына-подростка на консультацию — он очень стеснялся. Дмитрий Игоревич нашёл подход, всё объяснил понятным языком. Теперь сын сам спокойно ходит на приёмы. Спасибо за профессионализм и тактичность!",
    source: "Яндекс",
  },
  {
    name: "Михаил Д.",
    date: "Октябрь 2023",
    rating: 5,
    text: "Профессор провёл сложную микрохирургическую операцию. Результат превзошёл ожидания. Видно, что врач настоящий профессионал своего дела с огромным опытом. Благодарю за возвращённое здоровье!",
    source: "Google",
  },
  {
    name: "Наталья С.",
    date: "Сентябрь 2023",
    rating: 5,
    text: "Нашему малышу было всего 2 года, когда нам сказали, что нужна операция. Было очень страшно. Профессор Тарусин провёл всё идеально, был с нами на связи после выписки. Врач с большой буквы!",
    source: "Яндекс",
  },
];

const ReviewsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 3;

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + reviewsPerPage >= reviews.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? reviews.length - reviewsPerPage : prev - 1
    );
  };

  const visibleReviews = reviews.slice(currentIndex, currentIndex + reviewsPerPage);
  
  // Handle wrap-around for visible reviews
  const displayReviews = visibleReviews.length < reviewsPerPage 
    ? [...visibleReviews, ...reviews.slice(0, reviewsPerPage - visibleReviews.length)]
    : visibleReviews;

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
            <span className="text-lg font-semibold text-foreground">4.9</span>
            <span className="text-muted-foreground">на основе 150+ отзывов</span>
          </div>
        </div>

        {/* Reviews Carousel */}
        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6">
            {displayReviews.map((review, index) => (
              <Card 
                key={`${review.name}-${index}`}
                className="bg-card border-border shadow-lg"
              >
                <CardContent className="p-6">
                  <Quote className="w-10 h-10 text-primary/20 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
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
