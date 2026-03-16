import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, FileText, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrescriptionForm } from "@/components/prescriptions/PrescriptionForm";
import { ExtemporaneousForm } from "@/components/prescriptions/ExtemporaneousForm";
import { PrescriptionHistory } from "@/components/prescriptions/PrescriptionHistory";
import { DrugReference } from "@/components/prescriptions/DrugReference";
import { DosageCalculator } from "@/components/prescriptions/DosageCalculator";
import { SubstanceReference } from "@/components/prescriptions/SubstanceReference";
import { AnthropometryCalculator } from "@/components/anthropometry/AnthropometryCalculator";
import { AnthropometryErrorBoundary } from "@/components/anthropometry/AnthropometryErrorBoundary";
import { LabResultsPanel } from "@/components/labs/LabResultsPanel";
import { UltrasoundPanel } from "@/components/ultrasound/UltrasoundPanel";

const AdminPrescriptions = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<"prescriptions" | "examinations">("prescriptions");
  const [activeTab, setActiveTab] = useState("new");
  const [examTab, setExamTab] = useState("anthropometry");
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);
  const [repeatPrescriptionId, setRepeatPrescriptionId] = useState<string | null>(null);
  const [repeatWithoutPatient, setRepeatWithoutPatient] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/prescriptions" } });
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const handleRepeat = (prescriptionId: string) => {
    setRepeatPrescriptionId(prescriptionId);
    setRepeatWithoutPatient(false);
    setActiveTab("new");
  };

  const handleRepeatForOther = (prescriptionId: string) => {
    setRepeatPrescriptionId(prescriptionId);
    setRepeatWithoutPatient(true);
    setActiveTab("new");
  };

  const handleNewPrescription = () => {
    setRepeatPrescriptionId(null);
    setRepeatWithoutPatient(false);
    setEditingPrescriptionId(null);
    setActiveTab("new");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к панели администратора
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Медицинские инструменты
            </h1>
            <p className="text-muted-foreground">
              Рецепты, обследования, анализы
            </p>
          </div>
          {section === "prescriptions" && (
            <div className="flex gap-2">
              <SubstanceReference />
              <DrugReference />
            </div>
          )}
        </div>

        {/* Section selector */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={section === "prescriptions" ? "default" : "outline"}
            onClick={() => setSection("prescriptions")}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Рецепты
          </Button>
          <Button
            variant={section === "examinations" ? "default" : "outline"}
            onClick={() => setSection("examinations")}
            className="gap-2"
          >
            <Stethoscope className="h-4 w-4" />
            Обследования
          </Button>
        </div>

        {section === "prescriptions" && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="new">Рецепт</TabsTrigger>
              <TabsTrigger value="extemporaneous">Экстемпоральный</TabsTrigger>
              <TabsTrigger value="dosage">Калькулятор дозы</TabsTrigger>
              <TabsTrigger value="history">История рецептов</TabsTrigger>
            </TabsList>

            <TabsContent value="new">
              <PrescriptionForm
                repeatPrescriptionId={repeatPrescriptionId}
                repeatWithoutPatient={repeatWithoutPatient}
                onSaved={() => {
                  setRepeatPrescriptionId(null);
                  setRepeatWithoutPatient(false);
                  setActiveTab("history");
                }}
              />
            </TabsContent>

            <TabsContent value="extemporaneous">
              <ExtemporaneousForm onSaved={() => setActiveTab("history")} />
            </TabsContent>

            <TabsContent value="dosage">
              <DosageCalculator />
            </TabsContent>

            <TabsContent value="history">
              <PrescriptionHistory onRepeat={handleRepeat} onRepeatForOther={handleRepeatForOther} />
            </TabsContent>
          </Tabs>
        )}

        {section === "examinations" && (
          <Tabs value={examTab} onValueChange={setExamTab}>
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="anthropometry">Антропометрия</TabsTrigger>
              <TabsTrigger value="labs">Анализы</TabsTrigger>
              <TabsTrigger value="ultrasound">УЗИ</TabsTrigger>
            </TabsList>

            <TabsContent value="anthropometry">
              <AnthropometryErrorBoundary>
                <AnthropometryCalculator />
              </AnthropometryErrorBoundary>
            </TabsContent>

            <TabsContent value="labs">
              <LabResultsPanel />
            </TabsContent>

            <TabsContent value="ultrasound">
              <UltrasoundPanel />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AdminPrescriptions;
