import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_MEMO_BODY } from "@/lib/surgery/referral";

export default function AdminSurgeryReferralSettings() {
  const [loading, setLoading] = useState(true);
  const [savingMemo, setSavingMemo] = useState(false);
  const [memo, setMemo] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from("surgery_memo_templates").select("*").eq("is_active", true).maybeSingle(),
      supabase.from("surgery_exam_catalog").select("*").order("sort_order"),
    ]);
    setMemo(
      m || {
        title: "Памятка пациенту, которому предстоит оперативное лечение",
        body: DEFAULT_MEMO_BODY,
        coordinator_name: "Надежда Александровна",
        coordinator_phone: "+7 903 005-61-11",
        coordinator_instruction: "По этому номеру в Telegram, WhatsApp или MAX нужно переслать первый лист путёвки.",
        is_active: true,
      }
    );
    setExams(c || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveMemo = async () => {
    setSavingMemo(true);
    try {
      const payload = { ...memo, is_active: true };
      const { error } = memo?.id
        ? await supabase.from("surgery_memo_templates").update(payload).eq("id", memo.id)
        : await supabase.from("surgery_memo_templates").insert(payload);
      if (error) throw error;
      toast.success("Памятка сохранена");
      load();
    } catch (e: any) {
      toast.error("Не удалось сохранить", { description: e?.message || String(e) });
    } finally {
      setSavingMemo(false);
    }
  };

  const patchExam = async (row: any, patch: Record<string, any>) => {
    setExams((prev) => prev.map((e) => (e.id === row.id ? { ...e, ...patch } : e)));
    const { error } = await supabase.from("surgery_exam_catalog").update(patch).eq("id", row.id);
    if (error) toast.error("Не удалось сохранить пункт", { description: error.message });
  };

  const addExam = async () => {
    const name = newName.trim();
    if (!name) return;
    const { error } = await supabase.from("surgery_exam_catalog").insert({
      name,
      group_name: newGroup.trim() || "Дополнительно",
      sort_order: (exams.at(-1)?.sort_order ?? 0) + 10,
    });
    if (error) {
      toast.error("Не удалось добавить", { description: error.message });
      return;
    }
    setNewName("");
    load();
  };

  const removeExam = async (row: any) => {
    const { error } = await supabase.from("surgery_exam_catalog").delete().eq("id", row.id);
    if (error) {
      toast.error("Не удалось удалить", { description: error.message });
      return;
    }
    setExams((prev) => prev.filter((e) => e.id !== row.id));
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/surgery-referrals">
            <ArrowLeft className="h-4 w-4 mr-1" /> К путёвкам
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Памятка пациенту и контакты координатора</CardTitle>
            <CardDescription>Текст печатается на третьем листе путёвки и виден пациенту по ссылке.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Заголовок</Label>
              <Input value={memo?.title || ""} onChange={(e) => setMemo({ ...memo, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Текст памятки</Label>
              <Textarea rows={14} value={memo?.body || ""} onChange={(e) => setMemo({ ...memo, body: e.target.value })} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Координатор</Label>
                <Input
                  value={memo?.coordinator_name || ""}
                  onChange={(e) => setMemo({ ...memo, coordinator_name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Телефон</Label>
                <Input
                  value={memo?.coordinator_phone || ""}
                  onChange={(e) => setMemo({ ...memo, coordinator_phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Инструкция по пересылке путёвки</Label>
              <Textarea
                rows={2}
                value={memo?.coordinator_instruction || ""}
                onChange={(e) => setMemo({ ...memo, coordinator_instruction: e.target.value })}
              />
            </div>
            <Button onClick={saveMemo} disabled={savingMemo} className="gap-1">
              {savingMemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Сохранить
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Справочник предоперационных обследований</CardTitle>
            <CardDescription>
              «По умолчанию» — пункт автоматически отмечается при выдаче путёвки. Срок действия указывается в днях.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {exams.map((row) => (
              <div key={row.id} className="flex gap-2 items-center flex-wrap border-b pb-2">
                <Input
                  className="flex-1 min-w-[200px]"
                  value={row.name}
                  onChange={(e) => setExams((p) => p.map((x) => (x.id === row.id ? { ...x, name: e.target.value } : x)))}
                  onBlur={(e) => patchExam(row, { name: e.target.value })}
                />
                <Input
                  className="w-[150px]"
                  placeholder="группа"
                  value={row.group_name || ""}
                  onChange={(e) =>
                    setExams((p) => p.map((x) => (x.id === row.id ? { ...x, group_name: e.target.value } : x)))
                  }
                  onBlur={(e) => patchExam(row, { group_name: e.target.value })}
                />
                <Input
                  className="w-[150px]"
                  placeholder="комментарий"
                  value={row.note || ""}
                  onChange={(e) => setExams((p) => p.map((x) => (x.id === row.id ? { ...x, note: e.target.value } : x)))}
                  onBlur={(e) => patchExam(row, { note: e.target.value })}
                />
                <Input
                  className="w-[90px]"
                  type="number"
                  placeholder="дней"
                  value={row.valid_days ?? ""}
                  onChange={(e) =>
                    setExams((p) =>
                      p.map((x) => (x.id === row.id ? { ...x, valid_days: e.target.value ? Number(e.target.value) : null } : x))
                    )
                  }
                  onBlur={(e) => patchExam(row, { valid_days: e.target.value ? Number(e.target.value) : null })}
                />
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <Checkbox checked={row.is_default} onCheckedChange={(v) => patchExam(row, { is_default: v === true })} />
                  по умолчанию
                </label>
                <Button variant="ghost" size="icon" onClick={() => removeExam(row)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Input placeholder="Новое обследование" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input className="w-[160px]" placeholder="Группа" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
              <Button variant="outline" onClick={addExam} className="gap-1">
                <Plus className="h-4 w-4" /> Добавить
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
