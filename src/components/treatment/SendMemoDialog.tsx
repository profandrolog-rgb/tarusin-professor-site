import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Loader2, Copy, Mail, Send, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  planId: string;
  publicHash: string | null;
  durationDays: number;
  patient: {
    full_name: string;
    email?: string | null;
    telegram_username?: string | null;
  } | null;
}

type Channel = "email" | "telegram" | "link";
type ContentKind = "link" | "pdf" | "both";

const CLINIC_PHONE = "+7 (495) 933-66-55";

function firstNamePatronymic(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 3) return `${parts[1]} ${parts[2]}`;
  if (parts.length === 2) return parts[1];
  return parts[0] || "";
}

export function SendMemoDialog({ open, onOpenChange, planId, publicHash, durationDays, patient }: Props) {
  const memoUrl = useMemo(() => {
    if (!publicHash) return "";
    return `${window.location.origin}/p/${publicHash}`;
  }, [publicHash]);

  const defaultMessage = useMemo(() => {
    const name = patient ? firstNamePatronymic(patient.full_name) : "";
    return `${name ? name + ", " : ""}выслана памятка по программе на ближайшие ${durationDays} дней. По вопросам — контакты МАЦ: ${CLINIC_PHONE}`;
  }, [patient, durationDays]);

  const hasTelegram = !!patient?.telegram_username;
  const hasEmail = !!patient?.email;

  const [channel, setChannel] = useState<Channel>("link");
  const [contentKind, setContentKind] = useState<ContentKind>("link");
  const [message, setMessage] = useState(defaultMessage);
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { setMessage(defaultMessage); }, [defaultMessage]);
  useEffect(() => {
    if (!open) return;
    if (channel === "email") setRecipient(patient?.email || "");
    else if (channel === "telegram") setRecipient(patient?.telegram_username || "");
    else setRecipient("");
  }, [channel, patient, open]);

  async function buildPdfAndUpload(): Promise<string | null> {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.setFontSize(16);
      doc.text("Памятка по курсу лечения", 40, 60);
      doc.setFontSize(11);
      doc.text(`Пациент: ${patient?.full_name || ""}`, 40, 90);
      doc.text(`Длительность: ${durationDays} дн.`, 40, 108);
      doc.setFontSize(10);
      const split = doc.splitTextToSize(
        "Подробная памятка доступна по онлайн-ссылке. Этот PDF — краткая справка. " +
        "МАЦ Тарусин. " + CLINIC_PHONE, 500);
      doc.text(split, 40, 140);
      if (memoUrl) doc.textWithLink("Открыть онлайн-памятку", 40, 200, { url: memoUrl });

      const blob = doc.output("blob");
      const path = `${planId}/memo-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from("memo-pdfs").upload(path, blob, {
        contentType: "application/pdf", upsert: true,
      });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("memo-pdfs").createSignedUrl(path, 60 * 60 * 24 * 14);
      if (sErr) throw sErr;
      return signed.signedUrl;
    } catch (e) {
      console.error(e);
      toast({ title: "Не удалось подготовить PDF", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      return null;
    }
  }

  async function handleCopyLink() {
    if (!memoUrl) { toast({ title: "Сделайте лист публичным", variant: "destructive" }); return; }
    await navigator.clipboard.writeText(memoUrl);
    toast({ title: "Ссылка скопирована" });
    // log copy as channel=link
    await supabase.functions.invoke("send-patient-memo", {
      body: {
        plan_id: planId, channel: "link", content_kind: "link",
        message: "", memo_url: memoUrl,
      },
    });
  }

  async function handleSend() {
    if (channel === "link") { await handleCopyLink(); return; }
    if (!memoUrl && contentKind !== "pdf") {
      toast({ title: "Сделайте лист публичным или выберите только PDF", variant: "destructive" });
      return;
    }
    if (!recipient.trim()) {
      toast({ title: `Укажите ${channel === "email" ? "email" : "Telegram"} получателя`, variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      let pdfUrl: string | undefined;
      if (contentKind !== "link") {
        const u = await buildPdfAndUpload();
        if (!u) { setSending(false); return; }
        pdfUrl = u;
      }
      const { data, error } = await supabase.functions.invoke("send-patient-memo", {
        body: {
          plan_id: planId,
          channel,
          content_kind: contentKind,
          message,
          recipient: recipient.trim(),
          memo_url: memoUrl,
          pdf_url: pdfUrl,
        },
      });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any)?.error || "Ошибка отправки");
      toast({ title: "Памятка отправлена" });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Не удалось отправить",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Отправить памятку пациенту</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm mb-2 block">Канал</Label>
            <RadioGroup value={channel} onValueChange={(v) => setChannel(v as Channel)} className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="email" id="ch-email" />
                <Mail className="w-4 h-4"/> Email {!hasEmail && <span className="text-xs text-muted-foreground">(нет в карте)</span>}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="telegram" id="ch-tg" />
                <Send className="w-4 h-4"/> Telegram {!hasTelegram && <span className="text-xs text-muted-foreground">(нет в карте)</span>}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="link" id="ch-link" />
                <LinkIcon className="w-4 h-4"/> Скопировать ссылку
              </label>
            </RadioGroup>
          </div>

          {channel !== "link" && (
            <>
              <div>
                <Label className="text-sm mb-2 block">Что отправить</Label>
                <RadioGroup value={contentKind} onValueChange={(v) => setContentKind(v as ContentKind)} className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="link" id="ck-link" /> Только ссылка
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="pdf" id="ck-pdf" /> Только PDF
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="both" id="ck-both" /> Оба
                  </label>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm">Получатель</Label>
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={channel === "email" ? "patient@example.com" : "@username или chat_id"}
                />
                {channel === "telegram" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Бот должен иметь доступ к чату/пользователю. Лучше указывать числовой chat_id.
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm">Сообщение</Label>
                <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
            </>
          )}

          {channel === "link" && (
            <div className="rounded-md border p-3 bg-muted/30 text-sm break-all">
              {memoUrl || <span className="text-muted-foreground">Лист ещё не публичный — включите публичную ссылку.</span>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>Отмена</Button>
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin"/> :
              channel === "link" ? <Copy className="w-4 h-4"/> : <Send className="w-4 h-4"/>}
            {channel === "link" ? "Скопировать" : "Отправить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
