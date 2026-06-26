import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Brain, ChevronDown, ChevronRight, EyeOff } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

/**
 * Служебное поле для рассуждений ИИ. Сохраняется в protocol_data.ai_reasoning,
 * но НИКОГДА не выводится на печать (исключено в ProtocolPrintLayout/KNOWN_KEYS).
 */
export function AiReasoningField({ value, onChange }: Props) {
  const [open, setOpen] = useState(!!value);
  return (
    <Card className="border-dashed border-amber-300/60 dark:border-amber-700/40 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-amber-600" />
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-1 hover:underline"
          >
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Рассуждения ИИ (служебное поле)
          </button>
          <span className="text-[10px] font-normal text-muted-foreground inline-flex items-center gap-1">
            <EyeOff className="h-3 w-3" /> не печатается
          </span>
          {value && !open && (
            <span className="text-[10px] text-amber-700 dark:text-amber-400">
              · {value.length} симв.
            </span>
          )}
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            placeholder="Сюда можно вставлять фрагменты рассуждений ИИ — они сохранятся в протоколе, но никогда не выйдут на печать."
            className="text-sm font-mono bg-background/60"
          />
          {value && (
            <div className="flex justify-end mt-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-destructive"
                onClick={() => {
                  if (confirm("Очистить служебное поле?")) onChange("");
                }}
              >
                Очистить
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
