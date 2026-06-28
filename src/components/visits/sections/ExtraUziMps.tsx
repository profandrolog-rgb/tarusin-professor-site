import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UziReproductiveSection, DEFAULT_UZI_REPRODUCTIVE, UziReproductiveData } from "./UziReproductive";

export interface ExtraUziMpsData extends UziReproductiveData {
  enabled?: boolean;
}

interface Props {
  data?: ExtraUziMpsData;
  onChange: (patch: Partial<ExtraUziMpsData>) => void;
}

/**
 * Универсальный опциональный блок УЗДГ органов МПС, который можно добавить
 * к ЛЮБОМУ типу протокола. Управляется чекбоксом «Включить УЗДГ органов МПС
 * в этот протокол». Данные хранятся в `protocol_data.extra_uzi_mps`.
 *
 * Если выключено — данные сохраняются, но в печатный бланк не попадают.
 */
export function ExtraUziMpsSection({ data, onChange }: Props) {
  const enabled = data?.enabled === true;

  const handleToggle = (v: boolean) => {
    if (v && !data?.device) {
      // первое включение — подставляем дефолтные тексты
      onChange({ enabled: true, ...DEFAULT_UZI_REPRODUCTIVE });
    } else {
      onChange({ enabled: v });
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="pb-2">
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox
            checked={enabled}
            onCheckedChange={(v) => handleToggle(v === true)}
            className="mt-1"
          />
          <div>
            <CardTitle className="text-sm">
              + УЗДГ органов МПС (опционально к этому протоколу)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Добавляет в текущий протокол полный блок ультразвукового исследования
              с доплерографией органов мочеполовой системы. Включается в печатный бланк
              только при установленной галочке.
            </p>
          </div>
        </label>
      </CardHeader>
      {enabled ? (
        <CardContent>
          <UziReproductiveSection
            data={data || {}}
            onChange={(p) => onChange(p as Partial<ExtraUziMpsData>)}
          />
        </CardContent>
      ) : null}
    </Card>
  );
}
