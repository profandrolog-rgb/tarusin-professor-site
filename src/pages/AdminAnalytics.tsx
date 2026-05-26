import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import FiltersBar, { applyPeriod, type PeriodPreset } from "@/components/analytics/FiltersBar";
import TopCatalogTable from "@/components/analytics/TopCatalogTable";
import TopTemplatesTable from "@/components/analytics/TopTemplatesTable";
import CostByTagChart from "@/components/analytics/CostByTagChart";
import PlansPerMonthChart from "@/components/analytics/PlansPerMonthChart";
import DurationHistogram from "@/components/analytics/DurationHistogram";
import SectionUsagePie from "@/components/analytics/SectionUsagePie";
import IrtAnalyticsSection from "@/components/analytics/IrtAnalyticsSection";
import { downloadAnalyticsCsv } from "@/lib/analytics/csvExport";
import type { AnalyticsFilters } from "@/lib/analytics/useAnalyticsSection";
import { toast } from "sonner";

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [period, setPeriod] = useState<PeriodPreset>("90");
  const initial = applyPeriod("90");
  const [filters, setFilters] = useState<AnalyticsFilters>({
    from: initial.from,
    to: initial.to,
    status: "issued",
    doctor: "all",
  });

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" as any }).then(({ data }) => {
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
    });
  }, [user, loading, navigate]);

  const handleExport = async () => {
    const callRpc = async (name: string) => {
      const { data, error } = await supabase.rpc(name as any, {
        _from: filters.from, _to: filters.to, _status: filters.status, _doctor: filters.doctor,
      });
      if (error) throw error;
      return (data ?? []) as any[];
    };
    try {
      const [topCatalog, topTemplates, costByTag, plansPerMonth, duration, sectionUsage] = await Promise.all([
        callRpc("analytics_top_catalog"),
        callRpc("analytics_top_templates"),
        callRpc("analytics_avg_cost_by_tag"),
        callRpc("analytics_plans_per_month"),
        callRpc("analytics_duration_histogram"),
        callRpc("analytics_section_usage"),
      ]);
      downloadAnalyticsCsv(`analytics_${new Date().toISOString().slice(0,10)}.csv`, [
        { title: "ТОП-20 позиций каталога", rows: topCatalog },
        { title: "ТОП-10 шаблонов", rows: topTemplates },
        { title: "Средняя стоимость по тегам", rows: costByTag },
        { title: "Динамика по месяцам", rows: plansPerMonth },
        { title: "Распределение длительности", rows: duration },
        { title: "Использование секций", rows: sectionUsage },
      ]);
      toast.success("CSV выгружен");
    } catch (e: any) {
      toast.error("Не удалось выгрузить CSV", { description: e?.message });
    }
  };

  if (loading || isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet><title>Аналитика — Админ</title><meta name="robots" content="noindex" /></Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />Назад в админку
          </Button>
          <h1 className="text-2xl font-bold">📊 Аналитика лечебных листов</h1>
          <div className="w-32" />
        </div>

        <FiltersBar
          filters={filters}
          setFilters={setFilters}
          period={period}
          setPeriod={setPeriod}
          onExport={handleExport}
        />

        <TopCatalogTable filters={filters} />
        <TopTemplatesTable filters={filters} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CostByTagChart filters={filters} />
          <SectionUsagePie filters={filters} />
          <PlansPerMonthChart filters={filters} />
          <DurationHistogram filters={filters} />
        </div>
      </div>
    </div>
  );
}
