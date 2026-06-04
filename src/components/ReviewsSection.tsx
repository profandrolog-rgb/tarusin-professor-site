import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Review {
  name: string;
  nameEn?: string;
  date: string;
  dateEn?: string;
  rating: number;
  text: string;
  textEn: string;
  source: string;
}

const reviews: Review[] = [
  {
    name: "Мама 12-летнего сына",
    nameEn: "Mother of a 12-year-old son",
    date: "Март 2026",
    dateEn: "March 2026",
    rating: 5,
    text: "После посещения доктора Тарусина Д.И. у нас остались положительные впечатления. Дмитрий Игоревич уделил достаточно внимания, произвёл обследование и сделал УЗИ. Врач подобрал лечение и направил на дополнительные исследования. Манера общения крайне дружелюбная, специалист смог найти общий язык с ребёнком. Информацию доносил в доступной форме, даже рисовал картинки и всё объяснял. Данного детского уролога можно порекомендовать.",
    textEn: "After visiting Dr. Tarusin, we were left with a very positive impression. Dmitry Igorevich gave sufficient attention, performed an examination and ultrasound. The doctor prescribed treatment and referred us for additional tests. His communication style is extremely friendly — he connected with our child easily. He explained everything in simple terms, even drawing pictures. We highly recommend this pediatric urologist.",
    source: "ПроДокторов",
  },
  {
    name: "Мама подростка",
    nameEn: "Mother of a teenager",
    date: "Февраль 2026",
    dateEn: "February 2026",
    rating: 5,
    text: "Обратились к врачу, прочитав отзывы. Искали специалиста в области детской андрологии-урологии. В других местах нам сразу говорили, что нашим вопросом не занимаются. Дмитрий Игоревич сказал, что запрос у нас редкий, не типичный. Очень внимательно выслушал, изучил имеющиеся исследования, осмотрел, назначил анализы и обследование. Подробно объяснил, зачем что нужно делать. Он нашёл подход к моему сыну-подростку. Это профессиональный доктор и очень неравнодушный человек!",
    textEn: "We found the doctor through reviews. We were looking for a specialist in pediatric andrology-urology. Other places immediately said they don't deal with our issue. Dmitry Igorevich said our case was rare and atypical. He listened very attentively, studied existing test results, examined, and ordered tests. He explained in detail why each step was necessary. He found an approach to my teenage son. This is a professional doctor and a truly caring person!",
    source: "ПроДокторов",
  },
  {
    name: "Любовь",
    date: "Февраль 2026",
    dateEn: "February 2026",
    rating: 5,
    text: "После постановки диагноза сыну очень долго искали врача — были на консультациях у 5 врачей. Обратились к доктору по рекомендации знакомых врачей. Дмитрий Игоревич — специалист уникальный. Проводит операции по своим авторским методикам. От первого осмотра до операции прошло ровно трое суток. На приёме доктор самостоятельно проводит все необходимые УЗИ. Доктор создаёт доверительные и безопасные отношения с ребёнком. Работает используя микроскоп, первоклассные материалы и медикаменты.",
    textEn: "After our son was diagnosed, we spent a long time searching for a doctor — we consulted 5 physicians. We came to Dr. Tarusin on the recommendation of fellow doctors. Dmitry Igorevich is a unique specialist. He performs surgeries using his own proprietary techniques. From the first examination to the surgery, only three days passed. During the appointment, the doctor personally performs all necessary ultrasounds. He builds trusting and safe relationships with children. He works with a microscope, first-class materials and medications.",
    source: "ПроДокторов",
  },
  {
    name: "Любовь",
    date: "Февраль 2026",
    dateEn: "February 2026",
    rating: 5,
    text: "После постановки диагноза сыну очень долго искали врача. Обратились к доктору по рекомендации знакомых врачей. Дмитрий Игоревич — специалист уникальный. Доктор проводит операции по своим авторским методикам. Врач, обладающий многолетним опытом, сделавший тысячи подобных операций, готовый брать ответственность и вести ребёнка от операции до выздоровления. Оборудование и методика — всё на высшем уровне.",
    textEn: "After our son's diagnosis, we searched for a long time for a doctor. We came on the recommendation of fellow physicians. Dmitry Igorevich is a unique specialist who performs surgeries using his own proprietary techniques. A doctor with many years of experience, having performed thousands of similar operations, ready to take responsibility and guide the child from surgery to recovery. Equipment and methodology — everything is at the highest level.",
    source: "DocDoc",
  },
  {
    name: "Олеся Р.",
    nameEn: "Olesya R.",
    date: "1 декабря 2023",
    dateEn: "December 1, 2023",
    rating: 5,
    text: "Делали 2 года назад операцию ребенку по устранению крипторхизма и пупочную грыжу. В нашем городе напугали, сказали оч сложная операция. Мы все на панике, жизнь рухнула. Приехали к профессору, сказал ерунда, всё сделаем. Сделал, делали узи все на месте, растет, развивается. Только потом на итоговом узи профессор признался, что операция не простая была. А мы то думали ерунда))) так он нас подготовил, что мы и не переживали. А так после операции ребенок отошел от наркоза, сел в машину и домой поехали. Супер профессор! Очень рекомендую. Нашли его через знакомых, работающих в сфере медицины. А ещё он очень весёлый. В таких ситуациях это важно) и с ребенком контакт наладил))",
    textEn: "Two years ago, we had surgery for our child to correct cryptorchidism and an umbilical hernia. In our city, doctors scared us, said it was a very complex operation. We were in panic, our world collapsed. We came to the professor, he said 'no big deal, we'll handle it.' He did it, ultrasound showed everything in place, growing and developing. Only later at the final ultrasound did the professor admit the surgery wasn't simple at all. And we thought it was nothing! That's how well he prepared us — we didn't worry at all. After surgery, the child woke from anesthesia, got in the car, and we drove home. Super professor! Highly recommend. We found him through friends in medicine. Also, he's very cheerful — in such situations, that matters! And he connected great with our child.",
    source: "Яндекс",
  },
  {
    name: "Арина",
    nameEn: "Arina",
    date: "20 января 2022",
    dateEn: "January 20, 2022",
    rating: 5,
    text: "После приема в районной поликлинике и невнятных диагнозов типа «ну, грубой патологии нет, но ваш ребёнок очень беспокойный, поэтому Узи провести не удалось, пусть вас педиатр ещё послушает» я кинулась искать настоящих специалистов! Обзвонив все известные сети и не найдя нигде окна на ближайшее время, узнала про клинику доктора Матара, пусть далеко, но оказалось два важных специалиста работают именно в ней: уролог Тарусин ДИ и кардиолог Тутельман КМ — интеллигентнейшие люди! Столь чуткого отношения к малышу и ко мне я давно не встречала! И ни у одного не возникло никаких проблем осмотреть моего сыночка. И успокоить меня, что мы не их пациенты :) Спасибо вам огромное! Мама Пети В.",
    textEn: "After a visit to a local clinic with vague diagnoses like 'no gross pathology, but your child is very restless, the ultrasound couldn't be done,' I rushed to find real specialists! After calling all known networks and finding no availability, I learned about Dr. Matara's clinic. Two important specialists work there: urologist Tarusin and cardiologist Tutelman — the most intelligent people! I haven't encountered such sensitive treatment of my baby and myself in a long time! Neither had any problems examining my son. And they reassured me that we weren't their patients :) Thank you so much!",
    source: "Яндекс",
  },
  {
    name: "Пользователь",
    nameEn: "User",
    date: "27 июля 2023",
    dateEn: "July 27, 2023",
    rating: 5,
    text: "С Дмитрием Игоревичем мы знакомы с сыном с далекого 2004 года, когда впервые попали к нему на прием по рекомендации нашего педиатра с диагнозом крипторхизм. Дмитрий Игоревич провел блестящую консультацию, в ходе которой нам все доступно объяснили что сыну требуется оперативное вмешательство. Мы полностью доверились доктору, который не только отличный специалист, но и приятный человек с чувством юмора, который вселяет уверенность в результат. Операция была проведена. Послеоперационный период был без осложнений. К Дмитрию Игоревичу мы приезжали каждый год на обследование. В 2021 год возник диагноз варикоцелле, было назначено лечение, но операцию, к сожалению, избежать не удалось. Но мы уже ничего не боялись, мы в надежных руках. И снова блестяще проведенная операция. И контрольное обследование через год. И вердикт «диагноз полностью здоров». Вы больше не нуждаетесь в ежегодном обследовании. Все хорошо. И по первому диагнозу и по второму. Мы были счастливы это услышать. Поэтому мы от всей семьи выражаем бесконечную благодарность и признательность профессору, человеку с большой буквы Тарусину Дмитрию Игоревичу. Желаем всего всего самого наилучшего в вашем таком важном и значимом деле!",
    textEn: "My son and I have known Dmitry Igorevich since 2004, when we first visited him on our pediatrician's recommendation with a cryptorchidism diagnosis. He gave a brilliant consultation, explaining clearly that surgery was needed. We fully trusted the doctor, who is not only an excellent specialist but also a pleasant person with a sense of humor who inspires confidence. The surgery was performed; recovery was without complications. We visited annually for check-ups. In 2021, varicocele was diagnosed, and unfortunately surgery couldn't be avoided. But we weren't afraid anymore — we were in safe hands. Another brilliantly performed surgery, a follow-up a year later, and the verdict: 'completely healthy.' Our entire family extends endless gratitude to Professor Tarusin!",
    source: "Яндекс",
  },
  {
    name: "Яна Кияницкая",
    nameEn: "Yana Kiyanitskaya",
    date: "10 января 2024",
    dateEn: "January 10, 2024",
    rating: 5,
    text: "Он профессионал. И урология его призвание. Он разбирается до мелочей. Очень внимателен и компетентен.",
    textEn: "He is a professional. Urology is his calling. He understands every detail. Very attentive and competent.",
    source: "Яндекс",
  },
  {
    name: "Ана",
    nameEn: "Ana",
    date: "9 декабря 2021",
    dateEn: "December 9, 2021",
    rating: 5,
    text: "Лучший врач Тарусин, делали в Морозовской операцию, одним днем, все отлично. Но он только платно.",
    textEn: "The best doctor, Tarusin. Had surgery at Morozovskaya Hospital, same-day, everything went perfectly. But he only works privately.",
    source: "Яндекс",
  },
  {
    name: "Osa",
    date: "8 декабря 2021",
    dateEn: "December 8, 2021",
    rating: 5,
    text: "Оооочень рекомендую Дмитрий Тарусин в Морозовской! Оооочень. Он супер врач и человечище.",
    textEn: "I highly, HIGHLY recommend Dmitry Tarusin at Morozovskaya! He is a super doctor and an amazing person.",
    source: "Яндекс",
  },
  {
    name: "Екатерина",
    nameEn: "Ekaterina",
    date: "31 января 2022",
    dateEn: "January 31, 2022",
    rating: 4,
    text: "Морозовская больница, Тарусин Дмитрий Игоревич. Профессор, доктор медицинских наук.",
    textEn: "Morozovskaya Hospital, Tarusin Dmitry Igorevich. Professor, Doctor of Medical Sciences.",
    source: "Яндекс",
  },
  {
    name: "Ася",
    nameEn: "Asya",
    date: "20 сентября 2022",
    dateEn: "September 20, 2022",
    rating: 5,
    text: "Отличный уролог, что ещё можно сказать, один из лучших.",
    textEn: "Excellent urologist, what else can I say — one of the best.",
    source: "Яндекс",
  },
  {
    name: "Тата Мисягина",
    nameEn: "Tata Misyagina",
    date: "11 февраля 2024",
    dateEn: "February 11, 2024",
    rating: 5,
    text: "Благодарю Дмитрия Игоревича за здоровье моих сыновей!",
    textEn: "I thank Dmitry Igorevich for the health of my sons!",
    source: "Яндекс",
  },
  {
    name: "Игорь Колос",
    nameEn: "Igor Kolos",
    date: "15 декабря 2024",
    dateEn: "December 15, 2024",
    rating: 5,
    text: "Дмитрий Игоревич — лучший, очень рекомендую!",
    textEn: "Dmitry Igorevich is the best, highly recommend!",
    source: "Яндекс",
  },
  {
    name: "Екатерина",
    nameEn: "Ekaterina",
    date: "23 сентября 2021",
    dateEn: "September 23, 2021",
    rating: 5,
    text: "Дмитрию очень доверяю. Хороший врач и человек.",
    textEn: "I trust Dmitry completely. A good doctor and a good person.",
    source: "Яндекс",
  },
  {
    name: "Inna A.",
    date: "20 мая 2024",
    dateEn: "May 20, 2024",
    rating: 5,
    text: "Рекомендую доктора Тарусина.",
    textEn: "I recommend Dr. Tarusin.",
    source: "Яндекс",
  },
  {
    name: "Сергей",
    nameEn: "Sergey",
    date: "28 декабря 2025",
    dateEn: "December 28, 2025",
    rating: 5,
    text: "Дмитрий Игоревич блестящий врач и человек. Огромное вам спасибо за ваш труд.",
    textEn: "Dmitry Igorevich is a brilliant doctor and person. Thank you so much for your work.",
    source: "Яндекс",
  },
  {
    name: "Михаил Литвиненко",
    nameEn: "Mikhail Litvinenko",
    date: "18 декабря 2025",
    dateEn: "December 18, 2025",
    rating: 5,
    text: "Дмитрий Тарусин — гениальный врач. Дмитрий мне говорил, что любит больше работать с детьми. Не так все запутано как у взрослых. Но я взрослый мужик, и Дмитрий до эры ИИ собрал схему лечения уровня доктора Хауса и Шерлока Холмса в медицине. Мне сейчас страшно представить какой уровень диагностики и лечения когда у него доступ ко всем большим языковым моделям. Однозначно рекомендую, особенно если у вас сложный случай. Врач красавчик!!",
    textEn: "Dmitry Tarusin is a genius doctor. He told me he prefers working with children — things aren't as complicated as with adults. But I'm an adult man, and even before the AI era, Dmitry assembled a treatment plan at the level of Dr. House and Sherlock Holmes in medicine. I can't even imagine the level of diagnostics and treatment he achieves now with access to all large language models. Absolutely recommend, especially for complex cases. The doctor is amazing!",
    source: "Яндекс",
  },
  {
    name: "Anna F-K",
    date: "15 октября 2025",
    dateEn: "October 15, 2025",
    rating: 5,
    text: "Уникальный специалист, высокого уровня и профессионал своего дела, деликатный и четкий. Очень приятный в общении. Нам прям повезло попасть именно к нему.",
    textEn: "A unique specialist, high-level professional — delicate and precise. Very pleasant to communicate with. We were truly fortunate to find him.",
    source: "Яндекс",
  },
  {
    name: "Ася М.",
    nameEn: "Asya M.",
    date: "1 августа 2025",
    dateEn: "August 1, 2025",
    rating: 5,
    text: "Тарусин Дмитрий Игоревич просто доктор от Бога, Профессор, самый лучший в сфере андрологии урологии! Моего сына и оперировал и наблюдал долгие годы, это доктор которому можно доверять на 100%!",
    textEn: "Tarusin Dmitry Igorevich is simply a God-given doctor, a Professor, the best in andrology and urology! He both operated on and monitored my son for many years — a doctor you can trust 100%!",
    source: "Яндекс",
  },
  {
    name: "Елена Яффе",
    nameEn: "Elena Yaffe",
    date: "23 июля 2025",
    dateEn: "July 23, 2025",
    rating: 5,
    text: "Отличная клиника! С момента консультации до операции (варикоцеле) прошла неделя! Доктор Тарусин Д.И., проводивший консультацию и операцию, — это не просто Доктор с большой буквы! Это гений медицины! Все прошло прекрасно и во время операции и в послеоперационный период! Огромная благодарность доктору Тарусину и всем сотрудникам клиники, внимательным и отзывчивым!",
    textEn: "Excellent clinic! From consultation to surgery (varicocele) was just one week! Dr. Tarusin, who performed both the consultation and surgery, is not just a Doctor with a capital D — he is a genius of medicine! Everything went perfectly, both during surgery and recovery! Enormous gratitude to Dr. Tarusin and all the clinic staff — attentive and responsive!",
    source: "Яндекс",
  },
  {
    name: "Алексей С.",
    nameEn: "Alexey S.",
    date: "20 июля 2025",
    dateEn: "July 20, 2025",
    rating: 5,
    text: "Хочу сказать огромное спасибо Тарусину Дмитрию Игоревичу и команде клиники доктора Матара. При планировании беременности выявили варикоцеле, оперативно провели подготовку и сделали операцию.",
    textEn: "I want to thank Tarusin Dmitry Igorevich and the team at Dr. Matara's clinic enormously. During pregnancy planning, varicocele was discovered; they promptly prepared and performed the surgery.",
    source: "Яндекс",
  },
  {
    name: "Ольга Щупак",
    nameEn: "Olga Shchupak",
    date: "16 июля 2025",
    dateEn: "July 16, 2025",
    rating: 5,
    text: "Дмитрий Игоревич — самый лучший детский уролог в Москве. Мы сделали у него уже несколько операций и все прошли супер гладко и главное — успешно! Очень внимательный к детям и детям в ним легко!",
    textEn: "Dmitry Igorevich is the best pediatric urologist in Moscow. We've had several surgeries with him and all went super smoothly and, most importantly, successfully! Very attentive to children, and kids feel comfortable with him!",
    source: "Яндекс",
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "2 июля 2025",
    dateEn: "July 2, 2025",
    rating: 5,
    text: "Тарусин Дмитрий Игоревич врач экстра класса! Консультирует неторопливо, сам делает УЗИ, назначает только необходимые анализы. Сыну провёл операцию с ювелирной точностью, с минимальным разрезом снаружи и максимально атравматично внутри мошонки (маленький синячок был). Сыну не потребовалось ни одной таблетки обезболивающего. Димитрий Игоревич талантливый хирург с огромным опытом!!! Человек, с горящими от работы весёлыми глазами!!!",
    textEn: "Tarusin Dmitry Igorevich is a world-class doctor! He consults unhurriedly, performs ultrasound himself, prescribes only necessary tests. He performed surgery on my son with jeweler's precision — minimal external incision and maximum atraumatic approach inside the scrotum (just a tiny bruise). My son didn't need a single pain pill. Dmitry Igorevich is a talented surgeon with vast experience! A person with cheerful, work-passionate eyes!",
    source: "Яндекс",
  },
  {
    name: "Елена Г.",
    nameEn: "Elena G.",
    date: "27 июня 2025",
    dateEn: "June 27, 2025",
    rating: 5,
    text: "Очень хороший, высококлассный врач! Профессионал своего дела! Рады, что попали на прием именно к нему! Сыну 8 лет, диагноз вторичный крипторхизм. Оперировались в апреле. К Дмитрию Игоревичу мы попали от другого практикующего хирурга, который настоятельно рекомендовал оперировать ребенка именно у Тарусина Д.И., что само по себе уже показательно. Такой качественной и безболезненной для ребенка диагностики не смог провести ни один из специалистов. Операция проведена, успешно. Ребенок здоров. Швы очень аккуратные, косметические. Все счастливы))) Дмитрию Игоревичу огромное СПАСИБО!!! Успехов Вам во всём!",
    textEn: "A very good, top-class doctor! A true professional! We're glad we ended up with him! Our son is 8, diagnosed with secondary cryptorchidism. Surgery was in April. We were referred by another practicing surgeon who strongly recommended Dr. Tarusin — which itself speaks volumes. No other specialist could perform such high-quality, painless diagnostics for the child. Surgery was successful. The child is healthy. Sutures are very neat, cosmetic. Everyone is happy! Enormous THANK YOU to Dmitry Igorevich!",
    source: "Яндекс",
  },
  {
    name: "Жанна Брылева",
    nameEn: "Zhanna Bryleva",
    date: "13 апреля 2025",
    dateEn: "April 13, 2025",
    rating: 5,
    text: "Отличный врач, тщательно и внимательно осмотрел ребенка. Получили ответы на все вопросы.",
    textEn: "Excellent doctor, thoroughly and attentively examined the child. We got answers to all our questions.",
    source: "Яндекс",
  },
  {
    name: "Юлия Васева",
    nameEn: "Yulia Vaseva",
    date: "18 марта 2025",
    dateEn: "March 18, 2025",
    rating: 5,
    text: "Умняшка, опытнай😊 знает что делает. Свои методики и разработки.",
    textEn: "Smart, experienced 😊 knows what he's doing. Has his own techniques and developments.",
    source: "Яндекс",
  },
  {
    name: "Ольга П.",
    nameEn: "Olga P.",
    date: "17 марта 2025",
    dateEn: "March 17, 2025",
    rating: 5,
    text: "Отличная компактная уютная клиника, где есть все необходимое, а главное, где можно быть уверенным в уровне врачей, которым доверяешь здоровье своего ребёнка. С сыном-подростком попали сюда в новогодние праздники, когда в Москве нужного специалиста было найти вообще невозможно. В клинике Матара — отзывчивый персонал и высочайшего класса врачи (наш теперь уже самый любимый доктор детский уролог-андролог Тарусин Дмитрий Игоревич!). Прошел месяц с момента операции и мой сын теперь здоров, починен самым лучшим образом. Ювелирная работа, малюсенький незаметный шов. Из впечатлений дня операции — очень крутой анестезиолог, очень добрые медсестры, и сам доктор Тарусин часто заходил проведать, как отходит сын от наркоза.",
    textEn: "An excellent, compact, cozy clinic with everything needed, and most importantly, where you can be confident in the level of doctors you trust with your child's health. We came here with our teenage son during the New Year holidays when finding the right specialist in Moscow was impossible. Dr. Matara's clinic has responsive staff and top-class doctors (our now favorite doctor — pediatric urologist-andrologist Tarusin Dmitry Igorevich!). A month after surgery, my son is healthy, repaired in the best way possible. Jeweler's work, a tiny invisible suture. Impressions from surgery day — an amazing anesthesiologist, very kind nurses, and Dr. Tarusin himself frequently checked on how my son was recovering from anesthesia.",
    source: "Яндекс",
  },
  {
    name: "Andrewka",
    date: "21 февраля 2025",
    dateEn: "February 21, 2025",
    rating: 5,
    text: "Лучшая клиника андрологии в Москве! Врачи добрые, видно, что профессионалы своего дела! Особенное спасибо Тарусину Дмитрию Игоревичу!",
    textEn: "The best andrology clinic in Moscow! Doctors are kind and clearly professionals! Special thanks to Tarusin Dmitry Igorevich!",
    source: "Яндекс",
  },
  {
    name: "Вильдан Вегерио",
    nameEn: "Vildan Vegerio",
    date: "2 февраля 2025",
    dateEn: "February 2, 2025",
    rating: 5,
    text: "Я хочу выразить огромную благодарность Дмитрию Игоревичу. Он — настоящий профессионал и очень чуткий человек. Дмитрий Игоревич — врач по призванию, который сразу определил верный диагноз. Настоятельно рекомендую его всем.",
    textEn: "I want to express enormous gratitude to Dmitry Igorevich. He is a true professional and a very sensitive person. Dmitry Igorevich is a doctor by calling who immediately determined the correct diagnosis. I strongly recommend him to everyone.",
    source: "Яндекс",
  },
  {
    name: "Мурад Дрисси-Раххали",
    nameEn: "Murad Drissi-Rakhali",
    date: "11 декабря 2024",
    dateEn: "December 11, 2024",
    rating: 5,
    text: "Оперировали ребенка 14 лет по поводу варикоцеле, по рекомендации попали к доктору Тарусину Дмитрию Игоревичу. Прекрасный специалист, мастер своего дела! Операция прошла отлично.",
    textEn: "Had surgery for our 14-year-old for varicocele; we came to Dr. Tarusin on recommendation. An excellent specialist, a master of his craft! The surgery went perfectly.",
    source: "Яндекс",
  },
  {
    name: "Марина Сторублевцева",
    nameEn: "Marina Storublevtseva",
    date: "3 декабря 2024",
    dateEn: "December 3, 2024",
    rating: 5,
    text: "Тарусин Дмитрий Игоревич чудесный весёлый доктор, легко находит подход даже к самым стеснительным детям))) а мамам очень понятно и подробно объясняет алгоритм действий в нашей ситуации. Очень рада, что нашла вас!",
    textEn: "Tarusin Dmitry Igorevich is a wonderful, cheerful doctor who easily connects even with the shyest children! And he explains the action plan to mothers very clearly and in detail. So glad I found you!",
    source: "Яндекс",
  },
  {
    name: "Auto777",
    date: "6 ноября 2024",
    dateEn: "November 6, 2024",
    rating: 5,
    text: "Здравствуйте! Сегодня были на приеме у профессора Тарусина Дмитрия Игоревича, такого чуткого и внимательного отношения давно не встречали. Настоящий специалист! И просто человек с большим сердцем!",
    textEn: "Hello! Today we had an appointment with Professor Tarusin Dmitry Igorevich — we haven't experienced such sensitive and attentive treatment in a long time. A true specialist! And simply a person with a big heart!",
    source: "Яндекс",
  },
  {
    name: "Александр Виноградов",
    nameEn: "Alexander Vinogradov",
    date: "4 сентября 2024",
    dateEn: "September 4, 2024",
    rating: 5,
    text: "Один из самых крутых спецов по детской андрологии в России! Легкое общее и с родителями, и с ребенком любого возраста. Знаю, потому что не только сам обращался, но рекомендовал многим — все довольны.",
    textEn: "One of the coolest specialists in pediatric andrology in Russia! Easy communication with both parents and children of any age. I know because I not only visited myself but recommended him to many — everyone is satisfied.",
    source: "Яндекс",
  },
  {
    name: "gooddayrvv",
    date: "19 декабря 2023",
    dateEn: "December 19, 2023",
    rating: 5,
    text: "Хочу оставить благодарность всему персоналу клиники доктора Матара — обращались к доктору Матару А.А. и к Тарусину Д.И. не единожды — всегда всё по существу, внимательно, профессионально, отзывчиво.",
    textEn: "I want to thank the entire staff of Dr. Matara's clinic — we've visited Dr. Matara and Dr. Tarusin multiple times — always to the point, attentive, professional, and responsive.",
    source: "Яндекс",
  },
  {
    name: "Михаил Ершов",
    nameEn: "Mikhail Ershov",
    date: "9 сентября 2024",
    dateEn: "September 9, 2024",
    rating: 5,
    text: "Врач уролог-андролог Тарусин Дмитрий Игоревич огромный специалист своего дела. Легко находит контакт с детьми и молодежью, а так же всегда подходит к лечению с большим энтузиазмом.",
    textEn: "Urologist-andrologist Tarusin Dmitry Igorevich is a tremendous specialist. He easily connects with children and young people, and always approaches treatment with great enthusiasm.",
    source: "Яндекс",
  },
  {
    name: "Света Магомедова",
    nameEn: "Sveta Magomedova",
    date: "15 апреля 2022",
    dateEn: "April 15, 2022",
    rating: 5,
    text: "Это самая замечательная клиника которая есть в городе Москва, там самые лучшие врачи а у нас была операция нас оперировал профессор Тарусин ему огромнейшее благодарность, также благодарность Середницкой Надежде Александровне и Тарасюк Нине Михайловне очень приятная обстановка быстро ребёнок вышел от наркоза быстро нас прооперировали и все слава богу хорошо всем советую эту клинику клинику доктора Матара.",
    textEn: "This is the most wonderful clinic in Moscow with the best doctors. We had surgery performed by Professor Tarusin — enormous gratitude to him, as well as to Serednitskaya and Tarasyuk. Very pleasant atmosphere, the child recovered from anesthesia quickly, the surgery was done quickly, and thank God everything went well. I recommend this clinic to everyone — Dr. Matara's clinic.",
    source: "Яндекс",
  },
  {
    name: "Антон Р.",
    nameEn: "Anton R.",
    date: "6 марта 2020",
    dateEn: "March 6, 2020",
    rating: 5,
    text: "Был здесь с сыном, делали операцию у Дмитрия Игоревича Тарусина. Очень понравилась чёткая организация на всех этапах, доброжелательное отношение персонала, профессионализм. Комфортные условия.",
    textEn: "Was here with my son, had surgery with Dmitry Igorevich Tarusin. Really liked the clear organization at every stage, the friendly staff attitude, and professionalism. Comfortable conditions.",
    source: "Яндекс",
  },
  {
    name: "Сергей Забиралов",
    nameEn: "Sergey Zabiralov",
    date: "25 июля 2024",
    dateEn: "July 25, 2024",
    rating: 5,
    text: "В марте 2024 г сделали ребенку операцию по поводу двухстороннего гидроцеле. Долго думали, но решились. Всё прошло хорошо. Спасибо Дмитрию Игоревичу. Перед операцией тоже большая подготовка была. Показывали результаты УЗИ в своем городе, которое Дмитрий Игоревич делал. Врачи сфоткали, чтобы знать для себя насколько подробным может быть УЗИ))) Также методика, применяемая Дмитрием Игоревичем сохраняет мышцу подъема и опускания для предотвращения перегрева органа.",
    textEn: "In March 2024, our child had surgery for bilateral hydrocele. We thought about it for a long time but decided to go ahead. Everything went well. Thank you, Dmitry Igorevich. There was extensive preparation before surgery too. We showed the ultrasound results from our city, done by Dmitry Igorevich — local doctors photographed them to see how detailed an ultrasound can be! Also, the technique used by Dmitry Igorevich preserves the cremaster muscle to prevent organ overheating.",
    source: "Яндекс",
  },
  {
    name: "Олег П.",
    nameEn: "Oleg P.",
    date: "10 мая 2024",
    dateEn: "May 10, 2024",
    rating: 5,
    text: "Огромная благодарность профессору Тарусину Дмитрию Игоревичу! Светлая голова, золотые руки! Так же огромная благодарность всей его команде. СПАСИБО!",
    textEn: "Enormous gratitude to Professor Tarusin Dmitry Igorevich! A brilliant mind, golden hands! Also huge thanks to his entire team. THANK YOU!",
    source: "Яндекс",
  },
  {
    name: "Андрей",
    nameEn: "Andrey",
    date: "24 марта 2023",
    dateEn: "March 24, 2023",
    rating: 5,
    text: "Делали операцию здесь ребенку по урологии. Врачи супер, отдельное спасибо профессору Д.И.Тарусину. Прошло удачно, через год повторный прием, все в норме.",
    textEn: "Had urology surgery for our child here. Doctors are superb, special thanks to Professor Tarusin. It went successfully; a year later at the follow-up, everything is normal.",
    source: "Яндекс",
  },
  {
    name: "Валентина",
    nameEn: "Valentina",
    date: "30 января 2024",
    dateEn: "January 30, 2024",
    rating: 5,
    text: "Сразу скажу, что лично не общалась. На приеме, а в дальнейшем и на операции был внук в сопровождении мамы и по совместительству моей дочерью. Остались только восторженные впечатления о докторе.",
    textEn: "I'll say right away that I didn't communicate personally. My grandson was at the appointment and later the surgery, accompanied by his mother (my daughter). Only enthusiastic impressions about the doctor remained.",
    source: "Яндекс",
  },
  {
    name: "Галина",
    nameEn: "Galina",
    date: "23 января 2022",
    dateEn: "January 23, 2022",
    rating: 5,
    text: "Работает прекрасный детский андролог-уролог. Профессор Тарусин. Очень редкий компетентный врач, замечательный человек. Благодарю Бога, что попали с сыном к нему.",
    textEn: "There works a wonderful pediatric andrologist-urologist — Professor Tarusin. A very rare competent doctor, a wonderful person. I thank God we got to see him with our son.",
    source: "Яндекс",
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "9 июня 2023",
    dateEn: "June 9, 2023",
    rating: 5,
    text: "Бесспорно наблюдалась и будем наблюдаться только у него. Очень внимательный, отзывчивый. Ну и, конечно, он один из лучших урологов-андрологов.",
    textEn: "Without a doubt, we've been and will continue to be observed only by him. Very attentive, responsive. And of course, he's one of the best urologists-andrologists.",
    source: "Яндекс",
  },
  {
    name: "Александр Баженов",
    nameEn: "Alexander Bazhenov",
    date: "12 июля 2024",
    dateEn: "July 12, 2024",
    rating: 5,
    text: "Безгранично благодарна профессору Тарусину Дмитрию Игоревичу! Пару лет назад попала с сыном к нему на консультацию. Тщательный осмотр, доброжелательное отношение сгладили страх перед операцией. Отмечу прекрасную работу анестезиолога! Спасибо! Да и персонал Клиники в целом очень отзывчивый! Сегодняшний визит к профессору подтвердил его профессионализм. Да что там говорить, у Дмитрия Игоревича золотые руки!!!!!! И кроме этого, несмотря на тяжелую и ответственную работу, всегда жизнерадостный, что, безусловно, заряжает уверенностью, что все будет хорошо! Низкий поклон.",
    textEn: "Boundlessly grateful to Professor Tarusin! A couple of years ago we came for a consultation with our son. Thorough examination and friendly attitude eased the fear of surgery. The anesthesiologist's work was excellent! The clinic staff is very responsive! Today's visit confirmed his professionalism. What can I say — Dmitry Igorevich has golden hands! Despite the demanding, responsible work, he's always cheerful, which inspires confidence that everything will be fine! Deep bow.",
    source: "Яндекс",
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "30 августа 2021",
    dateEn: "August 30, 2021",
    rating: 5,
    text: "Врач произвёл на нас впечатление! Так хорошо изучил историю болезни, вник во все детали, назначил дополнительные обследования! После приема мы почувствовали что есть шанс вылечить наше заболевание. Врач от Бога, это про Него! Спасибо.",
    textEn: "The doctor made a great impression! He studied the medical history so thoroughly, delved into every detail, ordered additional examinations! After the appointment, we felt there was a chance to cure our condition. A God-given doctor — that's about Him! Thank you.",
    source: "Яндекс",
  },
  // Отзывы с ПроДокторов
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Декабрь 2025",
    dateEn: "December 2025",
    rating: 5,
    text: "Профессор Дмитрий Игоревич — очень внимательный, добрый и отзывчивый человек. Профессионал своего дела. Вылечил моего сына после перекрута яичек. Наблюдается у него. Здоровья Вам и Вашим близким, дорогой профессор!",
    textEn: "Professor Dmitry Igorevich is a very attentive, kind, and responsive person. A true professional. He cured my son after testicular torsion. We continue follow-ups with him. Wishing you and your family health, dear professor!",
    source: "ПроДокторов",
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Октябрь 2025",
    dateEn: "October 2025",
    rating: 5,
    text: "К Тарусину Дмитрию Игоревичу впервые попали на прием по рекомендации врача, который наблюдал нашего сына 3 года (варикоцеле). На приеме произвел осмотр, УЗИ, подробно все рассказал и объяснил. После консультации не осталось сомнений по поводу операции. Через 2 недели сына прооперировали. Спустя год слышим заветные слова — здоров! Спасибо за Ваш профессионализм!",
    textEn: "We first visited Dr. Tarusin on a recommendation from a doctor who had been monitoring our son for 3 years (varicocele). During the appointment, he examined, performed ultrasound, and explained everything in detail. After the consultation, there were no doubts about surgery. Two weeks later, our son was operated on. A year later, we heard the cherished words — healthy! Thank you for your professionalism!",
    source: "ПроДокторов",
  },
  {
    name: "Медработник",
    nameEn: "Healthcare worker",
    date: "Октябрь 2025",
    dateEn: "October 2025",
    rating: 5,
    text: "Уролог папы порекомендовал Дмитрия Игоревича. Сказал, что лучше специалиста по детской урологии не найти! Я сама медработник и сразу поняла, что нам повезло! Специалисты такого уровня с деликатным и грамотным подходом сейчас на вес золота. Дмитрий Игоревич сделал сыну УЗИ с пристрастием, такого подробного объяснения я не видела!",
    textEn: "My husband's urologist recommended Dmitry Igorevich. He said there's no better pediatric urology specialist! Being a healthcare worker myself, I immediately understood how lucky we were! Specialists of this level with a delicate and competent approach are worth their weight in gold. Dmitry Igorevich performed a thorough ultrasound on our son — I've never seen such a detailed explanation!",
    source: "ПроДокторов",
  },
  {
    name: "Мама подростка",
    nameEn: "Mother of a teenager",
    date: "Июль 2025",
    dateEn: "July 2025",
    rating: 5,
    text: "Были на приёме с сыном 13-ти лет, диагноз «гипоплазия яичка». Дмитрий Игоревич тщательно изучил анализы, сам провёл УЗИ и предложил операцию. Операцию сделал с ювелирной точностью, через малюсенький разрез и с минимальной травматичностью. Дмитрий Игоревич — виртуоз Москвы, восстановил эстетику и улучшил функцию моему сыну. Можно смело доверить ему ребёнка.",
    textEn: "We visited with our 13-year-old son, diagnosed with testicular hypoplasia. Dmitry Igorevich thoroughly studied the tests, performed ultrasound himself, and suggested surgery. He performed the surgery with jeweler's precision through a tiny incision with minimal trauma. Dmitry Igorevich is Moscow's virtuoso — he restored aesthetics and improved function for my son. You can safely entrust your child to him.",
    source: "ПроДокторов",
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Март 2025",
    dateEn: "March 2025",
    rating: 5,
    text: "В новогодние праздники два коллеги из разных благотворительных фондов посоветовали Тарусина Дмитрия Игоревича со словами «только к нему». Оказался и врачом, и человеком совершенно изумительным. Объяснил и сыну отдельно, и мне, даже с рисованием картинки-схемы. Профессор — светило в области детской урологии-андрологии, он создавал отделение урологии и андрологии в Морозовской больнице. Потрясающе умеет общаться с ребенком!",
    textEn: "During the New Year holidays, two colleagues from different charities recommended Tarusin with the words 'go only to him.' He turned out to be an absolutely amazing doctor and person. He explained everything to my son separately and to me, even drawing diagrams. The Professor is a luminary in pediatric urology-andrology — he created the urology and andrology department at Morozovskaya Hospital. He's amazing at communicating with children!",
    source: "ПроДокторов",
  },
  {
    name: "Папа",
    nameEn: "Father",
    date: "Февраль 2025",
    dateEn: "February 2025",
    rating: 5,
    text: "Я обратился к Дмитрию Игоревичу с сыном. Врач сразу смог найти подход к ребёнку и расположить его к себе. Уже на первом приёме он поставил диагноз и через неделю провёл операцию. Всё прошло хорошо. Дмитрий Игоревич — врач по призванию. Если вы не хотите тратить время на походы по больницам, рекомендую обратиться к нему.",
    textEn: "I visited Dmitry Igorevich with my son. The doctor immediately found an approach to the child and put him at ease. At the very first appointment, he made a diagnosis and performed surgery a week later. Everything went well. Dmitry Igorevich is a doctor by calling. If you don't want to waste time going from hospital to hospital, I recommend contacting him.",
    source: "ПроДокторов",
  },
  {
    name: "Мама из Бузулука",
    nameEn: "Mother from Buzuluk",
    date: "Январь 2025",
    dateEn: "January 2025",
    rating: 5,
    text: "Тарусин Дмитрий Игоревич — врач от Бога! Только он обнаружил, что у нас слева не опустилось яичко. Наши врачи не видели данной проблемы. Провели операцию по низведению и фиксации яичка в мошонку. После того как сын пришел в себя, доктор зашел, объяснил доступным языком, показал медиафайл. Дмитрий Игоревич — врач с большой буквы. Вы самый крутой доктор в мире!",
    textEn: "Tarusin Dmitry Igorevich is a God-given doctor! Only he discovered that our left testicle hadn't descended. Our local doctors didn't see the problem. He performed surgery to bring down and fix the testicle in the scrotum. After our son came to, the doctor came in, explained everything in simple language, and showed a media file. Dmitry Igorevich is a Doctor with a capital D. You're the coolest doctor in the world!",
    source: "ПроДокторов",
  },
  {
    name: "Мама из Гагарина",
    nameEn: "Mother from Gagarin",
    date: "Декабрь 2024",
    dateEn: "December 2024",
    rating: 5,
    text: "У сына с рождения не было опущено одно яичко. Наши местные врачи ничего не находили. Знакомые посоветовали обратиться к Тарусину Дмитрию Игоревичу. Это доктор со всех больших букв! В 2022 году провёл сложнейшую операцию, дал рекомендации. Теперь мой ребёнок абсолютно здоров! Отношение в клинике к пациентам, как к родным людям. Дмитрий Игоревич, Вы самый крутой!",
    textEn: "Our son had an undescended testicle from birth. Local doctors found nothing. Friends recommended Dr. Tarusin. He is a Doctor in every sense! In 2022, he performed a very complex surgery and gave recommendations. Now my child is completely healthy! The clinic treats patients like family. Dmitry Igorevich, you're the coolest!",
    source: "ПроДокторов",
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Июнь 2024",
    dateEn: "June 2024",
    rating: 5,
    text: "В районной поликлинике заподозрили варикоз, но УЗИ не подтвердило диагноз. Доктор Тарусин диагностировал варикоцеле. Подробно объяснили, как будет проведена операция. Прооперирован срочно. Через час после операции сын поел. Тошноты не было. Наркоз идеальный! Полное восстановление через месяц. Не болело оперированное место ни разу. Спасибо за профессионализм!",
    textEn: "The local clinic suspected varicose veins, but ultrasound didn't confirm it. Dr. Tarusin diagnosed varicocele. They explained in detail how the surgery would be performed. Surgery was done urgently. An hour after surgery, our son ate. No nausea. Perfect anesthesia! Full recovery in a month. The surgical site never hurt even once. Thank you for your professionalism!",
    source: "ПроДокторов",
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Декабрь 2023",
    dateEn: "December 2023",
    rating: 5,
    text: "Год назад Дмитрий Игоревич провел потрясающую операцию моему сыну. В 10 лет был запущенный рубцовый фимоз. Консультацию провел подробно, в основном разговаривал с сыном. Ребенок доверился сразу. Далее он несколько раз заходил в палату, интересовался самочувствием. Послеоперационный период прошел без осложнений. Сын вспоминает доброго доктора. Превосходный доктор с золотыми руками и сердцем.",
    textEn: "A year ago, Dmitry Igorevich performed an amazing surgery on my son. At 10 years old, he had advanced cicatricial phimosis. The consultation was thorough — he mainly spoke with my son. The child trusted him immediately. He came to check on us in the ward several times. Recovery was complication-free. My son remembers the kind doctor. An outstanding doctor with golden hands and heart.",
    source: "ПроДокторов",
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Декабрь 2023",
    dateEn: "December 2023",
    rating: 5,
    text: "Визит к Тарусину Дмитрию Игоревичу мне понравился, специалист высокого уровня! Он поставил диагноз в нужном направлении, чего другие врачи не смогли сделать. Свои выводы делал на основании осмотра, дополнительных исследований и опроса. Он работал со мной более часа. Я получил комплексную услугу.",
    textEn: "I enjoyed my visit to Dr. Tarusin — a high-level specialist! He made the right diagnosis, which other doctors couldn't. He based his conclusions on examination, additional tests, and interview. He worked with me for over an hour. I received comprehensive service.",
    source: "ПроДокторов",
  },
  {
    name: "Многодетный отец",
    nameEn: "Father of many children",
    date: "Ноябрь 2023",
    dateEn: "November 2023",
    rating: 5,
    text: "Рекомендации друзей из врачебной среды привели к Дмитрию Игоревичу. Как многодетный отец, я имел опыт работы с разными детскими врачами, но доктор Тарусин превысил все мои ожидания. Более внимательного, интеллигентного и доброго детского хирурга мы не встречали. Настоящий профессор с академическими знаниями и огромной практикой. Микрохирургическая операция Мармара прошла успешно. Благодарность всей хирургической бригаде!",
    textEn: "Recommendations from friends in the medical field led us to Dmitry Igorevich. As a father of many children, I've dealt with various pediatric doctors, but Dr. Tarusin exceeded all expectations. We've never met a more attentive, intelligent, and kind pediatric surgeon. A true professor with academic knowledge and vast practice. The microsurgical Marmar operation was successful. Gratitude to the entire surgical team!",
    source: "ПроДокторов",
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Июль 2023",
    dateEn: "July 2023",
    rating: 5,
    text: "С Дмитрием Игоревичем мы знакомы с сыном с 2004 года, когда попали с диагнозом «крипторхизм». Провел блестящую консультацию. Мы полностью доверились доктору, который не только отличный специалист, но и приятный человек с чувством юмора. В 2021 году возник диагноз «варикоцеле». И снова блестяще проведенная операция. Вердикт: «полностью здоров». Выражаем бесконечную благодарность профессору Тарусину!",
    textEn: "My son and I have known Dmitry Igorevich since 2004, when we came with a cryptorchidism diagnosis. He gave a brilliant consultation. We fully trusted the doctor, who is not only an excellent specialist but a pleasant person with humor. In 2021, varicocele was diagnosed. Another brilliantly performed surgery. Verdict: 'completely healthy.' We express endless gratitude to Professor Tarusin!",
    source: "ПроДокторов",
  },
  {
    name: "Мама 15-летнего сына",
    nameEn: "Mother of a 15-year-old son",
    date: "Март 2023",
    dateEn: "March 2023",
    rating: 5,
    text: "К чудо-доктору обратились по совету другого врача: «Ищите Тарусина Дмитрия Игоревича». После двух операций в разных клиниках проблема не ушла. Дмитрий Игоревич после тщательного УЗИ предложил операцию и прооперировал сам. Прошло 7 месяцев, рецидива нет! В Москве работает настоящий профессионал своего дела, невероятно чуткий и внимательный, профессор Тарусин!",
    textEn: "We found this miracle doctor on another doctor's advice: 'Look for Tarusin Dmitry Igorevich.' After two surgeries at different clinics, the problem persisted. After a thorough ultrasound, Dmitry Igorevich suggested surgery and performed it himself. Seven months have passed — no recurrence! In Moscow works a true professional, incredibly sensitive and attentive — Professor Tarusin!",
    source: "ПроДокторов",
  },
  {
    name: "Мама из Орска",
    nameEn: "Mother from Orsk",
    date: "Январь 2023",
    dateEn: "January 2023",
    rating: 5,
    text: "Наша история началась в 2010 году! Моему сыну сделали операцию, но через год грыжа появилась снова. Потом выяснилось, что у ребенка нет одного яичка! Нас отправили к профессору Тарусину. Мы наблюдались 7 лет у профессора. И вот произошло чудо — Доктор сделал долгожданную операцию! Он спас от онкологии. Наша история длилась 13 лет! Счастливый конец. Волшебником нашей истории является Дмитрий Игоревич!",
    textEn: "Our story began in 2010! My son had surgery, but a year later the hernia returned. Then it turned out the child was missing a testicle! We were sent to Professor Tarusin. We were monitored for 7 years. Then the miracle happened — the Doctor performed the long-awaited surgery! He saved us from cancer. Our story lasted 13 years! A happy ending. The wizard of our story is Dmitry Igorevich!",
    source: "ПроДокторов",
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Декабрь 2022",
    dateEn: "December 2022",
    rating: 5,
    text: "Мы обратились к Дмитрию Игоревичу, когда сыну (11 лет) поставили диагноз «крипторхизм». После консультации Тарусина все стало понятно: и план лечения, и с диагнозами разобрались. Врач лично делает УЗИ и диагностику. Легко находит контакт с детьми, что бывает непросто в деликатных вопросах с подростками. Дмитрий Игоревич провел операцию сыну, все прошло успешно!",
    textEn: "We came to Dmitry Igorevich when our son (11) was diagnosed with cryptorchidism. After Tarusin's consultation, everything became clear — treatment plan and diagnoses sorted out. The doctor personally performs ultrasound and diagnostics. He easily connects with children, which can be challenging with delicate issues involving teenagers. Dmitry Igorevich performed the surgery — everything went successfully!",
    source: "ПроДокторов",
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Август 2019",
    dateEn: "August 2019",
    rating: 5,
    text: "Дмитрий Игоревич — великолепный профессионал, добрый и отзывчивый человек.",
    textEn: "Dmitry Igorevich is a magnificent professional, a kind and responsive person.",
    source: "ПроДокторов",
  },
  {
    name: "Мария К.",
    nameEn: "Maria K.",
    date: "Декабрь 2021",
    dateEn: "December 2021",
    rating: 5,
    text: "С 2015 года местные врачи не могли помочь. Тарусин разобрался сразу. Мы очень благодарны за профессионализм и внимательное отношение.",
    textEn: "Since 2015, local doctors couldn't help. Tarusin figured it out immediately. We are very grateful for his professionalism and attentive attitude.",
    source: "ПроДокторов",
  },
  {
    name: "Евгений К.",
    nameEn: "Evgeny K.",
    date: "Июль 2019",
    dateEn: "July 2019",
    rating: 5,
    text: "Вернулся после длинной операции, извинился перед очередью и принял всех. Невероятно. Такого отношения к пациентам я не встречал больше нигде.",
    textEn: "Returned after a long surgery, apologized to the waiting line, and saw every patient. Incredible. I've never encountered such attitude toward patients anywhere else.",
    source: "ПроДокторов",
  },
  {
    name: "Гость",
    nameEn: "Guest",
    date: "Апрель 2019",
    dateEn: "April 2019",
    rating: 5,
    text: "Сам принимает, сам делает УЗИ, сам читает гормоны. Таких в России не встречали. Профессор — уникальный специалист.",
    textEn: "He examines himself, performs ultrasound himself, reads hormones himself. We've never encountered such a doctor in Russia. The Professor is a unique specialist.",
    source: "ПроДокторов",
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Июнь 2018",
    dateEn: "June 2018",
    rating: 5,
    text: "Консультация при беременности — отменил ненужные таблетки. Девочка родилась здоровой. Огромная благодарность доктору!",
    textEn: "Consultation during pregnancy — he canceled unnecessary medications. The girl was born healthy. Enormous gratitude to the doctor!",
    source: "ПроДокторов",
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Май 2018",
    dateEn: "May 2018",
    rating: 5,
    text: "Умеет снять тревогу, поселить уверенность, что всё поправимо. Замечательный доктор.",
    textEn: "He knows how to relieve anxiety and instill confidence that everything can be fixed. A wonderful doctor.",
    source: "ПроДокторов",
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "Ноябрь 2017",
    dateEn: "November 2017",
    rating: 5,
    text: "Отличный специалист, отзывчивый и внимательный. Рекомендую всем.",
    textEn: "Excellent specialist, responsive and attentive. I recommend to everyone.",
    source: "ПроДокторов",
  },
  // DocDoc reviews
  {
    name: "Галина",
    nameEn: "Galina",
    date: "5 июля 2025",
    dateEn: "July 5, 2025",
    rating: 5,
    text: "Дмитрий Игоревич врач высочайшего уровня! Великолепно провёл осмотр моего сына, сам сделал УЗИ, всё понятно и подробно объяснил. Операцию сделал очень аккуратно. Обезболивающие после неё сын вообще не пил ни разу, ни синяков, ни отёков не было. У Дмитрия Игоревича всё выверено и отработано за годы его сложнейшей работы. Человек он весёлый, очень деликатный, любящий свою работу. Только к нему, он разберётся в любых, даже самых запутанных случаях.",
    textEn: "Dmitry Igorevich is a doctor of the highest level! He examined my son brilliantly, performed ultrasound himself, explained everything clearly and in detail. The surgery was done very neatly. My son never needed painkillers after it — no bruises, no swelling. Everything with Dmitry Igorevich is refined and perfected over years of complex work. He's a cheerful, very delicate person who loves his work. Go only to him — he'll figure out even the most complicated cases.",
    source: "DocDoc",
  },
  {
    name: "Вил",
    nameEn: "Vil",
    date: "2 февраля 2025",
    dateEn: "February 2, 2025",
    rating: 5,
    text: "В декабре обратились к врачу за консультацией, т.к. с марта месяца куда только не обращались — нам не могли помочь. Дмитрий Игоревич на первом приёме внимательно нас выслушал, сделал тщательное УЗИ, дал заключение на операцию. Через неделю была назначена дата. Утром приехали на операцию, вечером уже выписали. Хочу выразить огромную благодарность Дмитрию Игоревичу за его профессионализм и человечность. Всем смело его рекомендую как врача от бога и профессионала своего дела.",
    textEn: "In December, we consulted the doctor because since March we'd been everywhere — nobody could help. At the first appointment, Dmitry Igorevich listened attentively, performed a thorough ultrasound, and gave the conclusion for surgery. A week later, the date was set. We arrived in the morning for surgery and were discharged by evening. I want to express enormous gratitude to Dmitry Igorevich for his professionalism and humanity. I boldly recommend him to everyone as a God-given doctor and a professional.",
    source: "DocDoc",
  },
  {
    name: "Елена",
    nameEn: "Elena",
    date: "31 января 2025",
    dateEn: "January 31, 2025",
    rating: 5,
    text: "Тарусин Дмитрий Игоревич врач от Бога! Только он обнаружил, что у нас слева не опустилось яичко. Наши врачи не видели данной проблемы, говорили всё хорошо. 29.01.25г нам провели операцию по низведению и фиксации яичка в мошонку. После того как сын пришёл в себя, доктор зашёл в палату, объяснил доступным языком, как прошла операция, показал медиафайл. Дмитрий Игоревич — врач с большой буквы. Отношение в клинике к пациентам на высшем уровне.",
    textEn: "Tarusin Dmitry Igorevich is a God-given doctor! Only he discovered that our left testicle hadn't descended. Our doctors didn't see the problem, said everything was fine. On 01/29/2025, he performed surgery to bring down and fix the testicle. After our son came to, the doctor came to the ward, explained in simple language how the operation went, and showed a media file. Dmitry Igorevich is a Doctor with a capital D. The clinic's attitude toward patients is at the highest level.",
    source: "DocDoc",
  },
  {
    name: "Елена",
    nameEn: "Elena",
    date: "13 декабря 2023",
    dateEn: "December 13, 2023",
    rating: 5,
    text: "Год назад Дмитрий Игоревич провёл потрясающую операцию моему сыну. В 10 лет был запущенный рубцовый фимоз. Консультацию провёл подробно, в основном разговаривал с сыном, объясняя, как можно ему помочь. Ребёнок доверился сразу. В день операции доктор ещё раз объяснил всё. Несколько раз заходил в палату, интересовался самочувствием. Послеоперационный период прошёл без осложнений. Дмитрий Игоревич — превосходный доктор с золотыми руками и сердцем.",
    textEn: "A year ago, Dmitry Igorevich performed an amazing surgery on my son. At 10, he had advanced cicatricial phimosis. The consultation was thorough — he mainly talked to my son, explaining how he could help. The child trusted him immediately. On surgery day, the doctor explained everything again. He came to check on us in the ward multiple times. Recovery was complication-free. Dmitry Igorevich is an outstanding doctor with golden hands and heart.",
    source: "DocDoc",
  },
  {
    name: "Максим",
    nameEn: "Maxim",
    date: "27 июля 2023",
    dateEn: "July 27, 2023",
    rating: 5,
    text: "С Дмитрием Игоревичем мы знакомы с 2004 года, когда впервые попали с диагнозом крипторхизм. Провёл блестящую консультацию. Мы полностью доверились доктору, который не только отличный специалист, но и приятный человек с чувством юмора, вселяющий уверенность в результат. В 2021 году возник диагноз варикоцеле. И снова блестяще проведённая операция. Вердикт: «полностью здоров». Выражаем бесконечную благодарность профессору Тарусину Дмитрию Игоревичу!",
    textEn: "We've known Dmitry Igorevich since 2004, when we first came with a cryptorchidism diagnosis. He gave a brilliant consultation. We fully trusted the doctor, who is not only an excellent specialist but a pleasant person with humor, inspiring confidence in the outcome. In 2021, varicocele was diagnosed. Another brilliantly performed surgery. Verdict: 'completely healthy.' We express endless gratitude to Professor Tarusin!",
    source: "DocDoc",
  },
  // Doctu reviews
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "21 апреля 2023",
    dateEn: "April 21, 2023",
    rating: 5,
    text: "Мы были поражены врачом Тарусиным Дмитрием Игоревичем! Он тщательно изучил мою историю болезни, вник во все детали и назначил дополнительные обследования. После приёма мы почувствовали, что у нас есть шанс вылечить наше заболевание. Этот врач как посланник от Бога! Большое спасибо!",
    textEn: "We were astonished by Dr. Tarusin Dmitry Igorevich! He carefully studied my medical history, went into every detail and ordered additional examinations. After the appointment we felt that we finally had a chance to cure our condition. This doctor is like a messenger from God! Thank you so much!",
    source: "Докту",
  },
  {
    name: "Пациент",
    nameEn: "Patient",
    date: "14 декабря 2021",
    dateEn: "December 14, 2021",
    rating: 5,
    text: "СПАСИБО! СПАСИБО! и ещё раз СПАСИБО! Две операции в 2015 и 2016 году и не проходящая проблема. Полное отсутствие перспектив. И вот удача — Дмитрий Игоревич Тарусин. В результате: правильно поставленный диагноз, уникальный индивидуальный подход к ребёнку, блестящая операция и… счастливое будущее ребёнка! Низкий поклон!",
    textEn: "THANK YOU! THANK YOU! And THANK YOU again! Two surgeries in 2015 and 2016 and the problem still wouldn't go away. Total lack of perspective. And then a stroke of luck — Dmitry Igorevich Tarusin. The result: a correctly established diagnosis, a unique individual approach to the child, a brilliant surgery and… a happy future for the child! A low bow to you!",
    source: "Докту",
  },
  {
    name: "Дмитрий Сачков",
    nameEn: "Dmitry Sachkov",
    date: "27 января 2017",
    dateEn: "January 27, 2017",
    rating: 5,
    text: "Дмитрий Игоревич — чудесный человек и замечательный врач! Помог моему сыну без операции.",
    textEn: "Dmitry Igorevich is a wonderful person and an excellent doctor! He helped my son without surgery.",
    source: "Докту",
  },
  // Dr. Matara's clinic reviews
  {
    name: "Кристина",
    nameEn: "Kristina",
    date: "Сентябрь 2025",
    dateEn: "September 2025",
    rating: 5,
    text: "Благодарю профессора Асаада Ахмадовича Матара за оперативно качественное проведение операции по гипоспадии, за терпеливость и понимание. Мы всегда получали ответы на волнующие нас вопросы. Доктор был всегда на связи. Также очень поддерживала уролог-андролог Надежда Александровна Середницкая. В клинике царит домашняя и уютная атмосфера. Спасибо за то, что теперь у моего сына всё хорошо!",
    textEn: "I thank Professor Assad Akhmadovich Matara for the prompt, quality hypospadias surgery, for his patience and understanding. We always received answers to our questions. The doctor was always available. Urologist-andrologist Nadezhda Serednitskaya was also very supportive. The clinic has a homely, cozy atmosphere. Thank you for making my son well!",
    source: "Клиника доктора Матара",
  },
  {
    name: "Семья Можаевых",
    nameEn: "The Mozhaev family",
    date: "Сентябрь 2025",
    dateEn: "September 2025",
    rating: 5,
    text: "Хотим поблагодарить руководителя центра лечения мужского бесплодия Матара Сохейла Ахмадовича! У нас с супругой около 6 лет не было детей. Проходили лечение в нескольких учреждениях, безрезультатно. Уже отчаялись... С последней надеждой попали к этому замечательному доктору и вот спустя 8 месяцев лечения мы ждем малыша! Спасибо за поддержку и теплое отношение! Вы сотворили чудо!",
    textEn: "We want to thank the head of the male infertility treatment center, Dr. Matara Sokheil! My wife and I were childless for about 6 years. We underwent treatment at several facilities, to no avail. We had already given up... As a last hope, we came to this wonderful doctor, and after 8 months of treatment, we're expecting a baby! Thank you for the support and warm attitude! You worked a miracle!",
    source: "Клиника доктора Матара",
  },
  {
    name: "Надежда",
    nameEn: "Nadezhda",
    date: "Сентябрь 2025",
    dateEn: "September 2025",
    rating: 5,
    text: "В клинике доктора Матара моего сына наблюдает доктор Ерохин Е.А. более 3-х лет. Сделали операцию по коррекции сильного косоглазия в октябре 2024 г. Сегодня на контроле доктор похвалил — результат сохранился на 100%. Зрение держится. Глаза стоят ровно. Я, как медик, ценю тёплое, внимательное отношение к пациентам. В эту клинику хочется приезжать снова. Сын сказал поставить 1000%!",
    textEn: "At Dr. Matara's clinic, my son has been monitored by Dr. Erokhin for over 3 years. Surgery to correct severe strabismus was done in October 2024. At today's check-up, the doctor praised — the result is preserved 100%. Vision is stable. Eyes are straight. As a medical professional, I appreciate the warm, attentive attitude toward patients. You want to come back to this clinic. My son said to rate it 1000%!",
    source: "Клиника доктора Матара",
  },
  {
    name: "Мария",
    nameEn: "Maria",
    date: "Август 2025",
    dateEn: "August 2025",
    rating: 5,
    text: "Доктор Матар провел операцию нашему малышу по поводу гипоспадии. Мы в восторге от результата! Врач очень внимательный, перезванивал лично после выписки, интересовался состоянием. Чувствуется настоящая забота о пациентах.",
    textEn: "Dr. Matara performed hypospadias surgery on our baby. We are thrilled with the result! The doctor is very attentive, personally called after discharge to check on the condition. You can feel genuine care for patients.",
    source: "Клиника доктора Матара",
  },
  {
    name: "Мама",
    nameEn: "Mother",
    date: "Август 2025",
    dateEn: "August 2025",
    rating: 5,
    text: "Я мама мальчика 6 лет с гипоспадией мошоночной формы. В первый раз оперировали в другой клинике, но разошелся шов. Через несколько лет обратились в фонд «Тешам». Они посоветовали доктора Матара Асаада Ахмадовича в Москве. Он прооперировал мальчика очень хорошо. Ребенок ходил в туалет сидя до операции, теперь может ходить стоя. Он сам этому очень рад. Большое спасибо доктору и всему коллективу!",
    textEn: "I'm the mother of a 6-year-old boy with scrotal hypospadias. The first surgery at another clinic failed — the suture came apart. Years later, we contacted the Tesham Foundation. They recommended Dr. Matara in Moscow. He operated on the boy very well. Before surgery, the child could only use the toilet sitting down; now he can stand. He's very happy about it. Many thanks to the doctor and the entire team!",
    source: "Клиника доктора Матара",
  },
];

