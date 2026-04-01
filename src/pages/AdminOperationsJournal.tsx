import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JournalEntry {
  id: string;
  operation_date: string;
  patient_name: string;
  patient_birth_date: string;
  diagnosis: string;
  operation_name: string;
  protocol_notes: string | null;
  surgeon_name: string;
  assistant_name: string | null;
  created_at: string;
}

const emptyForm = {
  operation_date: new Date().toISOString().split("T")[0],
  patient_name: "",
  patient_birth_date: "",
  diagnosis: "",
  operation_name: "",
  protocol_notes: "",
  surgeon_name: "Профессор, д.м.н. Тарусин Дмитрий Игоревич",
  assistant_name: "",
};

const AdminOperationsJournal = () => {
  const { user, isAdmin, isSurgeon, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const hasAccess = isAdmin || isSurgeon;

  useEffect(() => {
    if (!authLoading && (!user || !hasAccess)) {
      navigate("/auth", { state: { from: "/admin/operations-journal" } });
    }
  }, [user, hasAccess, authLoading, navigate]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("operations_journal")
      .select("*")
      .order("operation_date", { ascending: false });

    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && hasAccess) fetchEntries();
  }, [user, isAdmin]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setForm({
      operation_date: entry.operation_date,
      patient_name: entry.patient_name,
      patient_birth_date: entry.patient_birth_date,
      diagnosis: entry.diagnosis,
      operation_name: entry.operation_name,
      protocol_notes: entry.protocol_notes || "",
      surgeon_name: entry.surgeon_name,
      assistant_name: entry.assistant_name || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.patient_name || !form.diagnosis || !form.operation_name) {
      toast({ title: "Заполните обязательные поля", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      operation_date: form.operation_date,
      patient_name: form.patient_name.trim(),
      patient_birth_date: form.patient_birth_date,
      diagnosis: form.diagnosis.trim(),
      operation_name: form.operation_name.trim(),
      protocol_notes: form.protocol_notes.trim() || null,
      surgeon_name: form.surgeon_name.trim(),
      assistant_name: form.assistant_name.trim() || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("operations_journal")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("operations_journal").insert(payload));
    }

    if (error) {
      toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Запись обновлена" : "Запись добавлена" });
      setDialogOpen(false);
      fetchEntries();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить запись из журнала?")) return;
    const { error } = await supabase.from("operations_journal").delete().eq("id", id);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Запись удалена" });
      fetchEntries();
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU");
  };

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.patient_name.toLowerCase().includes(q) ||
      e.diagnosis.toLowerCase().includes(q) ||
      e.operation_name.toLowerCase().includes(q) ||
      e.surgeon_name.toLowerCase().includes(q)
    );
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Панель администратора
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Операционный журнал</h1>
            <p className="text-muted-foreground text-sm">
              Всего записей: {entries.length}
            </p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" /> Новая запись
          </Button>
        </div>

        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по пациенту, диагнозу, операции..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {search ? "Ничего не найдено" : "Журнал пуст. Добавьте первую запись."}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Дата</TableHead>
                  <TableHead>Пациент</TableHead>
                  <TableHead className="hidden md:table-cell">Д.р.</TableHead>
                  <TableHead>Диагноз</TableHead>
                  <TableHead className="hidden lg:table-cell">Операция</TableHead>
                  <TableHead className="hidden xl:table-cell">Оператор</TableHead>
                  <TableHead className="w-[90px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">
                      {formatDate(entry.operation_date)}
                    </TableCell>
                    <TableCell className="font-medium">{entry.patient_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDate(entry.patient_birth_date)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.diagnosis}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                      {entry.operation_name}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground truncate max-w-[180px]">
                      {entry.surgeon_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(entry)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Редактировать запись" : "Новая запись в журнале"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Дата операции *</Label>
                  <Input
                    type="date"
                    value={form.operation_date}
                    onChange={(e) => setForm({ ...form, operation_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Дата рождения *</Label>
                  <Input
                    type="date"
                    value={form.patient_birth_date}
                    onChange={(e) => setForm({ ...form, patient_birth_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>ФИО пациента *</Label>
                <Input
                  value={form.patient_name}
                  onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <div>
                <Label>Диагноз *</Label>
                <Input
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                />
              </div>
              <div>
                <Label>Название операции *</Label>
                <Input
                  value={form.operation_name}
                  onChange={(e) => setForm({ ...form, operation_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Особенности протокола</Label>
                <Textarea
                  value={form.protocol_notes}
                  onChange={(e) => setForm({ ...form, protocol_notes: e.target.value })}
                  rows={4}
                  placeholder="Особенности хода операции..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Оператор *</Label>
                  <Input
                    value={form.surgeon_name}
                    onChange={(e) => setForm({ ...form, surgeon_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ассистент</Label>
                  <Input
                    value={form.assistant_name}
                    onChange={(e) => setForm({ ...form, assistant_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  <X className="w-4 h-4 mr-1" /> Отмена
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Сохранить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminOperationsJournal;
