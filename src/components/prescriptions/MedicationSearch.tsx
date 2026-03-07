import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface Medication {
  id: string;
  latin_name: string;
  trade_name: string | null;
  dosage_form: string | null;
  dosage: string | null;
}

interface MedicationSearchProps {
  onSelect: (med: { latin_name: string; dosage_form: string; dose: string }) => void;
}

export function MedicationSearch({ onSelect }: MedicationSearchProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Medication[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (search.length >= 2) {
      const fetchMeds = async () => {
        const { data } = await supabase
          .from("medications")
          .select("*")
          .or(`latin_name.ilike.%${search}%,trade_name.ilike.%${search}%`)
          .limit(20);
        setResults(data || []);
        setShowDropdown(true);
      };
      fetchMeds();
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [search]);

  return (
    <div className="relative">
      <Label>Поиск препарата (латинское или торговое название)</Label>
      <div className="relative mt-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Например: Amoxicillinum или Амоксициллин..."
          className="pl-9"
        />
      </div>
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((med) => (
            <button
              key={med.id}
              className="w-full text-left px-4 py-2 hover:bg-secondary/50 transition-colors border-b last:border-b-0"
              onClick={() => {
                onSelect({
                  latin_name: med.latin_name,
                  dosage_form: med.dosage_form || "",
                  dose: med.dosage || "",
                });
                setSearch("");
                setShowDropdown(false);
              }}
            >
              <div className="font-medium">{med.latin_name}</div>
              <div className="text-sm text-muted-foreground">
                {med.trade_name && <span>{med.trade_name} · </span>}
                {med.dosage_form && <span>{med.dosage_form}</span>}
                {med.dosage && <span> · {med.dosage}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
