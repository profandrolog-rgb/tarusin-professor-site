import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { useTranslation } from "react-i18next";

const Consent = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={isEn ? "Data Processing Consent — Prof. Tarusin D.I." : "Согласие на обработку данных — Проф. Тарусин Д.И."}
        description={isEn ? "Consent to personal data processing on the website of Professor Tarusin D.I." : "Согласие на обработку персональных данных на сайте профессора Тарусина Д.И."}
        path="/consent"
      />
      <Header />
      <main className="pt-20 md:pt-24">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
              {isEn ? "Consent to Personal Data Processing" : "Согласие на обработку персональных данных"}
            </h1>
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
              {isEn ? (
                <>
                  <p>I hereby, acting freely, of my own will and in my own interest, give consent to the processing of my personal data to Professor Tarusin Dmitry Igorevich (hereinafter — the "Operator").</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">1. Personal Data</h2>
                  <p>Full name; phone number; email address; child's age; description of the problem/inquiry.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">2. Purposes of Processing</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Processing consultation requests</li>
                    <li>Contacting the patient to clarify inquiry details</li>
                    <li>Scheduling appointments</li>
                    <li>Maintaining internal inquiry statistics</li>
                  </ul>
                  <h2 className="text-xl font-semibold text-foreground mt-8">3. Methods of Processing</h2>
                  <p>Collection, recording, systematization, accumulation, storage, clarification (updating, modification), extraction, use, transfer (provision, access), anonymization, blocking, deletion, destruction — both with and without automation tools.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">4. Consent Duration</h2>
                  <p>This consent is valid from the moment of provision until withdrawn. Consent may be revoked by sending a written notification to the contact details provided on the website.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">5. Legal Basis</h2>
                  <p>Personal data processing is carried out in accordance with applicable data protection legislation.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">6. Contact Information</h2>
                  <p>For questions about personal data processing, please call +7 (926) 600-555-0 or use the contact form on the website.</p>
                </>
              ) : (
                <>
                  <p>Настоящим я, действуя свободно, своей волей и в своём интересе, даю согласие на обработку моих персональных данных профессору Тарусину Дмитрию Игоревичу (далее — «Оператор»).</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">1. Перечень персональных данных</h2>
                  <p>Фамилия, имя, отчество; номер телефона; адрес электронной почты; возраст ребёнка; описание проблемы/обращения.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">2. Цели обработки</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Обработка заявки на консультацию</li>
                    <li>Связь с пациентом для уточнения деталей обращения</li>
                    <li>Запись на приём</li>
                    <li>Ведение внутренней статистики обращений</li>
                  </ul>
                  <h2 className="text-xl font-semibold text-foreground mt-8">3. Способы обработки</h2>
                  <p>Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача (предоставление, доступ), обезличивание, блокирование, удаление, уничтожение — как с использованием средств автоматизации, так и без.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">4. Срок действия согласия</h2>
                  <p>Настоящее согласие действует с момента его предоставления и до момента отзыва. Согласие может быть отозвано путём направления письменного уведомления по контактным данным, указанным на сайте.</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">5. Правовая основа</h2>
                  <p>Обработка персональных данных осуществляется в соответствии с Федеральным законом от 27.07.2006 №&nbsp;152-ФЗ «О персональных данных».</p>
                  <h2 className="text-xl font-semibold text-foreground mt-8">6. Контактная информация</h2>
                  <p>По вопросам обработки персональных данных обращайтесь по телефону +7&nbsp;(926)&nbsp;600-555-0 или через форму обратной связи на сайте.</p>
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

export default Consent;
