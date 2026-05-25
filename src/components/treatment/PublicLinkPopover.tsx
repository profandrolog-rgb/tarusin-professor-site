import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link2, Copy, Check, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  planId: string;
  publicHash: string | null;
  isPublic: boolean;
  onChange: (v: { is_public: boolean }) => void;
}

export function PublicLinkPopover({ planId, publicHash, isPublic, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const url = publicHash ? `${window.location.origin}/p/${publicHash}` : "";

  useEffect(() => {
    if (!open || !isPublic || !url || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 180, margin: 1, color: { dark: "#000", light: "#fff" } })
      .catch(() => {});
  }, [open, isPublic, url]);

  const togglePublic = async (v: boolean) => {
    setBusy(true);
    const { error } = await supabase.from("treatment_plans").update({ is_public: v } as any).eq("id", planId);
    setBusy(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    onChange({ is_public: v });
    toast({ title: v ? "Публичная ссылка активирована" : "Публичная ссылка отключена" });
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadQR = async () => {
    if (!url) return;
    const dataUrl = await QRCode.toDataURL(url, { width: 600, margin: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-pamyatka-${publicHash}.png`;
    a.click();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Link2 className="w-4 h-4"/>Публичная ссылка
          {isPublic && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ml-1"/>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Опубликовать памятку</div>
              <div className="text-xs text-muted-foreground">Доступ без авторизации по ссылке</div>
            </div>
            <Switch checked={isPublic} onCheckedChange={togglePublic} disabled={busy || !publicHash}/>
          </div>

          {isPublic && url && (
            <>
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground">Публичная ссылка</div>
                <div className="flex gap-1.5">
                  <Input value={url} readOnly className="text-xs font-mono"/>
                  <Button size="icon" variant="outline" onClick={copy} className="shrink-0">
                    {copied ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4"/>}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 pt-1">
                <canvas ref={canvasRef} className="border border-border rounded"/>
                <Button size="sm" variant="outline" onClick={downloadQR} className="gap-2">
                  <Download className="w-3.5 h-3.5"/>Скачать QR (PNG)
                </Button>
              </div>
            </>
          )}

          {!isPublic && (
            <p className="text-xs text-muted-foreground">
              При выключении — ссылка перестаёт работать, по адресу будет 404.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
