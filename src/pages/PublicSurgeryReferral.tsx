import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatRuDate, plannedDateText } from "@/lib/surgery/referral";

export default function PublicSurgeryReferral() {
  const { hash } = useParams<{ hash: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!hash) return;
    const { data: res, error } = await supabase.rpc("get_public_surgery_referral", { _hash: hash });
    if (error) toast.error("Не удалось загрузить путёвку");
    setData(res || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  const toggle = async (itemId: string, done: boolean) => {
    setData((prev: any) => ({
      ...prev,
      items: prev.items.map((i: any) => (i.id === itemId ? { ...i, is_done: done } : i)),
    }));
    const { error } = await supabase.rpc("mark_public_referral_item", {
      _hash: hash,
      _item_id: itemId,
      _done: done,
    });
    if (error) {
      toast.error("Не удалось сохранить отметку");
      load();
      return;
    }
    toast.success(done ? "Отмечено как сдано" : "Отметка снята");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (!data) return <div className="p-10 text-center">Путёвка не найдена или ссылка недействительна.</div>;

  const items: any[] = data.items || [];
  const done = items.filter((i) => i.is_done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Подготовка к операции</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Пациент: </span>
              {data.full_name}
              {data.birth_date ? `, ${formatRuDate(data.birth_date)}` : ""}
            </div>
            {data.operation_name ? (
              <div>
                <span className="text-muted-foreground">Операция: </span>
                {data.operation_name}
              </div>
            ) : null}
            <div>
              <span className="text-muted-foreground">Ориентировочный срок: </span>
              {plannedDateText(data.planned_date_from, data.planned_date_to)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Обследования: {done} из {items.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={pct} />
            <div className="space-y-2">
              {items.map((i) => (
                <label key={i.id} className="flex items-start gap-2 cursor-pointer text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={!!i.is_done}
                    onCheckedChange={(v) => toggle(i.id, v === true)}
                  />
                  <span>
                    {i.name}
                    {i.note ? <span className="text-muted-foreground"> — {i.note}</span> : null}
                    {i.valid_days ? (
                      <span className="text-xs text-muted-foreground"> (действует {i.valid_days} дн.)</span>
                    ) : null}
                    {i.is_done ? (
                      <span className="text-xs text-emerald-600 ml-1 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> сдано {formatRuDate(i.done_at)}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {data.memo_body ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{data.memo_title || "Памятка пациенту"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap leading-relaxed">{data.memo_body}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="py-4 text-sm space-y-1">
            <div className="font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" /> {data.coordinator_phone || "+7 903 005-61-11"}
            </div>
            <div>{data.coordinator_name || "Надежда Александровна"}</div>
            <div className="text-muted-foreground">
              {data.coordinator_instruction ||
                "По этому номеру в Telegram, WhatsApp или MAX нужно переслать первый лист путёвки."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
