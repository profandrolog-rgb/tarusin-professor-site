import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyBottomPanel from "@/components/StickyBottomPanel";
import PageMeta from "@/components/PageMeta";

const Research = () => {
  return (
    <div className="min-h-screen bg-background pb-14">
      <PageMeta
        title="Наши исследования — Профессор Тарусин Д.И."
        description="Научные исследования профессора Тарусина Д.И. в области детской урологии-андрологии."
        path="/research"
      />
      <Header />
      <main className="pt-24 md:pt-28">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Наши исследования
          </h1>
          <p className="text-muted-foreground text-lg">
            Раздел находится в разработке. Скоро здесь появятся материалы наших научных исследований.
          </p>
        </div>
      </main>
      <Footer />
      <StickyBottomPanel />
    </div>
  );
};

export default Research;
