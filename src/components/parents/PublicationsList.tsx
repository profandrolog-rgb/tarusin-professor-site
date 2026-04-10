import { useState, useMemo } from "react";
import { ExternalLink, Search, Filter, SortAsc, SortDesc } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Category =
  | "varicocele"
  | "cryptorchidism"
  | "hydrocele"
  | "foreskin"
  | "hypospadias"
  | "puberty"
  | "ultrasound"
  | "reproductive"
  | "psychology"
  | "organization"
  | "acute"
  | "microlithiasis"
  | "asur"
  | "monograph"
  | "guidelines";

const categoryLabels: Record<Category, string> = {
  varicocele: "Варикоцеле",
  cryptorchidism: "Крипторхизм",
  hydrocele: "Гидроцеле / ВОБ / Сперматоцеле",
  foreskin: "Крайняя плоть",
  hypospadias: "Гипоспадия / аномалии",
  puberty: "Половое развитие / пубертат",
  ultrasound: "УЗ-диагностика",
  reproductive: "Репродуктивное здоровье",
  psychology: "Психология / сексология",
  organization: "Организация специальности",
  acute: "Острые состояния мошонки",
  microlithiasis: "Тестикулярный микролитиаз",
  asur: "Конференции АСУР",
  monograph: "Монография / диссертация",
  guidelines: "Главы в руководствах",
};

