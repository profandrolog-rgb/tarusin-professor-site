import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Zap, RotateCcw, Wand2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ProtocolType } from "@/lib/visits/protocolTypes";
import {
  VisitTextTemplate,
  useVisitTextTemplates,
  resolveTemplate,
  getFieldKeyMap,
  detectOperationMatch,
} from "@/lib/visits/templates";

interface Ctx {
  protocolType: ProtocolType | string;
  data: any;
  onChange: (patch: any) => void;
  templates: VisitTextTemplate[];
  operationName: string;
}

const SmartTemplatesContext = createContext<Ctx | null>(null);

export function SmartTemplatesProvider({
  protocolType,
  data,
  onChange,
  children,
}: {
  protocolType: ProtocolType | string;
  data: any;
  onChange: (patch: any) => void;
  children: ReactNode;
}) {
  const { data: templates = [] } = useVisitTextTemplates(protocolType);
  const operationName = (data?.operation_name as string) || "";
  return (
    <SmartTemplatesContext.Provider value={{ protocolType, data: data || {}, onChange, templates, operationName }}>
      {children}
    </SmartTemplatesContext.Provider>
  );
}

function useCtx() {
  const ctx = useContext(SmartTemplatesContext);
  return ctx;
}

/**
 * Renders a label with a ⚡ / ↺ button beside it.
 * fieldKey = template key (e.g. "general_status")
 * formField = name of the field on `data` to update (defaults to fieldKey).
 */
export function SmartFieldLabel({
  children,
  fieldKey,
  formField,
  htmlFor,
}: {
  children: ReactNode;
  fieldKey: string;
  formField?: string;
  htmlFor?: string;
}) {
  const ctx = useCtx();
  if (!ctx) {
    return <Label htmlFor={htmlFor}>{children}</Label>;
  }
  const field = formField || fieldKey;
  const currentVal = (ctx.data?.[field] as string) || "";
  const tpl = resolveTemplate(ctx.templates, ctx.protocolType, fieldKey, ctx.operationName);

  const apply = () => {
    if (!tpl) {
      toast({ title: "Шаблон не найден", description: "Для этого поля шаблона нет.", variant: "destructive" });
      return;
    }
    ctx.onChange({ [field]: tpl.template_text });
  };
  const reset = () => ctx.onChange({ [field]: "" });

  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      {tpl && (
        <div className="flex items-center gap-1">
          {currentVal ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={reset}
              title="Очистить поле"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> сброс
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-primary"
            onClick={apply}
            title={tpl.label}
          >
            <Zap className="h-3 w-3 mr-1" /> {currentVal ? "перезаписать" : "шаблон"}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Top-of-form button that fills all empty standard fields.
 */
export function FillStandardButton({ overwrite = false }: { overwrite?: boolean }) {
  const ctx = useCtx();
  if (!ctx) return null;
  const fieldMap = getFieldKeyMap(ctx.protocolType);

  const handle = () => {
    const patch: Record<string, string> = {};
    let count = 0;
    for (const [tplKey, formField] of Object.entries(fieldMap)) {
      const tpl = resolveTemplate(ctx.templates, ctx.protocolType, tplKey, ctx.operationName);
      if (!tpl) continue;
      const existing = (ctx.data?.[formField] as string) || "";
      if (existing && !overwrite) continue;
      patch[formField] = tpl.template_text;
      count++;
    }
    if (count === 0) {
      toast({ title: "Все поля уже заполнены", description: "Нет пустых полей со стандартом." });
      return;
    }
    ctx.onChange(patch);
    toast({ title: `Заполнено полей: ${count}` });
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handle}>
      <Wand2 className="h-4 w-4 mr-2" />
      Заполнить стандартные поля
    </Button>
  );
}

/**
 * Banner that appears when operation_name matches op-specific templates.
 */
export function OperationTemplateBanner() {
  const ctx = useCtx();
  const [dismissed, setDismissed] = useState<string>("");
  // Reset dismissal when operation name changes — hook ДОЛЖЕН быть до early-return.
  useEffect(() => {
    setDismissed("");
  }, [ctx?.operationName]);
  if (!ctx) return null;
  const match = detectOperationMatch(ctx.templates, ctx.protocolType, ctx.operationName);
  if (!match.matched || dismissed === ctx.operationName) return null;

  const apply = () => {
    const fieldMap = getFieldKeyMap(ctx.protocolType);
    const patch: Record<string, string> = {};
    let count = 0;
    for (const tpl of match.templates) {
      const formField = fieldMap[tpl.field_key];
      if (!formField) continue;
      patch[formField] = tpl.template_text;
      count++;
    }
    if (count > 0) {
      ctx.onChange(patch);
      toast({ title: `Применён шаблон операции (${count} полей)` });
    }
    setDismissed(ctx.operationName);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <span>
          Найден шаблон для <strong>«{match.label}»</strong> — подставить?
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" size="sm" onClick={apply}>
          Да, подставить
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(ctx.operationName)}
          title="Скрыть"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
