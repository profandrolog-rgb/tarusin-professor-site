import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";

const Consent = () => (
  <div className="min-h-screen bg-background">
    <PageMeta
      title="Согласие на обработку данных — Проф. Тарусин Д.И."
      description="Согласие на обработку персональных данных на сайте профессора Тарусина Д.И."
      path="/consent"
    />
    <Header />
    <main className="pt-20 md:pt-24">
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Согласие на обработку персональных данных</h1>
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground">
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
            <p>По вопросам обработки персональных данных обращайтесь по телефону +7&nbsp;(495)&nbsp;374-81-81 или через форму обратной связи на сайте.</p>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Consent;
