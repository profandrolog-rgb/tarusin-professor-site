import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface DR {
  id: string;
  diagnosis_group: string;
  subtype: string;
  category: string;
  item_text: string;
  is_base: boolean;
  sort_order: number;
  icd_code: string | null;
}

interface RS {
  id: string;
  specialty: string;
  doctor_name: string;
  phone: string;
  contact_note: string;
  sort_order: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  обследование: "Обследование",
  медикамент: "Медикаменты",
  местное: "Местное лечение",
  режим: "Режим",
  контроль: "Контроль",
  направление: "Направления",
};
const CATEGORY_ORDER = ["обследование", "медикамент", "местное", "режим", "направление", "контроль"];

interface Props {
  /** Current recommendations text (will be appended to) */
  value: string;
  /** Setter for the recommendations field */
  onApply: (next: string) => void;
}

export function DiagnosisRecommendationsPicker({ value, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<string>("");
  const [subtype, setSubtype] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [referrals, setReferrals] = useState<Set<string>>(new Set());

  const { data: items = [] } = useQuery({
    queryKey: ["diagnosis_recommendations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnosis_recommendations" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any) as DR[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: specialists = [] } = useQuery({
    queryKey: ["referral_specialists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_specialists" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as any) as RS[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const groups = useMemo(
    () => Array.from(new Set(items.map((i) => i.diagnosis_group))).sort(),
    [items],
  );
  const subtypes = useMemo(
    () =>
      Array.from(
        new Set(items.filter((i) => i.diagnosis_group === group).map((i) => i.subtype)),
      ),
    [items, group],
  );

  const filtered = useMemo(
    () => items.filter((i) => i.diagnosis_group === group && i.subtype === subtype),
    [items, group, subtype],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, DR[]>();
    for (const i of filtered) {
      if (!map.has(i.category)) map.set(i.category, []);
      map.get(i.category)!.push(i);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!,
    }));
  }, [filtered]);

  // Auto-select base items when subtype changes
  useEffect(() => {
    if (!subtype) return;
    const base = new Set(filtered.filter((i) => i.is_base).map((i) => i.id));
    setSelected(base);
    setReferrals(new Set());
  }, [group, subtype, items.length]);

  // Reset subtype when group changes
  useEffect(() => {
    setSubtype("");
    setSelected(new Set());
  }, [group]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleRef = (id: string) => {
    setReferrals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalChecked = selected.size + referrals.size;

  const apply = () => {
    if (totalChecked === 0) {
      toast({ title: "Ничего не выбрано" });
      return;
    }
    const lines: string[] = [];
    const header = `${group} (${subtype}):`;
    lines.push(header);
    for (const block of grouped) {
      const picked = block.items.filter((i) => selected.has(i.id));
      if (picked.length === 0) continue;
      lines.push(`\n${CATEGORY_LABELS[block.category] || block.category}:`);
      for (const it of picked) lines.push(`• ${it.item_text}`);
    }
    if (referrals.size > 0) {
      lines.push(`\nНаправления к специалистам:`);
      for (const s of specialists) {
        if (!referrals.has(s.id)) continue;
        const parts = [s.specialty, "—", s.doctor_name];
        if (s.phone) parts.push(`(${s.phone})`);
        lines.push(`• ${parts.join(" ")}`);
        if (s.contact_note) lines.push(`  ${s.contact_note}`);
      }
    }
    const block = lines.join("\n");
    const next = value && value.trim() ? `${value.trim()}\n\n${block}` : block;
    onApply(next);
    toast({ title: `Добавлено пунктов: ${totalChecked}` });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Stethoscope className="h-4 w-4 mr-2" />
          Шаблоны по диагнозу
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle>Рекомендации по диагнозу</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-2 py-3">
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger><SelectValue placeholder="Диагноз" /></SelectTrigger>
            <SelectContent className="max-h-80">
              {groups.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={subtype} onValueChange={setSubtype} disabled={!group}>
            <SelectTrigger><SelectValue placeholder="Этап / подтип" /></SelectTrigger>
            <SelectContent>
              {subtypes.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 pr-3 -mr-3">
          {!subtype && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Выберите диагноз и подтип
            </p>
          )}
          {subtype && (
            <div className="space-y-4">
              {grouped.map((block) => (
                <div key={block.category} className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    {CATEGORY_LABELS[block.category] || block.category}
                  </div>
                  {block.items.map((it) => (
                    <label
                      key={it.id}
                      className="flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selected.has(it.id)}
                        onCheckedChange={() => toggle(it.id)}
                        className="mt-0.5"
                      />
                      <span className="leading-snug flex-1">
                        {it.item_text}
                        {it.is_base && (
                          <Badge variant="secondary" className="ml-2 text-[10px] py-0 px-1.5 align-middle">
                            базовое
                          </Badge>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              ))}

              {specialists.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t">
                  <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    Направления к специалистам
                  </div>
                  {specialists.map((s) => (
                    <label
                      key={s.id}
                      className="flex gap-2 items-start text-sm cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={referrals.has(s.id)}
                        onCheckedChange={() => toggleRef(s.id)}
                        className="mt-0.5"
                      />
                      <span className="leading-snug flex-1">
                        <span className="font-medium">{s.specialty}</span> — {s.doctor_name}
                        {s.phone && (
                          <span className="inline-flex items-center gap-1 ml-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />{s.phone}
                          </span>
                        )}
                        {s.contact_note && (
                          <div className="text-xs text-muted-foreground mt-0.5">{s.contact_note}</div>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs text-muted-foreground">
              Выбрано: {totalChecked}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="button" size="sm" onClick={apply} disabled={totalChecked === 0}>
                Добавить в рекомендации
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
