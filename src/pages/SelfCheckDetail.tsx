import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getChecklistBySlug } from "@/data/checklists";
import ChecklistRunner from "@/components/self-check/ChecklistRunner";
import PageMeta from "@/components/PageMeta";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SelfCheckDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const checklist = slug ? getChecklistBySlug(slug) : undefined;

  if (!checklist) return <Navigate to="/self-check" replace />;

  return (
    <>
      <PageMeta
        title={`${checklist.shortTitle} — Самодиагностика`}
        description={checklist.description}
        path={`/self-check/${checklist.slug}`}
      />
      <Header />
      <main className="min-h-screen bg-background">
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <Link
              to="/self-check"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Все тесты
            </Link>
            <ChecklistRunner checklist={checklist} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default SelfCheckDetail;
