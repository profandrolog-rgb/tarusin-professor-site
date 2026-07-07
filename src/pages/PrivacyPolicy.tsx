import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { useTranslation } from "react-i18next";

const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={isEn ? "Privacy Policy — Prof. Tarusin D.I." : "Политика конфиденциальности — Проф. Тарусин Д.И."}
        description={isEn ? "Privacy policy of Professor Tarusin D.I.'s website. Protection of patient personal data." : "Политика конфиденциальности сайта профессора Тарусина Д.И. Защита персональных данных пациентов."}
        path="/privacy-policy"
      />
      <Header />
      <main className="pt-20 md:pt-24">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
              {isEn ? "Privacy Policy" : "Политика конфиденциальности"}
            </h1>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
              {isEn ? (
                <>
                  <p>This Privacy Policy defines the procedure for processing and protecting personal data of users of the website of Professor Tarusin Dmitry Igorevich (hereinafter — the "Operator").</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">1. General Provisions</h2>
                  <p>1.1. The Operator ensures the protection of processed personal data from unauthorized access and disclosure in accordance with applicable data protection legislation.</p>
                  <p>1.2. Use of the website constitutes unconditional consent of the user with this Policy and conditions for processing their personal data.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">2. Personal Data Collected</h2>
                  <p>2.1. When filling out the contact form, the user provides: name, email address, phone number, and message text.</p>
                  <p>2.2. Additionally, the following may be automatically collected: IP address, cookies, browser and operating system information.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">3. Purposes of Processing</h2>
                  <p>3.1. Processing consultation requests and providing feedback.</p>
                  <p>3.2. Improving website functionality and quality of services.</p>
                  <p>3.3. Informing about upcoming events and educational programs (with user consent).</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">4. Data Protection</h2>
                  <p>4.1. The Operator takes necessary organizational and technical measures to protect personal data.</p>
                  <p>4.2. Personal data is not shared with third parties, except in cases provided by applicable legislation.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">5. User Rights</h2>
                  <p>5.1. The user has the right to request clarification, blocking, or deletion of their personal data by contacting us through the information provided on the website.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">6. Contact Information</h2>
                  <p>For questions related to personal data processing, please call +7 (495) 303-00-00 or use the contact form on the website.</p>
                </>
              ) : (
                <>
                  <p>Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сайта профессора Тарусина Дмитрия Игоревича (далее — «Оператор»).</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">1. Общие положения</h2>
                  <p>1.1. Оператор обеспечивает защиту обрабатываемых персональных данных от несанкционированного доступа и разглашения в соответствии с Федеральным законом от 27.07.2006 №&nbsp;152-ФЗ «О персональных данных».</p>
                  <p>1.2. Использование сайта означает безоговорочное согласие пользователя с настоящей Политикой и условиями обработки его персональных данных.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">2. Персональные данные, которые обрабатываются</h2>
                  <p>2.1. При заполнении формы обратной связи пользователь предоставляет: имя, адрес электронной почты, номер телефона, текст обращения.</p>
                  <p>2.2. Дополнительно могут автоматически собираться: IP-адрес, данные cookies, информация о браузере и операционной системе.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">3. Цели обработки</h2>
                  <p>3.1. Обработка заявок на консультацию и обратная связь.</p>
                  <p>3.2. Улучшение работы сайта и качества предоставляемых услуг.</p>
                  <p>3.3. Информирование о предстоящих мероприятиях и образовательных программах (с согласия пользователя).</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">4. Защита данных</h2>
                  <p>4.1. Оператор принимает необходимые организационные и технические меры для защиты персональных данных.</p>
                  <p>4.2. Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных законодательством РФ.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">5. Права пользователя</h2>
                  <p>5.1. Пользователь вправе потребовать уточнения, блокирования или уничтожения своих персональных данных, обратившись по контактным данным, указанным на сайте.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">6. Контактная информация</h2>
                  <p>По вопросам, связанным с обработкой персональных данных, обращайтесь по телефону +7&nbsp;(495)&nbsp;303-00-00 или через форму обратной связи на сайте.</p>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
