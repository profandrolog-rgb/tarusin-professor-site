import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Save, ArrowUp, ArrowDown, Minus, Loader2, Trash2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { PatientSelect } from "@/components/prescriptions/PatientSelect";
import { LAB_TESTS, LAB_GROUPS, type LabTest } from "@/utils/lab-reference-ranges";
import { calculateAge } from "@/utils/anthropometry/who-reference";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Patient {
  id: string;
  full_name: string;
  birth_date: string;
}

interface LabEntry {
  code: string;
  value: string;
}

export function LabResultsPanel() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sex, setSex] = useState<"male" | "female">("male");
  const [testDate, setTestDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState(LAB_GROUPS[0]);
  const [subTab, setSubTab] = useState("input");
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [trendTest, setTrendTest] = useState<string>(LAB_TESTS[0].code);

  const ageYears = patient ? calculateAge(new Date(patient.birth_date), testDate).years : 0;

  const updateEntry = (code: string, value: string) => {
    setEntries(prev => ({ ...prev, [code]: value }));
  };

  const handleSave = async () => {
    if (!patient) { toast.error("Выберите пациента"); return; }
    const filledEntries = Object.entries(entries).filter(([_, v]) => v && v.trim() !== "");
    if (filledEntries.length === 0) { toast.error("Введите хотя бы один показатель"); return; }

    setSaving(true);
    try {
      const rows = filledEntries.map(([code, val]) => {
        const test = LAB_TESTS.find(t => t.code === code)!;
        const numVal = parseFloat(val);
        const range = test.getRange(ageYears, sex);
        const isAbnormal = range ? (numVal < range.min || numVal > range.max) : false;
        return {
          patient_id: patient.id,
          test_date: format(testDate, "yyyy-MM-dd"),
          test_group: test.group,
          test_name: test.name,
          test_code: test.code,
          value: numVal,
          unit: test.unit,
          reference_min: range?.min ?? null,
          reference_max: range?.max ?? null,
          is_abnormal: isAbnormal,
        };
      });

      const { error } = await supabase.from("lab_results").insert(rows as any);
      if (error) throw error;
      toast.success(`Сохранено ${rows.length} показателей`);
      setEntries({});
      if (subTab === "history" || subTab === "trends") fetchHistory();
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const fetchHistory = async () => {
    if (!patient) return;
    setHistoryLoading(true);
    const { data } = await supabase
      .from("lab_results")
      .select("*")
      .eq("patient_id", patient.id)
      .order("test_date", { ascending: false })
      .order("test_group")
      .order("test_name");
    setHistory(data || []);
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (patient && (subTab === "history" || subTab === "trends")) fetchHistory();
  }, [patient, subTab]);

  const handleDeleteResults = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("lab_results").delete().eq("id", deleteId);
    if (error) toast.error("Ошибка удаления");
    else { toast.success("Удалено"); fetchHistory(); }
    setDeleteId(null);
  };

  // Trend data
  const trendData = history
    .filter((r: any) => r.test_code === trendTest)
    .reverse()
    .map((r: any) => ({
      date: format(new Date(r.test_date), "dd.MM.yy"),
      value: Number(r.value),
      min: r.reference_min != null ? Number(r.reference_min) : undefined,
      max: r.reference_max != null ? Number(r.reference_max) : undefined,
    }));

  const trendTestInfo = LAB_TESTS.find(t => t.code === trendTest);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PatientSelect selectedPatient={patient} onSelect={setPatient} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Пол</Label>
            <Select value={sex} onValueChange={(v) => setSex(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Мужской</SelectItem>
                <SelectItem value="female">Женский</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Дата анализов</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left text-sm">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {format(testDate, "dd.MM.yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={testDate} onSelect={(d) => d && setTestDate(d)} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {patient && (
        <div className="text-sm text-muted-foreground">
          Возраст: <span className="font-medium text-foreground">{calculateAge(new Date(patient.birth_date), testDate).text}</span>
          {" · "}Нормы подбираются автоматически по возрасту и полу
        </div>
      )}

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="input">Ввод данных</TabsTrigger>
          <TabsTrigger value="history" disabled={!patient}>История</TabsTrigger>
          <TabsTrigger value="trends" disabled={!patient}>Тренды</TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          {/* Group tabs */}
          <div className="flex flex-wrap gap-1 mb-4">
            {LAB_GROUPS.map(g => (
              <Button key={g} variant={activeGroup === g ? "default" : "outline"} size="sm" onClick={() => setActiveGroup(g)} className="text-xs">
                {g}
                {/* Show count of filled entries */}
                {(() => {
                  const count = LAB_TESTS.filter(t => t.group === g && entries[t.code]).length;
                  return count > 0 ? <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[10px]">{count}</Badge> : null;
                })()}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{activeGroup}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LAB_TESTS.filter(t => t.group === activeGroup).map(test => {
                  const range = patient ? test.getRange(ageYears, sex) : null;
                  const val = entries[test.code] || "";
                  const numVal = parseFloat(val);
                  const isLow = range && val && numVal < range.min;
                  const isHigh = range && val && numVal > range.max;
                  const isAbnormal = isLow || isHigh;

                  return (
                    <div key={test.code} className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                      isAbnormal ? "border-destructive/50 bg-destructive/5" : "border-transparent"
                    )}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <Label className="text-xs font-medium truncate">{test.name}</Label>
                          {isLow && <ArrowDown className="h-3 w-3 text-blue-500 shrink-0" />}
                          {isHigh && <ArrowUp className="h-3 w-3 text-destructive shrink-0" />}
                        </div>
                        {range && (
                          <span className="text-[10px] text-muted-foreground">
                            {range.min}–{range.max} {test.unit}
                          </span>
                        )}
                      </div>
                      <div className="w-24 shrink-0">
                        <Input
                          type="number"
                          step="any"
                          value={val}
                          onChange={(e) => updateEntry(test.code, e.target.value)}
                          placeholder="—"
                          className={cn("h-8 text-sm text-right", isAbnormal && "border-destructive text-destructive")}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0">{test.unit}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving || !patient || Object.values(entries).filter(Boolean).length === 0} className="w-full mt-4">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Сохранение..." : `Сохранить (${Object.values(entries).filter(Boolean).length} показателей)`}
          </Button>
        </TabsContent>

        <TabsContent value="history">
          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : history.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Нет сохранённых анализов</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-muted-foreground">Дата</th>
                        <th className="text-left p-2 font-medium text-muted-foreground">Группа</th>
                        <th className="text-left p-2 font-medium text-muted-foreground">Показатель</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Значение</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Норма</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r: any) => (
                        <tr key={r.id} className={cn("border-b last:border-0", r.is_abnormal && "bg-destructive/5")}>
                          <td className="p-2">{format(new Date(r.test_date), "dd.MM.yy")}</td>
                          <td className="p-2 text-muted-foreground text-xs">{r.test_group}</td>
                          <td className="p-2 font-medium">{r.test_name}</td>
                          <td className={cn("p-2 text-right font-mono", r.is_abnormal && "text-destructive font-bold")}>
                            {Number(r.value).toFixed(2)} {r.unit}
                            {r.is_abnormal && (Number(r.value) < Number(r.reference_min) ? 
                              <ArrowDown className="inline h-3 w-3 ml-1 text-blue-500" /> : 
                              <ArrowUp className="inline h-3 w-3 ml-1 text-destructive" />
                            )}
                          </td>
                          <td className="p-2 text-right text-muted-foreground text-xs">
                            {r.reference_min != null ? `${r.reference_min}–${r.reference_max}` : "—"}
                          </td>
                          <td className="p-2">
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends">
          <div className="space-y-4">
            <Select value={trendTest} onValueChange={setTrendTest}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Выберите показатель" />
              </SelectTrigger>
              <SelectContent>
                {LAB_GROUPS.map(g => (
                  <div key={g}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{g}</div>
                    {LAB_TESTS.filter(t => t.group === g).map(t => (
                      <SelectItem key={t.code} value={t.code}>{t.name} ({t.unit})</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            {trendData.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {trendTestInfo?.name}
                    <span className="text-sm font-normal text-muted-foreground">({trendTestInfo?.unit})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      {trendData[0]?.min != null && trendData[0]?.max != null && (
                        <ReferenceArea y1={trendData[0].min} y2={trendData[0].max} fill="hsl(var(--primary))" fillOpacity={0.08} />
                      )}
                      {trendData[0]?.min != null && (
                        <ReferenceLine y={trendData[0].min} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "min", fontSize: 10 }} />
                      )}
                      {trendData[0]?.max != null && (
                        <ReferenceLine y={trendData[0].max} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "max", fontSize: 10 }} />
                      )}
                      <Line dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Нет данных по выбранному показателю
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить результат?</AlertDialogTitle>
            <AlertDialogDescription>Это действие необратимо.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteResults} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
