import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { ArrowLeft, FileDown, Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { exportNodeToPdf } from "@/lib/exportPdf";
import { useToast } from "@/hooks/use-toast";
import { formatRuDate, plannedDateText } from "@/lib/surgery/referral";

export default function AdminSurgeryReferralPrint() {
  const { id } = useParams<{ id: string }>();
  const [ref, setRef] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [qr, setQr] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("surgery_referrals").select("*").eq("id", id).maybeSingle();
      const { data: rows } = await supabase
        .from("surgery_referral_items")
        .select("*")
        .eq("referral_id", id)
        .order("sort_order");
      setRef(data);
      setItems(rows || []);
      if (data?.public_hash) {
        try {
          setQr(await QRCode.toDataURL(`${window.location.origin}/s/${data.public_hash}`, { width: 220, margin: 1 }));
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const handlePdf = async () => {
    if (!printRef.current) return;
    setPdfBusy(true);
    try {
      const name = (ref?.full_name || "putevka").replace(/\s+/g, "_");
      await exportNodeToPdf(printRef.current, `putevka_${name}.pdf`);
    } catch (e: any) {
      toast({ title: "Не удалось создать PDF", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (!ref) return <div className="p-8 text-center">Путёвка не найдена</div>;

  const field = (label: string, value?: string | null) => (
    <div className="flex gap-2 py-1 border-b border-dotted border-neutral-300">
      <span className="text-[13px] text-neutral-600 min-w-[190px]">{label}</span>
      <span className="text-[14px] font-medium whitespace-pre-wrap">{value || "—"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff; } }`}</style>
      <div className="no-print max-w-4xl mx-auto flex justify-between mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/surgery-referrals">
            <ArrowLeft className="h-4 w-4 mr-1" /> К списку путёвок
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePdf} disabled={pdfBusy}>
            {pdfBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />}
            Скачать PDF
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Печать
          </Button>
        </div>
      </div>

      <div ref={printRef} className="max-w-4xl mx-auto bg-white text-black shadow-md">
        {/* ЛИСТ 1 — ПУТЁВКА */}
        <section className="p-10" style={{ pageBreakAfter: "always", breakAfter: "page" }}>
          <div className="text-center mb-6">
            <div className="text-[15px] font-semibold uppercase tracking-wide">
              Медицинский андрологический центр
            </div>
            <div className="text-[13px] text-neutral-600">проф. А. И. Тарусин</div>
            <h1 className="text-[20px] font-bold mt-4">Путёвка на оперативное лечение</h1>
          </div>

          <div className="space-y-1">
            {field("Пациент (Ф. И. О.)", ref.full_name)}
            {field("Дата рождения", formatRuDate(ref.birth_date))}
            {field("Возраст", ref.age_text)}
            {field("Диагноз / заключение", ref.diagnosis)}
            {field("Планируемая операция", ref.operation_name)}
            {field("Ориентировочный срок операции", plannedDateText(ref.planned_date_from, ref.planned_date_to))}
            {field("Дата выдачи путёвки", formatRuDate(ref.created_at))}
          </div>

          <div className="mt-8 flex gap-6 items-start border border-neutral-400 rounded p-4">
            <div className="flex-1">
              <div className="text-[15px] font-semibold">Координатор госпитализации</div>
              <div className="text-[17px] font-bold mt-1">{ref.coordinator_phone || "+7 903 005-61-11"}</div>
              <div className="text-[14px]">{ref.coordinator_name || "Надежда Александровна"}</div>
              <div className="text-[13px] mt-2 leading-snug">
                {ref.coordinator_instruction ||
                  "По этому номеру в Telegram, WhatsApp или MAX нужно переслать первый лист путёвки."}
              </div>
              <div className="text-[12px] text-neutral-600 mt-2">
                Отслеживание подготовки к операции и напоминания — по QR-коду справа.
              </div>
            </div>
            {qr ? (
              <div className="text-center">
                <img src={qr} alt="QR-код страницы подготовки к операции" className="w-[110px] h-[110px]" />
                <div className="text-[10px] text-neutral-600 mt-1">Отследить подготовку</div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex justify-between text-[13px]">
            <div>Врач: ______________________</div>
            <div>Подпись пациента: ______________________</div>
          </div>
        </section>

        {/* ЛИСТ 2 — ОБСЛЕДОВАНИЯ */}
        <section className="p-10" style={{ pageBreakAfter: "always", breakAfter: "page" }}>
          <h2 className="text-[18px] font-bold text-center mb-1">Перечень обследований перед операцией</h2>
          <div className="text-center text-[13px] text-neutral-600 mb-5">
            {ref.full_name}
            {ref.birth_date ? `, ${formatRuDate(ref.birth_date)}` : ""}
          </div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-neutral-100">
                <th className="border border-neutral-400 p-1 w-[36px]">✔</th>
                <th className="border border-neutral-400 p-1 text-left">Обследование</th>
                <th className="border border-neutral-400 p-1 w-[90px]">Срок действия</th>
                <th className="border border-neutral-400 p-1 w-[110px]">Дата сдачи</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="border border-neutral-400 p-1 text-center">
                    <span className="inline-block w-[14px] h-[14px] border border-neutral-700 align-middle">
                      {it.is_done ? "✓" : ""}
                    </span>
                  </td>
                  <td className="border border-neutral-400 p-1">
                    {it.name}
                    {it.note ? <span className="text-neutral-600"> — {it.note}</span> : null}
                  </td>
                  <td className="border border-neutral-400 p-1 text-center">
                    {it.valid_days ? `${it.valid_days} дн.` : "—"}
                  </td>
                  <td className="border border-neutral-400 p-1 text-center">{formatRuDate(it.done_at)}</td>
                </tr>
              ))}
              {[0, 1, 2].map((i) => (
                <tr key={`blank-${i}`}>
                  <td className="border border-neutral-400 p-1 text-center">
                    <span className="inline-block w-[14px] h-[14px] border border-neutral-700 align-middle" />
                  </td>
                  <td className="border border-neutral-400 p-1">&nbsp;</td>
                  <td className="border border-neutral-400 p-1" />
                  <td className="border border-neutral-400 p-1" />
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[12px] text-neutral-600 mt-3">
            Отмечайте выполненные обследования галочкой. Незаполненные строки — для дополнительных исследований,
            назначенных врачом.
          </div>
        </section>

        {/* ЛИСТ 3 — ПАМЯТКА */}
        <section className="p-10">
          <h2 className="text-[18px] font-bold text-center mb-4">
            {ref.memo_title || "Памятка пациенту, которому предстоит оперативное лечение"}
          </h2>
          <div className="text-[14px] leading-relaxed whitespace-pre-wrap">{ref.memo_body}</div>
          <div className="mt-8 border border-neutral-400 rounded p-4 text-[13px]">
            <div className="font-semibold">Связь с координатором</div>
            <div className="text-[16px] font-bold">{ref.coordinator_phone || "+7 903 005-61-11"}</div>
            <div>{ref.coordinator_name || "Надежда Александровна"}</div>
            <div className="mt-1">
              {ref.coordinator_instruction ||
                "По этому номеру в Telegram, WhatsApp или MAX нужно переслать первый лист путёвки."}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
