import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowLeft, Award, BookOpen, ExternalLink, Users, Calendar, FileText, Video, Play, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { P as PageMeta, C as Card, a as CardContent, B as Button, c as CardHeader, d as CardTitle } from "../main.mjs";
import { A as AgeConfirmationModal } from "./AgeConfirmationModal-COJlSvbH.js";
import { useTranslation } from "react-i18next";
import "react";
import "vite-react-ssg";
import "@tanstack/react-query";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@supabase/supabase-js";
import "i18next";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-label";
import "embla-carousel-react";
import "@radix-ui/react-checkbox";
import "zod";
import "react-helmet-async";
const ForDoctors = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const specializations = isEn ? [
    "Microsurgery (varicocele, cryptorchidism, hydrocele, spermatocele)",
    "Ultrasound diagnostics of scrotal organs and prostate",
    "Foreskin pathology: phimosis, balanoposthitis, morphological aspects",
    "Emergency conditions: acute scrotal diseases, torsions",
    "Testicular microlithiasis: focal and diffuse testicular lesions",
    "Delayed puberty: diagnosis and management in boys",
    "Erectile dysfunction and functional disorders",
    "Legal aspects: errors, risks, and strategies in pediatric uro-andrology"
  ] : [
    "Микрохирургия (варикоцеле, крипторхизм, водянка, сперматоцеле)",
    "Ультразвуковая диагностика органов мошонки и предстательной железы",
    "Патология крайней плоти: фимоз, баланопостит, морфологические аспекты",
    "Неотложные состояния: острые заболевания органов мошонки, перекруты",
    "Тестикулярный микролитиаз: очаговые и диффузные поражения ткани яичка",
    "Задержка полового развития: диагностика и тактика у мальчиков",
    "Эректильная дисфункция и функциональные нарушения",
    "Юридические аспекты: ошибки, опасности и стратегии в детской уроандрологии"
  ];
  const publications = isEn ? [
    { title: "Urology Today", description: "Pediatric urology and rehabilitation — current issues", url: "https://abvpress.ru/upload/iblock/a7f/a7fb857a9885cdf8c4603cb8523ef37a.pdf", type: "PDF" },
    { title: "Urodigest Journal", description: "Publication in a professional urological journal", url: "https://urodigest.ru/sites/default/files/issue/02-2012.pdf", type: "PDF" },
    { title: "Prevention of Male Infertility in Tumor Treatment", description: "Problems and solutions — scientific article on CyberLeninka", url: "https://cyberleninka.ru/article/n/profilaktika-muzhskogo-besplodiya-pri-lechenii-opuholey-problemy-i-resheniya", type: "Article" }
  ] : [
    { title: "Урология сегодня", description: "Детская урология и реабилитация — актуальные вопросы", url: "https://abvpress.ru/upload/iblock/a7f/a7fb857a9885cdf8c4603cb8523ef37a.pdf", type: "PDF" },
    { title: "Журнал «Урологи» (Urodigest)", description: "Публикация в профессиональном урологическом издании", url: "https://urodigest.ru/sites/default/files/issue/02-2012.pdf", type: "PDF" },
    { title: "Профилактика мужского бесплодия при лечении опухолей", description: "Проблемы и решения — научная статья на CyberLeninka", url: "https://cyberleninka.ru/article/n/profilaktika-muzhskogo-besplodiya-pri-lechenii-opuholey-problemy-i-resheniya", type: "Статья" }
  ];
  const videoLectures = [
    { title: isEn ? "Nocturnal Erection Pattern — What, Why, How" : "Паттерн ночной эрекции – что, зачем, почему", views: "301", year: "2024", url: "https://uro.tv/video/tarusin_di_-_pattern_nochnoy_erektsii__chto_zachem_pochemu" },
    { title: isEn ? "Clinical Observation — Complete Urethral Duplication with Hypospadias" : "Клиническое наблюдение – полное удвоение уретры при гипоспадии", views: "93", year: "2024", url: "https://uro.tv/video/tarusin_di_-_klinicheskoe_nablyudenie__polnoe_udvoenie_uretri_pri_gipospadii" },
    { title: isEn ? "New Approach to Pelvic Floor Muscle Dysfunction Treatment" : "Новое слово в лечении дисфункции мышц тазового дна", views: "49", year: "2024", url: "https://uro.tv/video/tarusin_di_-_novoe_slovo_v_lechenii_disfunktsii_mishts_tazovogo_dna_i_assotsiirovannih_s_nim_rasstroystvmp4" },
    { title: isEn ? "Acute and Chronic Foreskin Diseases in Children" : "Острые и хронические заболевания крайней плоти у детей", views: "98", year: "2024", url: "https://uro.tv/video/tarusin_di_-_ostrie_i_hronicheskie_zabolevaniya_krayney_ploti_u_detey" },
    { title: isEn ? "Foreskin and Glans Diseases in Children" : "Заболевания крайней плоти и головки полового члена у детей", views: "491", year: "2024", url: "https://uro.tv/video/tarusin_di_-_zabolevaniya_krayney_ploti_i_golovki_polovogo_chlena_u_detey" },
    { title: isEn ? "Varicocele. To be or not to beat" : "Варикоцеле. To be or not to beat", views: "594", year: "2024", url: "https://uro.tv/video/tarusin_di_-_varikotsele_to_be_or_not_to_beat" },
    { title: isEn ? "Armageddon in Andrology: Consequences of Treatment Errors" : "Армагеддон в андрологии: последствия ошибок лечения", views: "466", year: "2023", url: "https://uro.tv/video/tarusin_di_-_armageddon_v_andrologii_posledstviya_oshibok_lecheniya" },
    { title: isEn ? "Symbiosis of Pediatric and Adult Urologist as Foundation of Men's Health" : "Симбиоз детского и взрослого уролога как фундамент мужского здоровья", views: "424", year: "2022", url: "https://uro.tv/video/korshunov_mn_tarusin_di_-_simbioz_detskogo_i_vzroslogo_urologa_kak_fundament_mugskogo_zdorovya" },
    { title: isEn ? "Varicocele. Ab ovo ad absurdum" : "Варикоцеле. Ab ovo ad absurdum", views: "698", year: "2021", url: "https://uro.tv/video/tarusin_di_-_tema_varikotsele_ab_ovo_ad_absurdum" },
    { title: isEn ? "Round Table: Varicocele — From Child to Adult" : "Круглый стол: Варикоцеле — от ребёнка к взрослому", views: "607", year: "2021", url: "https://uro.tv/video/krugliy_stol_1_varikotsele_ot_rebenka_k_vzroslomu_neobichno_ob_obichnom" },
    { title: isEn ? "Focal and Diffuse Testicular Lesions. Testicular Microlithiasis" : "Очаговые и диффузные поражения ткани яичка. Тестикулярный микролитиаз", views: "709", year: "2020", url: "https://uro.tv/video/tarusin_di_-_ochagovie_i_diffuznie_porageniya_tkani_yaichka_u_detey_i_podrostkov_testikulyarniy_mikrolitiaz" },
    { title: isEn ? "Strategy and Tactics of Varicocele Diagnosis and Treatment in Children" : "Стратегия и тактика диагностики и лечения варикоцеле у детей и подростков", views: "893", year: "2019", url: "https://uro.tv/video/tarusin_di_-_strategiya_i_taktika_diagnostiki_i_lecheniya_varikotsele_u_detey_i_podrostkov" },
    { title: isEn ? "Foreskin Diseases — New Morphological Data" : "Болезни крайней плоти – новые морфологические данные", views: "2574", year: "2019", url: "https://uro.tv/video/tarusin_di_-_bolezni_krayney_ploti-novie_morfologicheskie_dannie_o_strukture_patologicheskih_protsessov" },
    { title: isEn ? "Errors, Risks, and Legal Strategies in Pediatric Uro-Andrology" : "Ошибки, опасности и юридические стратегии в практике детского уролога-андролога", views: "336", year: "2019", url: "https://uro.tv/video/tarusin_di_-_oshibki_opasnosti_i_yuridicheskie_strategii_v_povsednevnoy_praktike_detskogo_urologa-androloga" },
    { title: isEn ? "The Foreskin — Boundless" : "Крайняя плоть – бескрайняя", views: "1584", year: "2018", url: "https://uro.tv/video/tarusin_di_-_kraynyaya_plot_-_beskraynya" },
    { title: isEn ? "Ultrasound Diagnostics of Acute Scrotal Diseases" : "Ультразвуковая диагностика острых заболеваний органов мошонки", views: "1014", year: "2018", url: "https://uro.tv/video/tarusin_di_-_ultrazvukovaya_diagnostika_ostrih_zabolevaniy_organov_moshonki" },
    { title: isEn ? "Pediatric and Adolescent Andrology (Interview)" : "Детская и подростковая андрология (интервью)", views: "3638", year: "2018", url: "https://uro.tv/video/detskaya_i_podrostkovaya_andrologiya_intervyu_s_tarusinim_di" },
    { title: isEn ? "Emergency Conditions in Pediatric Urology-Andrology" : "Неотложные состояния в детской урологии-андрологии", views: "1579", year: "2017", url: "https://uro.tv/video/tarusin_di_-_neotlognie_sostoyaniya_v_detskoy_urologii_-_andrologii" },
    { title: isEn ? "Delayed Puberty in Boys: When to Worry? (Interview)" : "Задержка полового развития мальчиков: когда надо беспокоиться? (интервью)", views: "3424", year: "2016", url: "https://uro.tv/video/zadergka_polovogo_razvitiya_malchikov_kogda_nado_bespokoitsya_intervyu_s_tarusinim_di" },
    { title: isEn ? "Public-Private Partnership in Pediatric Urology-Andrology" : "Частно-государственное партнерство в детской урологии-андрологии", views: "1346", year: "2013", url: "https://uro.tv/video/tarusin_di_chastno-gosudarstvennoe_partnerstvo__v_detskoy_urologii-andrologii" },
    { title: isEn ? "Healthcare Reorganization — New Challenges for Uro-Andrological Care Quality" : "Реорганизация здравоохранения – новые вызовы к качеству уроандрологической помощи детям", views: "1938", year: "2013", url: "https://uro.tv/video/tarusin_di_reorganizatsiya_zdravoohraneniya_%E2%80%93_novie_vizovi_k_poryadku_i_kachestvu_uroandrologicheskoy_pomoshchi_detyam_v_rossii" },
    { title: isEn ? "Pediatric Urology in Russia: Path, Achievements, Prospects" : "Детская урология в Российской Федерации: путь, достижения, перспективы", views: "1175", year: "2013", url: "https://uro.tv/video/tarusin_di_detskaya_urologiya_v_rossiyskoy_federatsii_put_dostigeniya_perspektivi" }
  ];
  const youtubeVideos = [
    { title: isEn ? "At What Age Is Erection Normal?" : "С какого возраста эрекция — это нормально?", views: "2.6K", type: "Shorts", url: "https://www.youtube.com/watch?v=DSn8UjdpSGs" },
    { title: isEn ? "Is Abstinence Healthy? Testing the November Trend!" : "Воздержание — это полезно? Проверяем тренд ноября!", views: "926", type: "Shorts", url: "https://www.youtube.com/shorts/o2apP98HtJU" },
    { title: isEn ? "New Vitamin D Norms for Men!" : "Новые нормы витамина Д для мужчин!", views: "1.7K", type: "Shorts", url: "https://www.youtube.com/shorts/_3sVOZED_7o" },
    { title: isEn ? "Stop Googling the Norm — Here's the Real Truth" : "Хватит гуглить норму — вот настоящая правда", views: "144", type: "Shorts", url: "https://www.youtube.com/shorts/7z5CxHKjmng" },
    { title: isEn ? "In 90 Seconds You'll Know More Than 90% of Men" : "За 90 секунд знаешь больше 90% мужчин", views: "1K", type: "Shorts", url: "https://www.youtube.com/shorts/8ixg9zX-8bs" },
    { title: isEn ? "Libido: Normal or Concerning? Learning the Fine Line" : "Либидо: норм или стрем? Учу видеть тонкую грань", views: "126", type: "Shorts", url: "https://www.youtube.com/shorts/DVx83ACnb1E" },
    { title: isEn ? "Can You Influence Penile Growth in Advance?" : "Можно ли повлиять на рост полового члена заранее?", views: "1K", type: "Shorts", url: "https://www.youtube.com/shorts/cJktQWxsuCw" },
    { title: isEn ? "Urologist's Secret: The Truth About Hand Washing" : "Секрет уролога: Правда о мытье рук", views: "115", type: isEn ? "Video" : "Видео", url: "https://www.youtube.com/watch?v=H9i2UVTt6Ds" },
    { title: isEn ? "How to Choose Anesthesia? What Tests to Get?" : "Как выбрать наркоз? Какие анализы сдавать?", views: "35", type: isEn ? "Video" : "Видео", url: "https://www.youtube.com/watch?v=gYpBBg6APUU" },
    { title: isEn ? "Abstinence — Benefit or Harm?" : "Воздержание — польза или вред?", views: "118", type: isEn ? "Video" : "Видео", url: "https://www.youtube.com/watch?v=vN8wyhRk6j0" },
    { title: isEn ? "Why Is the Hand Worse Than a Woman? Clinical Explanation" : "Почему рука хуже женщины? Клиническое объяснение", views: "109", type: isEn ? "Video" : "Видео", url: "https://www.youtube.com/watch?v=VVvR_FhiDSI" },
    { title: isEn ? "Unboxing! What Makes a Doctor Happy? My Lifehack" : "Распаковка! Что обрадует доктора? Мой лайфхак", views: "42", type: isEn ? "Video" : "Видео", url: "https://www.youtube.com/watch?v=Sv4BxFxm2Ao" },
    { title: isEn ? "How to Teach a Boy to Urinate Standing Up?" : "Как научить мальчика писать стоя?", views: "—", type: isEn ? "Video" : "Видео", url: "https://www.youtube.com/watch?v=yW-S0X0OCVE" }
  ];
  const labirintyEpisodes = isEn ? [
    { title: "Varicocele", date: "Jan 25, 2024" },
    { title: "Urinary Tract Infections in Children: Pediatrician & Nephrologist View", date: "2024" },
    { title: "Pediatric Andrology: Torsions", date: "2024" },
    { title: "Diagnosis and Approaches to Crystalluria Therapy in Children", date: "2024" },
    { title: "Enuresis as a Manifestation of Comorbid Conditions", date: "Apr 15, 2025" },
    { title: "Urology Service Report of Moscow Healthcare Dept for 2024", date: "May 20, 2025" },
    { title: "Megaureter in Children: Etiology, Diagnosis, Tactics", date: "Jun 24, 2025" }
  ] : [
    { title: "Варикоцеле", date: "25.01.2024" },
    { title: "Инфекции мочевой системы у детей с позиции педиатра и нефролога", date: "2024" },
    { title: "Детская андрология: Перекруты", date: "2024" },
    { title: "Диагностика и подходы к терапии кристаллурии у детей", date: "2024" },
    { title: "Энурез как проявление коморбидных состояний", date: "15.04.2025" },
    { title: "Отчет урологической службы ДЗМ за 2024 год", date: "20.05.2025" },
    { title: "Мегауретер у детей: этиология, диагностика, тактика", date: "24.06.2025" }
  ];
  const schools = isEn ? [
    { name: "XIII School", year: "2025", date: "April 3–4", location: "Moscow, Izmailovo Hotel" },
    { name: "XII School", year: "2024", date: "April 4–5", note: "Dedicated to N.A. Lopatkin's 100th Anniversary" },
    { name: "XI School", year: "2023", date: "April 6–7", location: "Moscow, Izmailovo Hotel" },
    { name: "X School", year: "2022", date: "—", note: "Jubilee school" },
    { name: "III School", year: "2015", date: "May 28–30", note: "ESPU Course (European Society for Paediatric Urology)" }
  ] : [
    { name: "XIII Школа", year: "2025", date: "3-4 апреля", location: "Москва, гостиница Измайлово" },
    { name: "XII Школа", year: "2024", date: "4-5 апреля", note: "Посвящена 100-летию Н.А. Лопаткина" },
    { name: "XI Школа", year: "2023", date: "6-7 апреля", location: "Москва, гостиница Измайлово" },
    { name: "X Школа", year: "2022", date: "—", note: "Юбилейная школа" },
    { name: "III Школа", year: "2015", date: "28-30 мая", note: "Курс ESPU (Европейская ассоциация детских урологов)" }
  ];
  return /* @__PURE__ */ jsx(AgeConfirmationModal, { children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx(
      PageMeta,
      {
        title: isEn ? "For Doctors — Prof. Tarusin D.I." : "Для врачей — Проф. Тарусин Д.И.",
        description: isEn ? "Scientific publications, video lectures, and educational materials for colleagues from Professor Tarusin D.I." : "Научные публикации, видеолекции и образовательные материалы для коллег от профессора Тарусина Д.И.",
        path: "/for-doctors"
      }
    ),
    /* @__PURE__ */ jsx("header", { className: "bg-primary text-primary-foreground py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        isEn ? "Home" : "На главную"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-5xl font-bold mb-4", children: isEn ? "For Doctors" : "Для врачей" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-primary-foreground/80 max-w-2xl", children: isEn ? "Scientific publications, video lectures, and educational materials for colleagues" : "Научные публикации, видеолекции и образовательные материалы для коллег" })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 py-12 md:py-16", children: [
      /* @__PURE__ */ jsx("section", { className: "mb-16", children: /* @__PURE__ */ jsx(Card, { className: "bg-secondary border-none", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8 md:p-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-6 mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Award, { className: "w-8 h-8 text-primary-foreground" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground mb-4", children: isEn ? "Professor Tarusin Dmitry Igorevich" : "Профессор Тарусин Дмитрий Игоревич" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground mb-4", children: isEn ? "Doctor of Medical Sciences (since 2005), Professor, Corresponding Member of RANS, Highest Category Physician. In 2003, together with Professor Kazanskaya I.V., established the new medical specialty 'Pediatric Urology-Andrology' in Russia." : "Доктор медицинских наук (с 2005), профессор, член-корреспондент РАЕН, врач высшей категории. В 2003 году совместно с профессором Казанской И.В. организовал новую медицинскую специальность «детская урология-андрология» в России." }),
            /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-4 gap-4 mt-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-background rounded-lg p-4 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary", children: "126+" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: isEn ? "Scientific articles" : "Научных статей" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-background rounded-lg p-4 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary", children: "6" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: isEn ? "National guideline chapters" : "Глав в нац. руководствах" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-background rounded-lg p-4 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary", children: "860+" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: isEn ? "Presentations" : "Выступлений" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-background rounded-lg p-4 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-primary", children: "9+" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: isEn ? "PhD candidates" : "Кандидатов наук" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-foreground mb-4", children: isEn ? "Key Topics and Presentation Areas" : "Основные направления и темы выступлений" }),
          /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: specializations.map((spec, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 bg-background rounded-lg p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: spec })
          ] }, index)) })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx("section", { className: "mb-16", children: /* @__PURE__ */ jsx(Card, { className: "bg-accent/10 border-accent/30", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-8 md:p-12", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx(BookOpen, { className: "w-10 h-10 text-accent" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-foreground", children: isEn ? '"Labyrinths of Pediatric Urology" Project' : "Проект «Лабиринты детской урологии»" }),
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: isEn ? "Author's educational project (since 2024)" : "Авторский образовательный проект (с 2024 года)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              className: "bg-accent hover:bg-accent/90 text-accent-foreground",
              onClick: () => window.open("https://uroweb.ru/news/tarusin-d-i-priglashaet-prisoedinitsya-k-novomu-proektu-labirinti-detskoy-urologii", "_blank"),
              children: [
                /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 mr-2" }),
                isEn ? "Join" : "Присоединиться"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4", children: labirintyEpisodes.map((episode, index) => /* @__PURE__ */ jsxs("div", { className: "bg-background rounded-lg p-4 border border-border", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm text-primary font-medium mb-1", children: episode.date }),
          /* @__PURE__ */ jsx("div", { className: "font-medium text-foreground", children: episode.title })
        ] }, index)) })
      ] }) }) }),
      /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "National School of Pediatric Urology-Andrology" : "Всероссийская школа по детской урологии-андрологии" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: isEn ? "Co-chair of the annual school since 2012" : "Сопредседатель ежегодной школы с 2012 года" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4", children: schools.map((school, index) => /* @__PURE__ */ jsx(Card, { className: "hover:shadow-lg transition-shadow", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-5 h-5 text-primary" }),
            /* @__PURE__ */ jsxs("span", { className: "font-bold text-foreground", children: [
              school.name,
              " (",
              school.year,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-1", children: school.date }),
          school.location && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: school.location }),
          school.note && /* @__PURE__ */ jsx("p", { className: "text-sm text-primary mt-2", children: school.note })
        ] }) }, index)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(FileText, { className: "w-6 h-6 text-primary" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "Publications & Articles" : "Публикации и статьи" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: publications.map((pub, index) => /* @__PURE__ */ jsxs(Card, { className: "group hover:shadow-lg transition-shadow", children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded w-fit mb-2", children: [
              /* @__PURE__ */ jsx(FileText, { className: "w-3 h-3" }),
              pub.type
            ] }),
            /* @__PURE__ */ jsx(CardTitle, { className: "text-lg group-hover:text-primary transition-colors", children: pub.title })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: pub.description }),
            /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "w-full", onClick: () => window.open(pub.url, "_blank"), children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 mr-2" }),
              isEn ? "Open" : "Открыть"
            ] })
          ] })
        ] }, index)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Video, { className: "w-6 h-6 text-accent" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "Video Lectures on Uro.TV" : "Видеолекции на Uro.TV" }),
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: isEn ? "22 reports, 21,000+ views" : "22 доклада, 21 000+ просмотров" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => window.open("https://uro.tv/speaker2021/tarusin_dmitriy_igorevich", "_blank"), className: "hidden md:flex", children: [
            /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 mr-2" }),
            isEn ? "All Presentations" : "Все выступления"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4", children: videoLectures.map((lecture, index) => /* @__PURE__ */ jsx("a", { href: lecture.url, target: "_blank", rel: "noopener noreferrer", className: "block group", children: /* @__PURE__ */ jsx(Card, { className: "h-full cursor-pointer hover:shadow-lg transition-all hover:border-primary/50", children: /* @__PURE__ */ jsx(CardContent, { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent transition-colors", children: /* @__PURE__ */ jsx(Play, { className: "w-4 h-4 text-accent group-hover:text-accent-foreground" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-medium text-foreground group-hover:text-primary transition-colors text-sm leading-tight mb-2", children: lecture.title }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { children: lecture.year }),
              /* @__PURE__ */ jsx("span", { children: "•" }),
              /* @__PURE__ */ jsxs("span", { children: [
                lecture.views,
                " ",
                isEn ? "views" : "просм."
              ] })
            ] })
          ] })
        ] }) }) }) }, index)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 text-center", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => window.open("https://uro.tv/speaker2021/tarusin_dmitriy_igorevich", "_blank"), children: [
          /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 mr-2" }),
          isEn ? "Watch all 22+ reports on Uro.TV" : "Смотреть все 22+ доклада на Uro.TV"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Youtube, { className: "w-6 h-6 text-red-500" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-foreground", children: isEn ? "YouTube: Professor & Andrology" : "YouTube: Профессор и Андрология" }),
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: isEn ? "Short videos and answers to common questions" : "Короткие видео и ответы на частые вопросы" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => window.open("https://www.youtube.com/@androlog_di", "_blank"), className: "hidden md:flex border-red-500/30 text-red-600 hover:bg-red-50", children: [
            /* @__PURE__ */ jsx(Youtube, { className: "w-4 h-4 mr-2" }),
            isEn ? "Subscribe" : "Подписаться"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4", children: youtubeVideos.map((video, index) => /* @__PURE__ */ jsx("a", { href: video.url, target: "_blank", rel: "noopener noreferrer", className: "block group", children: /* @__PURE__ */ jsx(Card, { className: "h-full cursor-pointer hover:shadow-lg transition-all hover:border-red-500/50", children: /* @__PURE__ */ jsx(CardContent, { className: "p-5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500 transition-colors", children: /* @__PURE__ */ jsx(Play, { className: "w-4 h-4 text-red-500 group-hover:text-white" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-medium text-foreground group-hover:text-red-600 transition-colors text-sm leading-tight mb-2", children: video.title }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1 bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium", children: video.type }),
              /* @__PURE__ */ jsxs("span", { children: [
                video.views,
                " ",
                isEn ? "views" : "просм."
              ] })
            ] })
          ] })
        ] }) }) }) }, index)) }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 text-center", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "border-red-500/30 text-red-600 hover:bg-red-50", onClick: () => window.open("https://www.youtube.com/@androlog_di", "_blank"), children: [
          /* @__PURE__ */ jsx(Youtube, { className: "w-4 h-4 mr-2" }),
          isEn ? "Watch all videos on YouTube" : "Смотреть все видео на YouTube"
        ] }) })
      ] })
    ] })
  ] }) });
};
export {
  ForDoctors as default
};
