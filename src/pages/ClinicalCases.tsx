import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Plus, Loader2, Shield, ChevronDown, ChevronRight, Trash2, Edit, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/useAutoSave";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import PageMeta from "@/components/PageMeta";
import AgeConfirmationModal from "@/components/AgeConfirmationModal";

type CaseCategory = "hydrocele" | "cryptorchidism" | "hypospadias" | "varicocele" | "phimosis" | "sexology" | "psychology" | "infertility" | "erectile_dysfunction" | "enuresis" | "pelvic_pain" | "scrotal_pain" | "hernia" | "complications" | "rarities" | "other";

interface ClinicalCase {
  id: string;
  title: string;
  category: CaseCategory;
  history: string;
  conclusions: string | null;
  recommendations: string | null;
  is_published: boolean;
  created_at: string;
}

interface CaseImage {
  id: string;
  case_id: string;
  image_path: string;
  caption: string | null;
  sort_order: number;
}

const categoryLabels: Record<CaseCategory, { ru: string; en: string }> = {
  infertility: { ru: "Бесплодие", en: "Infertility" },
  scrotal_pain: { ru: "Боль в мошонке", en: "Scrotal Pain" },
  varicocele: { ru: "Варикоцеле", en: "Varicocele" },
  hydrocele: { ru: "Гидроцеле", en: "Hydrocele" },
  hypospadias: { ru: "Гипоспадия", en: "Hypospadias" },
  hernia: { ru: "Грыжи", en: "Hernias" },
  cryptorchidism: { ru: "Крипторхизм", en: "Cryptorchidism" },
  complications: { ru: "Осложнения", en: "Complications" },
  psychology: { ru: "Психология", en: "Psychology" },
  rarities: { ru: "Раритеты", en: "Rare Cases" },
  sexology: { ru: "Сексология", en: "Sexology" },
  pelvic_pain: { ru: "Тазовая боль", en: "Pelvic Pain" },
  phimosis: { ru: "Фимоз", en: "Phimosis" },
  enuresis: { ru: "Энурез", en: "Enuresis" },
  erectile_dysfunction: { ru: "Эректильная дисфункция", en: "Erectile Dysfunction" },
  other: { ru: "Другое", en: "Other" },
};

const categoryColors: Record<CaseCategory, string> = {
  hydrocele: "bg-blue-100 text-blue-800",
  cryptorchidism: "bg-green-100 text-green-800",
  hypospadias: "bg-purple-100 text-purple-800",
  varicocele: "bg-orange-100 text-orange-800",
  phimosis: "bg-pink-100 text-pink-800",
  sexology: "bg-rose-100 text-rose-800",
  psychology: "bg-indigo-100 text-indigo-800",
  infertility: "bg-amber-100 text-amber-800",
  erectile_dysfunction: "bg-red-100 text-red-800",
  enuresis: "bg-cyan-100 text-cyan-800",
  pelvic_pain: "bg-teal-100 text-teal-800",
  scrotal_pain: "bg-yellow-100 text-yellow-800",
  hernia: "bg-lime-100 text-lime-800",
  complications: "bg-fuchsia-100 text-fuchsia-800",
  rarities: "bg-violet-100 text-violet-800",
  other: "bg-gray-100 text-gray-800",
};