const ReviewsSection = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 3;
  const maxIndex = reviews.length - reviewsPerPage;

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const displayReviews = reviews.slice(currentIndex, currentIndex + reviewsPerPage);

  const getName = (r: Review) => (isEn && r.nameEn) ? r.nameEn : r.name;
  const getDate = (r: Review) => (isEn && r.dateEn) ? r.dateEn : r.date;
  const getText = (r: Review) => isEn ? r.textEn : r.text;

  return (
    <section id="reviews" className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("reviews.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("reviews.subtitle")}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-lg font-semibold text-foreground">5.0</span>
            <span className="text-muted-foreground">{reviews.length}+ {t("reviews.reviewsCount")}</span>
          </div>
        </div>

        {/* Reviews Carousel */}
        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6">
            {displayReviews.map((review, index) => (
              <Card 
                key={`${review.name}-${currentIndex}-${index}`}
                className="bg-card border-border shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setSelectedReview(review)}
              >
                <CardContent className="p-6">
                  <Quote className="w-10 h-10 text-primary/20 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-6">
                    "{getText(review)}"
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="font-semibold text-foreground">{getName(review)}</p>
                      <p className="text-sm text-muted-foreground">{getDate(review)}</p>
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
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} — {Math.min(currentIndex + reviewsPerPage, reviews.length)} {isEn ? "of" : "из"} {reviews.length}
            </span>
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
            <div className="text-sm text-muted-foreground">{t("reviews.reviewsCount")}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">{isEn ? "Recommend" : "Рекомендуют"}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">42</div>
            <div className="text-sm text-muted-foreground">{t("about.achYears")}</div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            {isEn ? "All reviews are verified and published on independent platforms" : "Все отзывы проверены и опубликованы на независимых платформах"}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.open("https://yandex.ru/maps/org/klinika_doktora_matara/1124622894/reviews/", "_blank")}>
              {isEn ? "Read on Yandex" : "Читать на Яндексе"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open("https://prodoctorov.ru/moskva/vrach/32554-tarusin/otzivi/", "_blank")}>
              {isEn ? "Read on ProDoctors" : "Читать на ПроДокторов"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open("https://docdoc.ru/doctor/Tarusin_Dmitriy#reviews", "_blank")}>
              {isEn ? "Read on DocDoc" : "Читать на DocDoc"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open("https://doctu.ru/msk/doctor/tarusin-d-i#feedback", "_blank")}>
              {isEn ? "Read on Doctu" : "Читать на Докту"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open("https://www.matar-clinic.ru/reviews/", "_blank")}>
              {isEn ? "Dr. Matara's Clinic" : "Клиника доктора Матара"}
            </Button>
          </div>
        </div>
        {/* Review Detail Dialog */}
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-lg">
            {selectedReview && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{getName(selectedReview)}</span>
                    <span className="text-sm font-normal text-muted-foreground">{selectedReview.source}</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(selectedReview.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">{getDate(selectedReview)}</span>
                </div>
                <p className="text-foreground leading-relaxed">
                  "{getText(selectedReview)}"
                </p>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default ReviewsSection;
