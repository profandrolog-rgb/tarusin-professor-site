import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Zap, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

export const NEURO_STATUS_TEMPLATE = `НЕВРОЛОГИЧЕСКИЙ СТАТУС

Сознание ясное. Ориентирован в месте и времени согласно возрасту, способен к контакту. Поведение адекватное. Память и интеллект сохранены, по возрасту. Обманов восприятия и бредовых идей не наблюдается.

Менингеальные симптомы.
Ригидности мышц затылка нет. Симптом Кернига отрицательный. Симптомы Брудзинского (верхний, средний, нижний) отрицательные.

Черепно-мозговые нервы.
Обонятельный нерв: обоняние сохранено, галлюцинаций нет.
Зрительный нерв: острота зрения субъективно нормальная, цветоощущение не изменено, поля зрения сохранены.
Зрачки D=S, реакции на свет живые, движение глазных яблок в полном объёме.
Глазодвигательный, блоковой, отводящий нервы: глазные щели одинаковой ширины, движения в полном объёме, косоглазия и диплопии нет, нистагм не определяется.
Тройничный нерв: болезненности точек выхода ветвей нет, чувствительность кожи лица сохранена, жевательная мускулатура достаточная, роговичный и конъюнктивальный рефлексы сохранены.
Лицевой нерв: лобные и носогубные складки симметричны, асимметрии при мимических движениях нет.
Слуховой нерв: острота слуха не изменена, шума в ушах и головокружения нет.
Языкоглоточный и блуждающий нервы: глотание не нарушено, голос звучный, мягкое нёбо подвижно, небный и глоточный рефлексы в норме.
Добавочный нерв: грудино-ключично-сосцевидные и трапециевидные мышцы не изменены, объём движений достаточный.
Подъязычный нерв: язык по средней линии, фасцикуляций нет.

Двигательная сфера.
Атрофий мышц нет. Объём активных движений в суставах конечностей достаточный. Мышечная сила не снижена. Проба Барре (верхняя и нижняя) отрицательная.
Мышечный тонус нормальный. Гипо- и гиперкинезов нет.

Рефлекторная сфера.
Сухожильные и периостальные рефлексы с верхних и нижних конечностей живые, симметричные (D=S). Патологических стопных и кистевых рефлексов нет.

Чувствительная сфера.
Поверхностная и глубокая чувствительность сохранены, симметричны. Болезненности по ходу нервных стволов нет. Симптомы натяжения (Ласега, Вассермана) отрицательные.

Координаторная сфера.
Пальценосовая и пяточно-коленная пробы выполняет уверенно. В позе Ромберга устойчив. Походка не изменена. Адиадохокинеза нет.

Вегетативная нервная система.
Дермографизм розовый, нестойкий. Потоотделение умеренное. Нарушений тазовых функций нет.

Высшие корковые функции.
Речь не нарушена. Афазии, апраксии, агнозии не выявлено.

Заключение: неврологической патологии на момент осмотра не выявлено.`;

interface Props {
  value?: string;
  onChange: (v: string) => void;
}

export function NeuroStatusSection({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasValue = !!(value && value.trim());

  useEffect(() => {
    if (expanded && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = Math.max(300, el.scrollHeight) + "px";
    }
  }, [expanded, value]);

  const preview = hasValue
    ? (value as string).split("\n").filter((l) => l.trim()).slice(0, 2).join(" / ")
    : "";

  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">Неврологический статус (расширенный)</div>
          {!expanded && preview && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">{preview}</div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {expanded && (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => onChange(NEURO_STATUS_TEMPLATE)}
              >
                <Zap className="h-3 w-3" /> Шаблон
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs gap-1"
                disabled={!hasValue}
                onClick={() => onChange("")}
              >
                <RotateCcw className="h-3 w-3" /> Сброс
              </Button>
            </>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <><ChevronUp className="h-3 w-3" /> Свернуть</> : <><ChevronDown className="h-3 w-3" /> Развернуть</>}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3">
          <Textarea
            ref={textareaRef}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[300px] font-mono text-xs leading-relaxed"
            placeholder="Опишите неврологический статус или нажмите «Шаблон»"
          />
        </div>
      )}
    </div>
  );
}
