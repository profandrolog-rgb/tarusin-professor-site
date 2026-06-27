import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notebook, Plus, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface VaultNoteRow {
  note_id: string;
  note: { id: string; title: string; folder_path: string; updated_at: string } | null;
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "note";
}

export function PatientVaultNotes({ patientId, patientName }: { patientId: string; patientName: string }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<VaultNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("vault_note_patients")
        .select("note_id, note:vault_notes(id, title, folder_path, updated_at)")
        .eq("patient_id", patientId);
      setRows(((data as any) ?? []).filter((r: VaultNoteRow) => r.note));
      setLoading(false);
    })();
  }, [patientId]);

  async function createNote() {
    setCreating(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Нужна авторизация"); setCreating(false); return; }
    const title = `Заметка по ${patientName}`;
    const { data: note, error } = await supabase.from("vault_notes").insert({
      owner_id: u.user.id,
      title,
      slug: slugify(title) + "-" + Date.now().toString(36),
      folder_path: "/Пациенты",
      content_md: `# ${title}\n\n`,
      tags: [],
      patient_id: patientId,
    }).select("id").single();
    if (error || !note) { toast.error(error?.message ?? "Ошибка"); setCreating(false); return; }
    await supabase.from("vault_note_patients").insert({ note_id: note.id, patient_id: patientId });
    navigate(`/cabinet/vault?note=${note.id}`);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Notebook className="w-4 h-4" />Заметки Vault ({rows.length})
        </CardTitle>
        <Button size="sm" onClick={createNote} disabled={creating} className="gap-1">
          {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Создать заметку
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">Заметок пока нет</div>
        ) : (
          <div className="space-y-1">
            {rows.map((r) => r.note && (
              <Link key={r.note_id} to={`/cabinet/vault?note=${r.note_id}`}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm">
                <span className="flex-1 truncate">📓 {r.note.title}</span>
                <span className="text-[10px] text-muted-foreground">{r.note.folder_path}</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
