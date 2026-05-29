import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface IcdRow {
  code: string;
  name_ru: string;
  category: string | null;
}

interface Props {
  value: string;
  onChange: (code: string, name?: string) => void;
  placeholder?: string;
}

export function IcdAutocomplete({ value, onChange, placeholder = "Найдите код МКБ-10..." }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<IcdRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      let q = supabase.from("icd10_codes").select("code, name_ru, category").order("code").limit(50);
      if (query.trim()) {
        const term = `%${query.trim()}%`;
        q = q.or(`code.ilike.${term},name_ru.ilike.${term}`);
      }
      const { data } = await q;
      if (!cancelled) {
        setItems((data || []) as IcdRow[]);
        setLoading(false);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Код или название..." value={query} onValueChange={setQuery} />
          <CommandList>
            {loading && <div className="flex items-center justify-center p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>}
            {!loading && items.length === 0 && <CommandEmpty>Ничего не найдено</CommandEmpty>}
            <CommandGroup>
              {items.map((it) => (
                <CommandItem
                  key={it.code}
                  value={it.code}
                  onSelect={() => { onChange(it.code, it.name_ru); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === it.code ? "opacity-100" : "opacity-0")} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs font-semibold">{it.code}</div>
                    <div className="text-xs text-muted-foreground truncate">{it.name_ru}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
