import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  full_name: string;
  birth_date: string;
}

interface PatientSelectProps {
  selectedPatient: Patient | null;
  onSelect: (patient: Patient) => void;
}

export function PatientSelect({ selectedPatient, onSelect }: PatientSelectProps) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState<Date>();

  useEffect(() => {
    if (search.length >= 2) {
      const fetchPatients = async () => {
        const { data } = await supabase
          .from("patients")
          .select("*")
          .ilike("full_name", `%${search}%`)
          .limit(10);
        setPatients(data || []);
        setShowDropdown(true);
      };
      fetchPatients();
    } else {
      setPatients([]);
      setShowDropdown(false);
    }
  }, [search]);

  const handleCreatePatient = async () => {
    if (!newName || !newBirthDate) return;
    const { data, error } = await supabase
      .from("patients")
      .insert({ full_name: newName, birth_date: format(newBirthDate, "yyyy-MM-dd") })
      .select()
      .single();
    if (data) {
      onSelect(data);
      setIsCreating(false);
      setNewName("");
      setNewBirthDate(undefined);
      setSearch("");
    }
  };

  if (selectedPatient) {
    return (
      <div className="border rounded-lg p-4 bg-secondary/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{selectedPatient.full_name}</p>
            <p className="text-sm text-muted-foreground">
              Дата рождения: {format(new Date(selectedPatient.birth_date), "dd.MM.yyyy")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { onSelect(null as any); setSearch(""); }}>
            Изменить
          </Button>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-medium">Новый пациент</h4>
        <div className="space-y-2">
          <Label>ФИО пациента</Label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Иванов Иван Иванович" />
        </div>
        <div className="space-y-2">
          <Label>Дата рождения</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left", !newBirthDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {newBirthDate ? format(newBirthDate, "dd.MM.yyyy") : "Выберите дату"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={newBirthDate}
                onSelect={setNewBirthDate}
                captionLayout="dropdown-buttons"
                fromYear={1920}
                toYear={new Date().getFullYear()}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreatePatient} disabled={!newName || !newBirthDate}>Создать</Button>
          <Button variant="outline" onClick={() => setIsCreating(false)}>Отмена</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative">
      <Label>Пациент</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по ФИО (минимум 2 символа)..."
            className="pl-9"
          />
          {showDropdown && patients.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              {patients.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-4 py-2 hover:bg-secondary/50 transition-colors"
                  onClick={() => { onSelect(p); setShowDropdown(false); setSearch(""); }}
                >
                  <span className="font-medium">{p.full_name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({format(new Date(p.birth_date), "dd.MM.yyyy")})
                  </span>
                </button>
              ))}
            </div>
          )}
          {showDropdown && patients.length === 0 && search.length >= 2 && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-4 text-center text-muted-foreground">
              Пациент не найден
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> Новый
        </Button>
      </div>
    </div>
  );
}