const ClinicalCases = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [caseImages, setCaseImages] = useState<Record<string, CaseImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [newCase, setNewCase] = useState({
    title: "",
    category: "other" as CaseCategory,
    history: "",
    conclusions: "",
    recommendations: "",
  });
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();

  const { save: saveCaseDraft, loadDraft: loadCaseDraft, clearDraft: clearCaseDraft } = useAutoSave({
    key: "clinical_case_new",
    data: newCase,
    enabled: dialogOpen,
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from("clinical_cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const typedCases = (data || []).map(c => ({
        ...c,
        category: c.category as CaseCategory
      }));
      
      setCases(typedCases);

      // Fetch images for all cases
      if (typedCases.length > 0) {
        const { data: imagesData, error: imagesError } = await supabase
          .from("clinical_case_images")
          .select("*")
          .order("sort_order", { ascending: true });

        if (!imagesError && imagesData) {
          const imagesByCase: Record<string, CaseImage[]> = {};
          imagesData.forEach((img) => {
            if (!imagesByCase[img.case_id]) {
              imagesByCase[img.case_id] = [];
            }
            imagesByCase[img.case_id].push(img);
          });
          setCaseImages(imagesByCase);
        }
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить клинические случаи",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("case-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const toggleCase = (caseId: string) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(caseId)) {
      newExpanded.delete(caseId);
    } else {
      newExpanded.add(caseId);
    }
    setExpandedCases(newExpanded);
  };

  const handleCreateCase = async () => {
    if (!newCase.title || !newCase.history) {
      toast({
        title: "Заполните обязательные поля",
        description: "Укажите название и историю случая",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Create the case
      const { data: caseData, error: caseError } = await supabase
        .from("clinical_cases")
        .insert({
          title: newCase.title,
          category: newCase.category,
          history: newCase.history,
          conclusions: newCase.conclusions || null,
          recommendations: newCase.recommendations || null,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Upload images if any
      if (pendingImages.length > 0) {
        setImageUploading(true);
        for (let i = 0; i < pendingImages.length; i++) {
          const file = pendingImages[i];
          const fileName = `${caseData.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          
          const { error: uploadError } = await supabase.storage
            .from("case-images")
            .upload(fileName, file);

          if (uploadError) {
            console.error("Image upload error:", uploadError);
            continue;
          }

          await supabase
            .from("clinical_case_images")
            .insert({
              case_id: caseData.id,
              image_path: fileName,
              sort_order: i,
            });
        }
        setImageUploading(false);
      }

      toast({
        title: "Успешно",
        description: "Клинический случай добавлен",
      });

      setNewCase({
        title: "",
        category: "other",
        history: "",
        conclusions: "",
        recommendations: "",
      });
      setPendingImages([]);
      clearCaseDraft();
      setDialogOpen(false);
      fetchCases();
    } catch (error: any) {
      console.error("Create error:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать случай",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      // Delete images from storage first
      const images = caseImages[caseId] || [];
      if (images.length > 0) {
        await supabase.storage
          .from("case-images")
          .remove(images.map((img) => img.image_path));
      }

      const { error } = await supabase
        .from("clinical_cases")
        .delete()
        .eq("id", caseId);

      if (error) throw error;

      toast({
        title: "Удалено",
        description: "Клинический случай удалён",
      });

      fetchCases();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить случай",
        variant: "destructive",
      });
    }
  };

  const groupedCases = cases.reduce((acc, c) => {
    if (!acc[c.category]) {
      acc[c.category] = [];
    }
    acc[c.category].push(c);
    return acc;
  }, {} as Record<CaseCategory, ClinicalCase[]>);

  return (
    <AgeConfirmationModal>
    <div className="min-h-screen bg-background">
      <PageMeta title={isEn ? "Clinical Cases — Prof. Tarusin" : "Клинические случаи — Проф. Тарусин Д.И."} description={isEn ? "Clinical case descriptions from Professor Tarusin's practice with illustrations and conclusions." : "Описания клинических случаев из практики профессора Тарусина Д.И. с иллюстрациями и выводами."} path="/clinical-cases" />
      <header className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link to={isAdmin ? "/admin" : "/"} className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {isAdmin ? (isEn ? "Admin Panel" : "К панели администратора") : (isEn ? "Home" : "На главную")}
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{isEn ? "Clinical Cases" : "Клинические случаи"}</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            {isEn ? "Clinical case descriptions from the professor's practice" : "Описания клинических случаев из практики профессора"}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">

        {/* Admin Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {isEn ? "All Cases" : "Все случаи"}
            </h2>
            
            {!authLoading && isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Shield className="w-4 h-4 text-primary" />
                  Администратор
                </span>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (open) {
                    const draft = loadCaseDraft();
                    if (draft && (draft.title || draft.history)) {
                      sonnerToast("Найден черновик", {
                        description: "Восстановить несохранённые изменения?",
                        action: { label: "Восстановить", onClick: () => {
                          setNewCase(prev => ({ ...prev, ...draft }));
                          sonnerToast.success("Черновик восстановлен");
                        }},
                        cancel: { label: "Отклонить", onClick: () => clearCaseDraft() },
                        duration: 10000,
                      });
                    }
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить случай
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Новый клинический случай</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <Label htmlFor="case-title">Название *</Label>
                          <Input
                            id="case-title"
                            value={newCase.title}
                            onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                            placeholder="Название случая"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <Label htmlFor="case-category">Категория</Label>
                          <Select
                            value={newCase.category}
                            onValueChange={(val) => setNewCase({ ...newCase, category: val as CaseCategory })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(categoryLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="case-history">История *</Label>
                        <Textarea
                          id="case-history"
                          value={newCase.history}
                          onChange={(e) => setNewCase({ ...newCase, history: e.target.value })}
                          placeholder="Описание случая, анамнез, жалобы..."
                          rows={5}
                        />
                      </div>

                      <div>
                        <Label htmlFor="case-images">Иллюстрации</Label>
                        <Input
                          id="case-images"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setPendingImages(files);
                          }}
                        />
                        {pendingImages.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Выбрано файлов: {pendingImages.length}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="case-conclusions">Выводы</Label>
                        <Textarea
                          id="case-conclusions"
                          value={newCase.conclusions}
                          onChange={(e) => setNewCase({ ...newCase, conclusions: e.target.value })}
                          placeholder="Выводы по случаю..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="case-recommendations">Советы</Label>
                        <Textarea
                          id="case-recommendations"
                          value={newCase.recommendations}
                          onChange={(e) => setNewCase({ ...newCase, recommendations: e.target.value })}
                          placeholder="Рекомендации..."
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={handleCreateCase} 
                        disabled={uploading} 
                        className="w-full"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {imageUploading ? "Загрузка изображений..." : "Сохранение..."}
                          </>
                        ) : (
                          "Создать"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto text-muted-foreground mb-4">📋</div>
            <p className="text-lg text-muted-foreground">
              {isEn ? "No clinical cases added yet" : "Клинические случаи пока не добавлены"}
            </p>
            {isAdmin && (
              <p className="text-sm text-muted-foreground mt-2">
                Нажмите «Добавить случай» чтобы создать первый
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedCases).map(([category, categoryCases]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={categoryColors[category as CaseCategory]}>
                    {isEn ? categoryLabels[category as CaseCategory].en : categoryLabels[category as CaseCategory].ru}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({categoryCases.length})
                  </span>
                </div>
                
                <div className="space-y-3">
                  {categoryCases.map((clinicalCase) => (
                    <Card key={clinicalCase.id} className="overflow-hidden">
                      <Collapsible
                        open={expandedCases.has(clinicalCase.id)}
                        onOpenChange={() => toggleCase(clinicalCase.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {expandedCases.has(clinicalCase.id) ? (
                                  <ChevronDown className="w-5 h-5 text-primary" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                )}
                                {clinicalCase.title}
                              </CardTitle>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCase(clinicalCase.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="pt-0 space-y-6">
                            {/* History */}
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">{isEn ? "History" : "История"}</h4>
                              <p className="text-muted-foreground whitespace-pre-wrap">
                                {clinicalCase.history}
                              </p>
                            </div>

                            {/* Images */}
                            {caseImages[clinicalCase.id]?.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <Image className="w-4 h-4" />
                                   {isEn ? "Illustrations" : "Иллюстрации"}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {caseImages[clinicalCase.id].map((img) => (
                                    <a
                                      key={img.id}
                                      href={getPublicUrl(img.image_path)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block aspect-square rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
                                    >
                                      <img
                                        src={getPublicUrl(img.image_path)}
                                        alt={img.caption || "Иллюстрация"}
                                        className="w-full h-full object-cover"
                                      />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Conclusions */}
                            {clinicalCase.conclusions && (
                              <div>
                                <h4 className="font-semibold text-foreground mb-2">{isEn ? "Conclusions" : "Выводы"}</h4>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                  {clinicalCase.conclusions}
                                </p>
                              </div>
                            )}

                            {/* Recommendations */}
                            {clinicalCase.recommendations && (
                              <div>
                                <h4 className="font-semibold text-foreground mb-2">{isEn ? "Recommendations" : "Советы"}</h4>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                  {clinicalCase.recommendations}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
    </AgeConfirmationModal>
  );
};

export default ClinicalCases;
