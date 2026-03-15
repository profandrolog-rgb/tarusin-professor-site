import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Search } from "lucide-react";

interface Substance {
  id: string;
  latin_name: string;
  russian_name: string;
  category: string;
  default_unit: string;
  description: string | null;
  is_base: boolean;
  compatible_forms: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  antiseptic: "Антисептики",
  antibiotic: "Антибиотики",
  antifungal: "Противогрибковые",
  corticosteroid: "Кортикостероиды",
  keratolytic: "Кератолитики",
  emollient: "Эмоленты / Смягчающие",
  base: "Основы",
  astringent: "Вяжущие",
  antihistamine: "Антигистаминные",
  anesthetic: "Анестетики",
  vitamin: "Витамины",
  wound_healing: "Ранозаживляющие",
  anti_inflammatory: "Противовоспалительные",
  hormonal: "Гормональные",
  other: "Прочие",
};

const FORM_LABELS: Record<string, string> = {
  unguentum: "Мазь",
  pasta: "Паста",
  cremor: "Крем",
  gel: "Гель",
  linimentum: "Линимент",
  suspensio: "Болтушка",
  suppositoria: "Свечи",
  mixtura: "Микстура",
  tinctura: "Настойка",
  solutio: "Раствор",
};

export function SubstanceReference() {
  const [substances, setSubstances] = useState<Substance[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubstances();
  }, []);

  const loadSubstances = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("extemporaneous_substances")
      .select("*")
      .order("category")
      .order("latin_name");
    setSubstances((data as Substance[]) || []);
    setLoading(false);
  };

  const filtered = substances.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.latin_name.toLowerCase().includes(q) ||
      s.russian_name.toLowerCase().includes(q) ||
      (s.description || "").toLowerCase().includes(q)
    );
  });

  const grouped = filtered.reduce<Record<string, Substance[]>>((acc, s) => {
    const key = s.category || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const sortedCategories = Object.keys(grouped).sort((a, b) =>
    (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b, "ru")
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-2" /> Справочник субстанций
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Справочник субстанций</SheetTitle>
        </SheetHeader>

        <div className="relative mt-4 mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="pl-9"
          />
        </div>

        <div className="text-sm text-muted-foreground mb-3">
          Всего: {filtered.length} субстанций в {sortedCategories.length} группах
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
        ) : (
          <Accordion type="multiple" defaultValue={sortedCategories}>
            {sortedCategories.map((cat) => (
              <AccordionItem key={cat} value={cat}>
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2">
                    {CATEGORY_LABELS[cat] || cat}
                    <Badge variant="secondary" className="text-xs">
                      {grouped[cat].length}
                    </Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {grouped[cat].map((s) => (
                      <div
                        key={s.id}
                        className="border rounded-md p-3 bg-muted/30"
                      >
                        <div className="font-medium text-sm">
                          {s.latin_name}
                          {s.is_base && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Основа
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {s.russian_name} · {s.default_unit}
                        </div>
                        {s.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {s.description}
                          </div>
                        )}
                        {s.compatible_forms?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {s.compatible_forms.map((f) => (
                              <Badge key={f} variant="secondary" className="text-xs">
                                {FORM_LABELS[f] || f}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </SheetContent>
    </Sheet>
  );
}
