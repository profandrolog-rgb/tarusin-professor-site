import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Printer, Copy, Search, Loader2, Trash2 } from "lucide-react";
import { PrescriptionPrint } from "./PrescriptionPrint";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PrescriptionHistoryProps {
  onRepeat: (prescriptionId: string) => void;
}

export function PrescriptionHistory({ onRepeat }: PrescriptionHistoryProps) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [printPrescription, setPrintPrescription] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    let query = supabase
      .from("prescriptions")
      .select("*, patients(*)")
      .order("created_at", { ascending: false });

    const { data } = await query;

    if (data) {
      // Load items for each prescription
      const enriched = await Promise.all(
        data.map(async (p: any) => {
          if (p.prescription_type === "standard") {
            const { data: items } = await supabase
              .from("prescription_items")
              .select("*")
              .eq("prescription_id", p.id)
              .order("sort_order");
            return { ...p, patient: p.patients, items: items || [] };
          } else {
            const { data: ingredients } = await supabase
              .from("extemporaneous_ingredients")
              .select("*")
              .eq("prescription_id", p.id)
              .order("sort_order");
            return { ...p, patient: p.patients, ingredients: ingredients || [] };
          }
        })
      );

      // Filter by search
      if (search.trim()) {
        const s = search.toLowerCase();
        setPrescriptions(
          enriched.filter((p) =>
            p.patient?.full_name?.toLowerCase().includes(s) ||
            p.items?.some((i: any) => i.medication_latin_name?.toLowerCase().includes(s)) ||
            p.ingredients?.some((i: any) => i.ingredient_name?.toLowerCase().includes(s))
          )
        );
      } else {
        setPrescriptions(enriched);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [search]);

  const handlePrint = (prescription: any) => {
    setPrintPrescription(prescription);
    setTimeout(() => {
      const printContent = printRef.current;
      if (!printContent) return;
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <html><head><title>Рецепт</title>
        <style>@page{size:148.5mm 105mm;margin:0}body{margin:0;padding:0}*{box-sizing:border-box}</style>
        </head><body>${printContent.innerHTML}</body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }, 100);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    // Delete related items first, then the prescription
    await supabase.from("prescription_items").delete().eq("prescription_id", deleteId);
    await supabase.from("extemporaneous_ingredients").delete().eq("prescription_id", deleteId);
    const { error } = await supabase.from("prescriptions").delete().eq("id", deleteId);
    if (error) {
      toast.error("Ошибка при удалении рецепта");
    } else {
      toast.success("Рецепт удалён");
      fetchPrescriptions();
    }
    setDeleteId(null);
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по ФИО, препарату..."
          className="pl-9"
        />
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Рецепты не найдены
        </div>
      ) : (
        prescriptions.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{p.patient?.full_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      {p.prescription_type === "standard" ? "Стандартный" : "Экстемпоральный"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Дата: {format(new Date(p.prescription_date), "dd.MM.yyyy")} · 
                    Д.р.: {p.patient?.birth_date ? format(new Date(p.patient.birth_date), "dd.MM.yyyy") : "—"}
                  </p>
                  {p.items && p.items.length > 0 && (
                    <div className="text-sm">
                      {p.items.map((item: any, idx: number) => (
                        <div key={idx}>
                          Rp: {item.medication_latin_name} {item.dosage_form && `(${item.dosage_form})`} {item.dose} — N{item.quantity}
                          {item.frequency && `, ${item.frequency}`}
                          {item.duration && `, ${item.duration}`}
                        </div>
                      ))}
                    </div>
                  )}
                  {p.ingredients && p.ingredients.length > 0 && (
                    <div className="text-sm">
                      {p.ingredients.map((ing: any, idx: number) => (
                        <div key={idx}>
                          {ing.ingredient_name} {ing.amount} {ing.unit}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => handlePrint(p)} title="Печать">
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onRepeat(p.id)} title="Повторить рецепт">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Hidden print area */}
      <div className="hidden">
        <div ref={printRef}>
          {printPrescription && <PrescriptionPrint prescription={printPrescription} />}
        </div>
      </div>
    </div>
  );
}
