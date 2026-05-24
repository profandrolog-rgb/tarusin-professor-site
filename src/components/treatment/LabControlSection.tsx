import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, X, FlaskConical, ChevronDown, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface LabTest {
  id: string;
  name: string;
  short_name: string | null;
  category: string | null;
  unit: string | null;
}

export interface LabControlPoint {
  client_id: string;
  id?: string;
  control_point: string;
  at_day: number | null;
  test_ids: string[];
  custom_tests: string[];
  notes: string | null;
  order_index: number;
}

const POINT_PRESETS = [
  "На 14-й день", "Через 4 недели", "Через 8 недель",
  "Через 3 месяца", "После окончания курса",
];

// Preset packs reference tests by short_name (or name fallback)
const PRESETS: Array<{ key: string; label: string; points: Array<{ control_point: string; at_day: number; tests: string[] }> }> = [
  {
    key: "basic", label: "Базовый андрологический",
    points: [{
      control_point: "Через 4 недели", at_day: 28,
      tests: ["Т общий","Т свободный","ГСПГ","E2","ЛГ","ФСГ","25(OH)D","АЛТ","АСТ","Креатинин","Липиды"],
    }],
  },
  {
    key: "extended", label: "Расширенный",
    points: [{
      control_point: "Через 4 недели", at_day: 28,
      tests: ["Т общий","Т свободный","ГСПГ","E2","ЛГ","ФСГ","25(OH)D","АЛТ","АСТ","Креатинин","Липиды","Пролактин","ТТГ","ДГЭА-С","Кортизол","Гомоцистеин","Ферритин","HbA1c"],
    }],
  },
  {
    key: "hepato", label: "Гепатопротекторный",
    points: [
      { control_point: "На 14-й день", at_day: 14, tests: ["АЛТ","АСТ","Креатинин"] },
      { control_point: "На 42-й день", at_day: 42, tests: ["АЛТ","АСТ","Креатинин"] },
    ],
  },
  {
    key: "trt", label: "На фоне TRT",
    points: [{
      control_point: "Через 6 недель", at_day: 42,
      tests: ["Т общий","ОАК","ПСА общий","E2","ЛГ","ФСГ"],
    }],
  },
  {
    key: "serm", label: "На фоне SERM",
    points: [{
      control_point: "Через 4 недели", at_day: 28,
      tests: ["Т общий","E2","ЛГ","ФСГ","ОАК"],
    }],
  },
];

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : Math.random().toString(36).slice(2);