const publications = [
  { n: 1, title: "Методика микрохирургической варикоцелэктомии с сохранением лимфатических сосудов у детей", authors: "Тарусин Д.И., Задыкян С.С.", source: "Андрология и генитальная хирургия. — 2001. — Приложение. — С. 45", year: "2001", categories: ["varicocele"] as Category[] },
  { n: 2, title: "Ультразвуковая допплерография органов репродуктивной системы у мальчиков", authors: "Тарусин Д.И., Быковский В.А.", source: "Российский вестник перинатологии и педиатрии. — 2001", year: "2001", categories: ["ultrasound"] as Category[] },
  { n: 3, title: "Ранние исследования по спермиологии подростков", authors: "Тарусин Д.И., Бухтуев А.Д., Корякин М.В.", source: "Андрология и генитальная хирургия. — 2001. — Приложение", year: "2001", categories: ["reproductive"] as Category[] },
  { n: 4, title: "Репродуктивное здоровье мальчиков и юношей-подростков (глава в руководстве)", authors: "Тарусин Д.И.", source: "В кн.: Руководство по охране репродуктивного здоровья / под ред. Кулакова В.И., Серова В.Н. — М., 2003", year: "2003", categories: ["monograph", "guidelines"] as Category[] },
  { n: 5, title: "Детская уроандрология в системе охраны здоровья детей", authors: "Тарусин Д.И., Казанская И.В., Окулов А.Б.", source: "Приказ МЗ РФ № 404 от 12.08.2003 г.", year: "2003", categories: ["organization"] as Category[] },
  { n: 6, title: "Крипторхизм. Классификация, диагностика, тактика лечения", authors: "Казанская И.В., Григорьев К.И., Тарусин Д.И., Окулов А.Б.", source: "Педиатрия. — 2004", year: "2004", categories: ["cryptorchidism"] as Category[] },
  { n: 7, title: "Организация уроандрологической помощи в детской поликлинике", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2004", categories: ["organization"] as Category[] },
  { n: 8, title: "Кандидатская диссертация", authors: "Тарусин Д.И.", source: "Кандидатская диссертация. НИИ детской гематологии МЗ РФ, Москва", year: "2000", categories: ["monograph"] as Category[] },
  { n: 9, title: "Факторы риска репродуктивных расстройств у мальчиков и юношей-подростков", authors: "Тарусин Д.И.", source: "Докторская диссертация. РГМУ, Москва", year: "2005", url: "https://medical-diss.com/medicina/faktory-riska-reproduktivnyh-rasstroystv-u-malchikov-i-yunoshey-podrostkov", categories: ["monograph"] as Category[] },
  { n: 9, title: "Детская урология-андрология. Глава в национальном руководстве по педиатрии", authors: "Тарусин Д.И., Казанская И.В.", source: "Национальное руководство по педиатрии. — М.: ГЭОТАР-Медиа, 2005", year: "2005", categories: ["guidelines"] as Category[] },
  { n: 10, title: "Детская уроандрология в системе охраны здоровья", authors: "Окулов А.Б., Казанская И.В., Тарусин Д.И.", source: "Андрология и генитальная хирургия. — 2005. — № 3. — С. 55–58", year: "2005", categories: ["organization", "varicocele"] as Category[] },
  { n: 11, title: "Воспалительные заболевания в детской андрологической практике", authors: "Тарусин Д.И., Садчиков С.С.", source: "Лечащий врач. — 2005. — № 10", year: "2005", url: "https://www.lvrach.ru/2005/10/4533235", categories: ["foreskin"] as Category[] },
  { n: 12, title: "Организация анестезиологической помощи детям в амбулаторной хирургической практике", authors: "Тарусин Д.И., Петрова Ж.И., Курилова Е.С. и др.", source: "Анестезиология и реаниматология. — 2006. — PMID: 16613048", year: "2006", url: "https://pubmed.ncbi.nlm.nih.gov/16613048/", categories: ["ultrasound", "organization"] as Category[] },
  { n: 13, title: "Диспансерное наблюдение мальчиков с заболеваниями репродуктивной системы", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2006", categories: ["organization"] as Category[] },
  { n: 14, title: "Эпидемиология заболеваний репродуктивной системы у мальчиков Москвы", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2007", categories: ["organization"] as Category[] },
  { n: 15, title: "Девиации кавернозных тел полового члена у подростков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2007", categories: ["hypospadias"] as Category[] },
  { n: 16, title: "Организация уроандрологической службы для детей. Глава в национальном руководстве", authors: "Тарусин Д.И.", source: "Национальное руководство по детской хирургии. — М.: ГЭОТАР-Медиа, 2008", year: "2008", categories: ["guidelines"] as Category[] },
  { n: 17, title: "Инфекции, передаваемые половым путём, у подростков-урологических пациентов", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2008", categories: ["reproductive"] as Category[] },
  { n: 18, title: "Пособие по обследованию состояния репродуктивной системы детей и подростков", authors: "Уварова Е.В., Тарусин Д.И.", source: "М.: МИА, 2009. — 232 с.", year: "2009", url: "https://hum-ecol.ru/1728-0869/article/view/42420", categories: ["ultrasound"] as Category[] },
  { n: 19, title: "Оценка репродуктивного прогноза при заболеваниях вагинального отростка брюшины", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2009", categories: ["hydrocele"] as Category[] },
  { n: 20, title: "Заболевания репродуктивной системы у мальчиков (глава)", authors: "Тарусин Д.И.", source: "Национальное руководство по детской урологии-андрологии. — М., 2010", year: "2010", categories: ["guidelines"] as Category[] },
  { n: 21, title: "Иммунологические аспекты мужского бесплодия в педиатрической практике", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2010", categories: ["reproductive"] as Category[] },
  { n: 22, title: "Клиническое значение кист придатка яичка у мальчиков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2010", categories: ["hydrocele"] as Category[] },
  { n: 23, title: "Хирургическое лечение сперматоцеле у подростков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2011", categories: ["hydrocele"] as Category[] },
  { n: 24, title: "Варикоцеле и тестикулярный микролитиаз у детей (глава)", authors: "Тарусин Д.И.", source: "Национальное руководство по урологии / под ред. Лопаткина Н.А. — М.: ГЭОТАР-Медиа, 2012", year: "2012", categories: ["guidelines", "varicocele"] as Category[] },
  { n: 25, title: "Гормональная терапия при задержке полового развития у мальчиков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2012", categories: ["puberty"] as Category[] },
  { n: 26, title: "Ранние хирургические вмешательства при крипторхизме и их влияние на фертильность", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2012", categories: ["cryptorchidism"] as Category[] },
  { n: 27, title: "Детская урология в Российской Федерации: путь, достижения, перспективы", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2013", year: "2013", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["organization"] as Category[] },
  { n: 28, title: "Реорганизация здравоохранения — новые вызовы к порядку и качеству уроандрологической помощи детям", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2013", year: "2013", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["organization"] as Category[] },
  { n: 29, title: "Частно-государственное партнёрство в детской урологии-андрологии", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2013", year: "2013", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["organization"] as Category[] },
  { n: 30, title: "Микроциркуляция в тканях яичка и её нарушения при варикоцеле", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2013", categories: ["varicocele"] as Category[] },
  { n: 31, title: "Диагностика перекрута яичка в педиатрической практике", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2014", categories: ["acute"] as Category[] },
  { n: 32, title: "Охрана репродуктивного здоровья мальчиков (глава в руководстве)", authors: "Тарусин Д.И., Окулов А.Б., Казанская И.В.", source: "Национальное руководство по детской урологии-андрологии. Изд. 2-е. — М., 2015", year: "2015", url: "https://online.zakon.kz/Document/?doc_id=30439112", categories: ["guidelines"] as Category[] },
  { n: 33, title: "IV съезд детских урологов-андрологов. Резолюция (соавтор)", authors: "Казанская И.В., Тарусин Д.И., Файзулин А.К. и др.", source: "CyberLeninka / Детская хирургия. — 2015", year: "2015", url: "https://cyberleninka.ru/article/n/17518011.pdf", categories: ["organization"] as Category[] },
  { n: 34, title: "Тестостерон и его роль в развитии репродуктивной системы мальчиков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2015", categories: ["puberty"] as Category[] },
  { n: 35, title: "Новые аппаратные технологии в детской урологии-андрологии", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2015", categories: ["organization"] as Category[] },
  { n: 36, title: "Задержка полового развития мальчиков: когда надо беспокоиться? (интервью)", authors: "Тарусин Д.И.", source: "Uro.TV. Видеоинтервью. — 2016", year: "2016", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["puberty"] as Category[] },
  { n: 37, title: "Половое созревание мальчиков: норма и патология", authors: "Тарусин Д.И.", source: "АиФ. Здоровье / Аргументы и Факты. — 2016", year: "2016", url: "https://aif.ru/opinion/author/13585", categories: ["puberty"] as Category[] },
  { n: 38, title: "Конгестивная простатопатия у подростков с варикоцеле", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2016", categories: ["varicocele"] as Category[] },
  { n: 39, title: "Варикоцеле, тестикулярный микролитиаз и сочетанная патология у подростков (тезисы)", authors: "Тарусин Д.И. и соавт.", source: "IX Московский городской съезд педиатров. Тезисы. — М., 2017", year: "2017", categories: ["microlithiasis", "varicocele"] as Category[] },
  { n: 40, title: "Варикоцеле и тестикулярный микролитиаз у детей школьного возраста: распространённость и клиническое значение", authors: "Тарусин Д.И. и соавт.", source: "Вестник урологии. — 2017. — № 4", year: "2017", categories: ["varicocele", "microlithiasis"] as Category[] },
  { n: 41, title: "Операция Murmur в собственной оригинальной модификации у детей. 8 лет опыта", authors: "Тарусин Д.И., Жидков М.В., Тарусин В.Д. и др.", source: "VII Всероссийская Школа. Тезисы. — М., 2018", year: "2018", url: "https://uroweb.ru/sites/default/files/tezisi-det-shkola-2018.pdf", categories: ["varicocele"] as Category[] },
  { n: 42, title: "Сонографические критерии венозной недостаточности при левостороннем варикоцеле у детей", authors: "Тарусин Д.И., Жидков М.В. и др.", source: "VII Всероссийская Школа. Тезисы. — М., 2018", year: "2018", url: "https://uroweb.ru/sites/default/files/tezisi-det-shkola-2018.pdf", categories: ["varicocele"] as Category[] },
  { n: 43, title: "Крайняя плоть — бескрайняя", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2018", year: "2018", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["foreskin"] as Category[] },
  { n: 44, title: "Ультразвуковая диагностика острых заболеваний органов мошонки", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2018", year: "2018", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["ultrasound", "acute"] as Category[] },
  { n: 45, title: "Детская и подростковая андрология (интервью)", authors: "Тарусин Д.И.", source: "Uro.TV. Видеоинтервью. — 2018", year: "2018", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["puberty"] as Category[] },
  { n: 46, title: "Орхопексия: сравнение методик при различных формах крипторхизма", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2018", categories: ["cryptorchidism"] as Category[] },
  { n: 47, title: "Ультразвуковая диагностика в детской урологии-андрологии (глава)", authors: "Тарусин Д.И.", source: "Национальное руководство по ультразвуковой диагностике. — М., 2019", year: "2019", categories: ["guidelines", "ultrasound"] as Category[] },
  { n: 48, title: "Стратегия и тактика диагностики и лечения варикоцеле у детей и подростков", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2019", year: "2019", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["varicocele"] as Category[] },
  { n: 49, title: "Болезни крайней плоти: новые морфологические данные о структуре патологических процессов", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2019", year: "2019", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["foreskin"] as Category[] },
  { n: 50, title: "Лимфатический отёк после операции по поводу варикоцеле. Диагностика и лечение", authors: "Тарусин Д.И.", source: "Андрология и генитальная хирургия. — 2019", year: "2019", categories: ["hydrocele", "varicocele"] as Category[] },
  { n: 51, title: "Неотложные состояния в детской урологии-андрологии", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2017", year: "2017", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["acute"] as Category[] },
  { n: 52, title: "Андрология детского возраста", authors: "Тарусин Д.И.", source: "Медиаметрикс. Радио. — 2019", year: "2019", url: "https://mediametrics.ru/articles/view.html?id=60788", categories: ["reproductive"] as Category[] },
  { n: 53, title: "Ошибки, опасности и юридические стратегии в повседневной практике детского уролога-андролога", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2019", year: "2019", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["organization"] as Category[] },
  { n: 54, title: "Хирургический дневной стационар детской многопрофильной больницы", authors: "Корочкин М.В., Кравчук С.В., Поддубный Г.С. и др.", source: "Проблемы социальной гигиены. — 2019. — PMID: 31747150", year: "2019", url: "https://pubmed.ncbi.nlm.nih.gov/31747150/", categories: ["organization"] as Category[] },
  { n: 55, title: "Психологические аспекты расстройств полового развития у мальчиков-подростков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2019", categories: ["psychology"] as Category[] },
  { n: 56, title: "Нарушения эрекции у подростков: диагностика и коррекция", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2019", categories: ["psychology"] as Category[] },
  { n: 57, title: "Очаговые и диффузные поражения ткани яичка у детей и подростков. Тестикулярный микролитиаз", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2020", year: "2020", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["microlithiasis"] as Category[] },
  { n: 58, title: "Проблема репродуктивного здоровья подростков мужского пола: комплексный взгляд", authors: "Тарусин Д.И.", source: "Медицинский совет. — 2020", year: "2020", categories: ["reproductive"] as Category[] },
  { n: 59, title: "Сонография органов мошонки у детей и подростков: нормативные показатели", authors: "Тарусин Д.И., Жидков М.В.", source: "Ультразвуковая и функциональная диагностика. — 2020", year: "2020", categories: ["ultrasound"] as Category[] },
  { n: 60, title: "Мочеиспускательные дисфункции у мальчиков", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2020", categories: ["psychology"] as Category[] },
  { n: 61, title: "Варикоцеле. Ab ovo ad absurdum", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2021", year: "2021", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["varicocele"] as Category[] },
  { n: 62, title: "Варикоцеле: от ребёнка к взрослому. Необычно об обычном (круглый стол)", authors: "Тарусин Д.И. и соавт.", source: "Uro.TV. Видеотрансляция. — 2021", year: "2021", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["varicocele"] as Category[] },
  { n: 63, title: "Андрология и пубертат: опыт 20 лет", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2021", categories: ["reproductive"] as Category[] },
  { n: 64, title: "Поздние осложнения оперативного лечения гипоспадии", authors: "Тарусин Д.И.", source: "eLibrary.ru / РИНЦ", year: "2021", categories: ["hypospadias"] as Category[] },
  { n: 65, title: "Группировка исходов оперативного лечения варикоцеле", authors: "Тарусин Д.И., Матар А.А. и др.", source: "X Юбилейная Всероссийская Школа. Тезисы. — М., 2022. — С. 67", year: "2022", url: "https://uroweb.ru/sites/default/files/TEZIS_2022.pdf", categories: ["varicocele"] as Category[] },
  { n: 66, title: "Топическая диагностика венозной недостаточности в системе оттока от левого яичка", authors: "Тарусин Д.И., Матар А.А. и др.", source: "X Юбилейная Всероссийская Школа. Тезисы. — М., 2022. — С. 70", year: "2022", url: "https://uroweb.ru/sites/default/files/TEZIS_2022.pdf", categories: ["varicocele"] as Category[] },
  { n: 67, title: "Гидролимфоцеле. Памяти профессора А.П. Ерохина", authors: "Тарусин Д.И., Жидков М.В. и др.", source: "XI Всероссийская Школа. Тезисы. — М., 2023", year: "2023", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2023.pdf", categories: ["hydrocele"] as Category[] },
  { n: 68, title: "Грыжевой мешок — так ли все безобидно?", authors: "Тарусин Д.И., Матар А.А. и др.", source: "X Юбилейная Всероссийская Школа. Тезисы. — М., 2022. — С. 72", year: "2022", url: "https://uroweb.ru/sites/default/files/TEZIS_2022.pdf", categories: ["hydrocele"] as Category[] },
  { n: 69, title: "Операция Е.А. Ефремова в детской уроандрологической практике. Анонс", authors: "Середницкая Н.А., Тарусин Д.И. и др.", source: "X Юбилейная Всероссийская Школа. Тезисы. — М., 2022. — С. 69", year: "2022", url: "https://uroweb.ru/sites/default/files/TEZIS_2022.pdf", categories: ["reproductive"] as Category[] },
  { n: 70, title: "Симбиоз детского и взрослого уролога как фундамент мужского здоровья", authors: "Коршунов М.Н., Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2022", year: "2022", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["organization"] as Category[] },
  { n: 71, title: "Варикоцеле: современный взгляд на классификацию и лечение у детей", authors: "Тарусин Д.И.", source: "Детская хирургия. — 2022", year: "2022", categories: ["varicocele"] as Category[] },
  { n: 72, title: "Микрохирургическая варикоцелэктомия с использованием индигокармина", authors: "Тарусин Д.И., Матар А.А.", source: "eLibrary.ru / РИНЦ", year: "2022", categories: ["varicocele"] as Category[] },
  { n: 73, title: "Простатопатия у пациентов с варикоцеле — миф или реальность?", authors: "Тарусин Д.И., Жидков М.В. и др.", source: "XI Всероссийская Школа. Тезисы. — М., 2023", year: "2023", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2023.pdf", categories: ["varicocele"] as Category[] },
  { n: 74, title: "Варикоцеле. To be or not to beat (доклад-обзор)", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2024", year: "2024", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["varicocele"] as Category[] },
  { n: 75, title: "«Double Decker» пластика крайней плоти", authors: "Тарусин Д.И., Середницкая Н.А. и др.", source: "XI Всероссийская Школа. Тезисы. — М., 2023", year: "2023", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2023.pdf", categories: ["foreskin"] as Category[] },
  { n: 76, title: "Лимфангиома мошонки (клиническое наблюдение)", authors: "Сафин Д.А., Тарусин Д.И., Матар А.А.", source: "Урология (Urologiia). — 2023. — № 2. — С. 107–110. DOI: 10.18565/urology.2023.2.107-110", year: "2023", url: "https://urologyjournal.ru/ru/archive/article/42874", categories: ["acute"] as Category[] },
  { n: 77, title: "Армагеддон в андрологии: последствия ошибок лечения", authors: "Тарусин Д.И.", source: "Uro.TV / UroWeb.ru. Трансляция. — 2023", year: "2023", url: "https://uroweb.ru/news/tarusin-di---armageddon-v-andrologii-posledstviya-oshibok-lecheniya", categories: ["organization"] as Category[] },
  { n: 78, title: "Психогенные нарушения мочеиспускания у детей", authors: "Тарусин Д.И. и соавт.", source: "XII Всероссийская Школа. Тезисы. — М., 2024", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["psychology"] as Category[] },
  { n: 79, title: "Современные методы диагностики и лечения сосудистых аномалий урогенитальной области", authors: "Тарусин Д.И., Матар А.А. и др.", source: "10-я Школа АСУР. — Севастополь, 2023", year: "2023", url: "https://uroweb.ru/sites/default/files/programma_asur.pdf", categories: ["asur"] as Category[] },
  { n: 80, title: "Варикоцеле у детей (доклад на конгрессе АСУР)", authors: "Тарусин Д.И.", source: "VII Конгресс АСУР. — М., 2023", year: "2023", categories: ["asur", "varicocele"] as Category[] },
  { n: 81, title: "Заболевания крайней плоти и головки полового члена у детей", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2024", year: "2024", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["foreskin"] as Category[] },
  { n: 82, title: "Острые и хронические заболевания крайней плоти у детей", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2024", year: "2024", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["foreskin"] as Category[] },
  { n: 83, title: "Проблема баланопостита у детей", authors: "Тарусин Д.И., Матар А.А. и др.", source: "XII Всероссийская Школа. Тезисы. — М., 2024. — С. 14", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["foreskin"] as Category[] },
  { n: 84, title: "Типичные ошибки в диагностике непальпируемого яичка", authors: "Тарусин Д.И., Жидков М.В. и др.", source: "XII Всероссийская Школа. Тезисы. — М., 2024. — С. 17", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["cryptorchidism"] as Category[] },
  { n: 85, title: "Клиническое наблюдение — полное удвоение уретры при гипоспадии", authors: "Матар А.А., Середницкая Н.А., Тарусин Д.И. и др.", source: "XII Всероссийская Школа. Тезисы. — М., 2024. — С. 18", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["hypospadias"] as Category[] },
  { n: 86, title: "Клиническое наблюдение — полное удвоение уретры при гипоспадии (видеодоклад)", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2024", year: "2024", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["hypospadias"] as Category[] },
  { n: 87, title: "Паттерн ночной эрекции — что, зачем, почему?", authors: "Тарусин Д.И., Матар А.А. и др.", source: "XII Всероссийская Школа. Тезисы. — М., 2024. — С. 13", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["reproductive"] as Category[] },
  { n: 88, title: "Новое слово в лечении дисфункции мышц тазового дна и ассоциированных с ним расстройств", authors: "Тарусин Д.И., Матар А.А. и др.", source: "XII Всероссийская Школа. Тезисы. — М., 2024. — С. 11", year: "2024", url: "https://uroweb.ru/sites/default/files/TEZIS_det_shkola_2024.pdf", categories: ["reproductive"] as Category[] },
  { n: 89, title: "Новое слово в лечении дисфункции мышц тазового дна (видеодоклад)", authors: "Тарусин Д.И.", source: "Uro.TV. Видеодоклад. — 2024", year: "2024", url: "https://uro.tv/speaker/tarusin_dmitriy_igorevich", categories: ["reproductive"] as Category[] },
  // --- Дополнительные публикации, найденные при поиске в интернете ---
  { n: 90, title: "Болезнь Боуэна — симптомы и лечение (энциклопедическая статья)", authors: "Тарусин Д.И.", source: "ПроБолезни (probolezny.ru). — 2023", year: "2023", url: "https://probolezny.ru/bolezn-bouena/", categories: ["reproductive"] as Category[] },
  { n: 91, title: "«Проблемой репродуктивного здоровья мальчиков занимались все и никто» (интервью)", authors: "Тарусин Д.И.", source: "Эффективная фармакотерапия. Педиатрия. — № 1", year: "2010", url: "https://umedp.ru/articles/print/1183/", categories: ["organization", "reproductive"] as Category[] },
  { n: 92, title: "Чем Спок взял весь мир? (колонка эксперта)", authors: "Тарусин Д.И.", source: "АиФ. Здоровье / Аргументы и Факты. — 2016", year: "2016", url: "https://aif.ru/health/opinion/chem_spok_vzyal_ves_mir", categories: ["organization"] as Category[] },
  { n: 93, title: "Амбулаторная детская хирургия (интервью, программа «Здоровое детство»)", authors: "Тарусин Д.И.", source: "Медиадоктор / doctor.ru. — 2018", year: "2018", url: "https://doctor.ru/view/54982/", categories: ["organization"] as Category[] },
  { n: 94, title: "Андрология детского возраста (интервью, программа «Здоровое детство»)", authors: "Тарусин Д.И.", source: "Медиадоктор / doctor.ru. — 2019", year: "2019", url: "https://doctor.ru/view/60788/", categories: ["reproductive"] as Category[] },
  // --- Диссертации под руководством Тарусина Д.И. ---
  { n: 95, title: "Синдром рецидивирующих болей внизу живота у мальчиков и подростков (клиническое значение эхографических признаков для дифференциальной диагностики и выбора тактики лечения)", authors: "Аристангалиев М.Т.", source: "Канд. дисс. Науч. рук. проф. Тарусин Д.И. — М., 2004", year: "2004", url: "https://www.dissercat.com/content/sindrom-retsidiviruyushchikh-bolei-vnizu-zhivota-u-malchikov-i-podrostkov-klinicheskoe-znach", categories: ["monograph", "psychology"] as Category[] },
  { n: 96, title: "Диссертация под науч. руководством проф. Тарусина Д.И.", authors: "Задыкян С.С.", source: "Канд. дисс. Науч. рук. проф. Тарусин Д.И.", year: "", categories: ["monograph"] as Category[] },
  { n: 97, title: "Диссертация под науч. руководством проф. Тарусина Д.И.", authors: "Омаров М.Г.", source: "Канд. дисс. Науч. рук. проф. Тарусин Д.И.", year: "", categories: ["monograph"] as Category[] },
  { n: 98, title: "Диссертация под науч. руководством проф. Тарусина Д.И.", authors: "Садчиков С.С.", source: "Канд. дисс. Науч. рук. проф. Тарусин Д.И.", year: "", categories: ["monograph"] as Category[] },
  { n: 99, title: "Диссертация под науч. руководством проф. Тарусина Д.И.", authors: "Винокуров А.А.", source: "Канд. дисс. Науч. рук. проф. Тарусин Д.И.", year: "", categories: ["monograph"] as Category[] },
  // --- I Конгресс РОДУА, 2026 ---
  { n: 100, title: "Глюкокортикостероиды в лечении заболеваний крайней плоти у детей: эффективность, рецидивы и предикторы неудачи терапии", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 52", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["foreskin"] as Category[] },
  { n: 101, title: "Контрастная лимфопресервация при микрохирургическом лигировании вен левого семенного канатика у пациентов с варикоцеле", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 57", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["varicocele"] as Category[] },
  { n: 102, title: "Скрытый половой член: анализ эмбриологических причин патологии и эффективность упрощённой хирургической техники", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 58", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["hypospadias"] as Category[] },
  { n: 103, title: "Гинекомастия и гинеколипомастия у подростков: алгоритм показаний к операции и результаты субареолярной мастэктомии с предварительной тумесцентной липоскацией", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 59", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["puberty"] as Category[] },
  { n: 104, title: "Хроническая боль в мошонке у детей и взрослых: роль патологически изменённых гидатид и результаты хирургического лечения через минидоступ", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 61", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["acute"] as Category[] },
  { n: 105, title: "Микрокисты головки придатка яичка у детей и подростков: тактика обоснованной эскалации лечебной агрессии и показания к микрохирургической энуклеации", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 62", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["hydrocele"] as Category[] },
  { n: 106, title: "Нарушение архитектоники ночного сна как ведущий патогенетический механизм первичного ночного энуреза у детей: клинические маркеры и этапная терапия", authors: "Тарусин Д.И., Матар А.А., Петинати Я.А., Матар С.А., Середницкая Н.А., Жидков М.В., Матар Ах.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 63", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["psychology"] as Category[] },
  { n: 107, title: "Умеют ли делать операцию обрезания? Анализ типичных технических ошибок и их последствий в педиатрической практике", authors: "Тарусин Д.И., Матар А.А.", source: "I Конгресс РОДУА. Тезисы. — М., 2026. — С. 65", year: "2026", url: "https://uroweb.ru/sites/default/files/TEZIS_RODUA2026.pdf", categories: ["foreskin"] as Category[] },
];

const stats = [
  { value: "107", label: "публикаций" },
  { value: "6", label: "глав в руководствах" },
  { value: "2", label: "диссертации (канд. + докт.)" },
  { value: "5", label: "науч. руководство дисс." },
];

const PublicationsList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const years = useMemo(() => {
    const allYears = [...new Set(publications.map((p) => p.year))].sort((a, b) => parseInt(b) - parseInt(a));
    return allYears;
  }, []);

  const usedCategories = useMemo(() => {
    const cats = new Set<Category>();
    publications.forEach((p) => p.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort((a, b) => categoryLabels[a].localeCompare(categoryLabels[b]));
  }, []);

  const filteredPublications = useMemo(() => {
    let result = [...publications];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.source.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categories.includes(selectedCategory as Category));
    }

    result.sort((a, b) => {
      const diff = parseInt(a.year) - parseInt(b.year);
      return sortOrder === "desc" ? -diff : diff;
    });

    return result;
  }, [searchQuery, selectedCategory, sortOrder]);

  const groupedPublications = useMemo(() => {
    return filteredPublications.reduce((acc, pub) => {
      const decade = Math.floor(parseInt(pub.year) / 10) * 10;
      const decadeLabel = `${decade}-е`;
      if (!acc[decadeLabel]) {
        acc[decadeLabel] = [];
      }
      acc[decadeLabel].push(pub);
      return acc;
    }, {} as Record<string, typeof publications>);
  }, [filteredPublications]);

  const sortedDecades = useMemo(() => {
    return Object.keys(groupedPublications).sort((a, b) =>
      sortOrder === "desc" ? parseInt(b) - parseInt(a) : parseInt(a) - parseInt(b)
    );
  }, [groupedPublications, sortOrder]);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="text-center p-4 bg-primary/5 rounded-xl"
          >
            <p className="text-2xl md:text-3xl font-bold text-primary">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Поиск по названию, автору или источнику..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[260px]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Все тематики" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все тематики</SelectItem>
            {usedCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {categoryLabels[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-secondary/50 transition-colors text-sm whitespace-nowrap"
        >
          {sortOrder === "desc" ? (
            <SortDesc className="w-4 h-4" />
          ) : (
            <SortAsc className="w-4 h-4" />
          )}
          {sortOrder === "desc" ? "Сначала новые" : "Сначала старые"}
        </button>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        Найдено: {filteredPublications.length} из {publications.length}
      </p>

      {/* Grouped by decade */}
      {sortedDecades.map((decade) => (
        <div key={decade} className="mb-10">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
            <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm">
              {decade}
            </span>
            <span className="text-muted-foreground text-sm font-normal">
              ({groupedPublications[decade].length})
            </span>
          </h3>
          <div className="space-y-2">
            {groupedPublications[decade].map((pub) => (
              <Card
                key={pub.n}
                className="bg-card hover:bg-secondary/50 transition-colors border-border/50"
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-12 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded text-center">
                      {pub.year}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium text-sm leading-relaxed mb-0.5">
                        {pub.title}
                      </p>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {pub.authors}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mb-1">
                        {pub.source}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {pub.categories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-primary/10"
                            onClick={() => setSelectedCategory(cat)}
                          >
                            {categoryLabels[cat]}
                          </Badge>
                        ))}
                        <span className="flex-1" />
                        {pub.url ? (
                          <a
                            href={pub.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Источник
                          </a>
                        ) : (
                          <a
                            href={`https://elibrary.ru/query_results.asp?search_text=${encodeURIComponent(pub.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
                          >
                            <Search className="w-3 h-3" />
                            Найти в eLibrary
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filteredPublications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Публикации не найдены. Попробуйте изменить параметры поиска.</p>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-8">
        Составлено с использованием открытых источников: PubMed, Uro.TV, UroWeb.ru, CyberLeninka.ru, eLibrary.ru, Google Scholar
      </p>
    </div>
  );
};

export default PublicationsList;