function PointCard({ point, allTests, onChange, onRemove }: {
  point: LabControlPoint;
  allTests: LabTest[];
  onChange: (patch: Partial<LabControlPoint>) => void;
  onRemove: () => void;
}) {
  const sort = useSortable({ id: point.client_id });
  const style = {
    transform: CSS.Transform.toString(sort.transform),
    transition: sort.transition,
    opacity: sort.isDragging ? 0.5 : 1,
  };
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedTests = allTests.filter(t => point.test_ids.includes(t.id));

  return (
    <div ref={sort.setNodeRef} style={style} className="border rounded-md p-3 bg-card space-y-2">
      <div className="flex items-start gap-2">
        <button type="button" {...sort.attributes} {...sort.listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground p-0.5 mt-1">
          <GripVertical className="w-4 h-4"/>
        </button>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="md:col-span-2">
            <Label className="text-[11px]">Срок</Label>
            <Input
              list="lab-point-presets"
              value={point.control_point}
              onChange={e => onChange({ control_point: e.target.value })}
              placeholder="Через 4 недели"
              className="h-8"
            />
            <datalist id="lab-point-presets">
              {POINT_PRESETS.map(p => <option key={p} value={p}/>)}
            </datalist>
          </div>
          <div>
            <Label className="text-[11px]">День (для сортировки)</Label>
            <Input
              type="number" min={1}
              value={point.at_day ?? ""}
              onChange={e => onChange({ at_day: e.target.value === "" ? null : Number(e.target.value) })}
              className="h-8"
            />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 text-destructive">
              <X className="w-4 h-4"/>
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-[11px]">Анализы из каталога</Label>
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedTests.map(t => (
            <Badge key={t.id} variant="secondary" className="gap-1">
              {t.short_name || t.name}
              <button type="button" onClick={() => onChange({ test_ids: point.test_ids.filter(id => id !== t.id) })}>
                <X className="w-3 h-3"/>
              </button>
            </Badge>
          ))}
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1">
                <Plus className="w-3 h-3"/>Добавить
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-80" align="start">
              <Command>
                <CommandInput placeholder="Поиск теста..."/>
                <CommandList>
                  <CommandEmpty>Не найдено</CommandEmpty>
                  <CommandGroup>
                    {allTests.map(t => (
                      <CommandItem
                        key={t.id}
                        onSelect={() => {
                          const has = point.test_ids.includes(t.id);
                          onChange({ test_ids: has ? point.test_ids.filter(id => id !== t.id) : [...point.test_ids, t.id] });
                        }}
                      >
                        <Checkbox checked={point.test_ids.includes(t.id)} className="mr-2"/>
                        <span className="flex-1">{t.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{t.category}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px]">Произвольные тесты (через запятую)</Label>
          <Input
            value={point.custom_tests.join(", ")}
            onChange={e => onChange({ custom_tests: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            className="h-8"
            placeholder="Гликемическая кривая, Альбумин..."
          />
        </div>
        <div>
          <Label className="text-[11px]">Заметка</Label>
          <Input value={point.notes ?? ""} onChange={e => onChange({ notes: e.target.value })} className="h-8"/>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  points: LabControlPoint[];
  onChange: (points: LabControlPoint[]) => void;
}

export function LabControlSection({ enabled, onEnabledChange, points, onChange }: SectionProps) {
  const [allTests, setAllTests] = useState<LabTest[]>([]);
  const [presetOpen, setPresetOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!enabled) return;
    if (allTests.length) return;
    supabase.from("lab_tests_catalog").select("id, name, short_name, category, unit")
      .eq("is_active", true).order("category").order("name")
      .then(({ data }) => setAllTests((data as any) || []));
  }, [enabled, allTests.length]);

  const addPoint = () => {
    onChange([...points, {
      client_id: newId(), control_point: "Через 4 недели", at_day: 28,
      test_ids: [], custom_tests: [], notes: "", order_index: points.length,
    }]);
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS.find(p => p.key === presetKey);
    if (!preset) return;
    const newPoints = preset.points.map((p, i) => {
      const ids: string[] = [];
      p.tests.forEach(name => {
        const t = allTests.find(t => (t.short_name || t.name) === name);
        if (t) ids.push(t.id);
      });
      return {
        client_id: newId(),
        control_point: p.control_point,
        at_day: p.at_day,
        test_ids: ids,
        custom_tests: [],
        notes: null,
        order_index: points.length + i,
      } as LabControlPoint;
    });
    onChange([...points, ...newPoints]);
    setPresetOpen(false);
  };

  const updatePoint = (cid: string, patch: Partial<LabControlPoint>) => {
    onChange(points.map(p => p.client_id === cid ? { ...p, ...patch } : p));
  };
  const removePoint = (cid: string) => onChange(points.filter(p => p.client_id !== cid));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = points.findIndex(p => p.client_id === active.id);
    const newIdx = points.findIndex(p => p.client_id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onChange(arrayMove(points, oldIdx, newIdx).map((p, i) => ({ ...p, order_index: i })));
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 font-semibold">
            <FlaskConical className="w-4 h-4 text-primary"/>
            📊 Контроль на фоне терапии
            <Checkbox checked={enabled} onCheckedChange={(v) => onEnabledChange(!!v)} className="ml-2"/>
            <span className="text-xs text-muted-foreground font-normal">включить блок</span>
          </label>
          {enabled && (
            <div className="flex gap-2">
              <Popover open={presetOpen} onOpenChange={setPresetOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    Пресет <ChevronDown className="w-3 h-3"/>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-1 w-64" align="end">
                  {PRESETS.map(p => (
                    <button key={p.key} type="button"
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded"
                      onClick={() => applyPreset(p.key)}>
                      {p.label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
              <Button size="sm" onClick={addPoint} className="gap-1">
                <Plus className="w-3 h-3"/>Точка контроля
              </Button>
            </div>
          )}
        </div>

        {enabled && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={points.map(p => p.client_id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {points.length === 0 && (
                  <div className="text-sm text-muted-foreground italic py-3 text-center">
                    Добавьте точку контроля или примените пресет.
                  </div>
                )}
                {points.map(p => (
                  <PointCard
                    key={p.client_id}
                    point={p}
                    allTests={allTests}
                    onChange={patch => updatePoint(p.client_id, patch)}
                    onRemove={() => removePoint(p.client_id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
