import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ArrowLeft, Loader2, Search, AlertTriangle, MapPin, X, Upload } from "lucide-react";
import { AcupointsCsvImportDialog } from "@/components/treatment/AcupointsCsvImportDialog";

interface Meridian {
  id: string;
  code: string;
  name_en: string;
  name_ru: string;
  channel_type: string | null;
  polarity: string | null;
}

interface Acupoint {
  id: string;
  who_code: string;
  pinyin: string | null;
  chinese: string | null;
  name_ru: string | null;
  meridian_id: string | null;
  location_description: string | null;
  depth_mm: string | null;
  indications: string | null;
  contraindications: string | null;
  is_caution: boolean;
  manipulation_default: string | null;
}

interface CatalogProtocol {
  id: string;
  name: string;
  subcategory: string | null;
  notes: string | null;
}

export default function AdminAcupoints() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { who_code } = useParams<{ who_code?: string }>();
  const [busy, setBusy] = useState(true);
  const [meridians, setMeridians] = useState<Meridian[]>([]);
  const [points, setPoints] = useState<Acupoint[]>([]);
  const [protocols, setProtocols] = useState<CatalogProtocol[]>([]);
  const [q, setQ] = useState("");
  const [selectedMeridian, setSelectedMeridian] = useState<string | null>(null);
  const [onlyCaution, setOnlyCaution] = useState(false);
  const [openPoint, setOpenPoint] = useState<Acupoint | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth", { state: { from: "/admin/acupoints" } });
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    (async () => {
      setBusy(true);
      const [m, p, c] = await Promise.all([
        supabase.from("acupoint_meridians").select("*").order("code"),
        supabase.from("acupoints").select("*").order("who_code"),
        supabase
          .from("treatment_catalog")
          .select("id,name,subcategory,notes")
          .eq("category", "procedure")
          .ilike("subcategory", "ИРТ%"),
      ]);
      setMeridians((m.data as any) || []);
      setPoints((p.data as any) || []);
      setProtocols((c.data as any) || []);
      setBusy(false);
    })();
  }, []);

  // Open point by URL param
  useEffect(() => {
    if (who_code && points.length) {
      const found = points.find((pt) => pt.who_code === who_code);
      if (found) setOpenPoint(found);
    }
  }, [who_code, points]);

  const meridianById = useMemo(() => {
    const m = new Map<string, Meridian>();
    meridians.forEach((x) => m.set(x.id, x));
    return m;
  }, [meridians]);

  const meridianCounts = useMemo(() => {
    const c = new Map<string, number>();
    points.forEach((p) => {
      if (p.meridian_id) c.set(p.meridian_id, (c.get(p.meridian_id) || 0) + 1);
    });
    return c;
  }, [points]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return points.filter((p) => {
      if (selectedMeridian && p.meridian_id !== selectedMeridian) return false;
      if (onlyCaution && !p.is_caution) return false;
      if (!qq) return true;
      const hay = [
        p.who_code,
        p.pinyin || "",
        p.name_ru || "",
        p.chinese || "",
        p.indications || "",
        p.location_description || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [points, q, selectedMeridian, onlyCaution]);

  const protocolsForPoint = useMemo(() => {
    if (!openPoint) return [];
    const code = openPoint.who_code;
    const re = new RegExp(`\\b${code.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    return protocols.filter((pr) => pr.notes && re.test(pr.notes));
  }, [openPoint, protocols]);

  if (loading || busy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/admin/treatment-plans">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> К листам назначений
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" /> Каталог акупунктурных точек
              </h1>
              <p className="text-sm text-muted-foreground">
                {meridians.length} меридианов · {points.length} точек · WHO 2008 + Deadman
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/acupoints/atlas">
              <Button variant="outline" size="sm" className="gap-2"><MapPin className="w-4 h-4"/>Атлас</Button>
            </Link>
            <Link to="/admin/acupuncture-protocols">
              <Button size="sm" className="gap-2"><MapPin className="w-4 h-4"/>Протоколы</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar: meridians */}
          <Card className="md:sticky md:top-4 md:self-start">
            <CardContent className="p-2">
              <ScrollArea className="md:h-[calc(100vh-160px)]">
                <button
                  onClick={() => setSelectedMeridian(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    !selectedMeridian ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  Все меридианы ({points.length})
                </button>
                <div className="mt-1 space-y-0.5">
                  {meridians.map((m) => {
                    const cnt = meridianCounts.get(m.id) || 0;
                    const isSel = selectedMeridian === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMeridian(m.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                          isSel ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>
                            <span className="font-mono font-semibold">{m.code}</span>
                            <span className="ml-2 text-xs opacity-80">{m.name_ru}</span>
                          </span>
                          <span className="text-xs opacity-70">{cnt}</span>
                        </div>
                        {m.channel_type && (
                          <div className="text-[10px] opacity-60 mt-0.5">{m.channel_type}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-3">
            <Card>
              <CardContent className="p-3 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Поиск: WHO-код, пиньинь, RU, показания..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={onlyCaution} onCheckedChange={(v) => setOnlyCaution(!!v)} />
                  Только caution
                </label>
                <span className="text-sm text-muted-foreground">{filtered.length} точек</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs">
                      <tr>
                        <th className="text-left p-2 font-semibold">WHO</th>
                        <th className="text-left p-2 font-semibold">Пиньинь</th>
                        <th className="text-left p-2 font-semibold">RU</th>
                        <th className="text-left p-2 font-semibold hidden md:table-cell">Меридиан</th>
                        <th className="text-left p-2 font-semibold hidden lg:table-cell">Локализация</th>
                        <th className="text-left p-2 font-semibold w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-muted-foreground">
                            Ничего не найдено
                          </td>
                        </tr>
                      ) : (
                        filtered.map((p) => {
                          const m = p.meridian_id ? meridianById.get(p.meridian_id) : null;
                          return (
                            <tr
                              key={p.id}
                              onClick={() => setOpenPoint(p)}
                              className="border-t hover:bg-muted/40 cursor-pointer"
                            >
                              <td className="p-2 font-mono font-semibold text-primary">{p.who_code}</td>
                              <td className="p-2">
                                {p.pinyin}
                                {p.chinese && (
                                  <span className="ml-1 text-muted-foreground">{p.chinese}</span>
                                )}
                              </td>
                              <td className="p-2">{p.name_ru}</td>
                              <td className="p-2 hidden md:table-cell text-xs text-muted-foreground">
                                {m ? `${m.code} · ${m.name_ru}` : "—"}
                              </td>
                              <td className="p-2 hidden lg:table-cell text-xs text-muted-foreground max-w-[300px] truncate">
                                {p.location_description}
                              </td>
                              <td className="p-2">
                                {p.is_caution && (
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Point detail Sheet */}
      <Sheet open={!!openPoint} onOpenChange={(o) => !o && setOpenPoint(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {openPoint && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">
                  <span className="font-mono text-primary">{openPoint.who_code}</span>
                  {openPoint.name_ru && <span className="ml-2">— {openPoint.name_ru}</span>}
                </SheetTitle>
                <SheetDescription>
                  {openPoint.pinyin} {openPoint.chinese && `· ${openPoint.chinese}`}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                {openPoint.meridian_id && (() => {
                  const m = meridianById.get(openPoint.meridian_id);
                  if (!m) return null;
                  return (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{m.code} · {m.name_ru}</Badge>
                      {m.channel_type && <Badge variant="outline">{m.channel_type}</Badge>}
                      {m.polarity && (
                        <Badge variant="outline" className={
                          m.polarity === "yin" ? "border-blue-500/50 text-blue-600 dark:text-blue-400" :
                          m.polarity === "yang" ? "border-orange-500/50 text-orange-600 dark:text-orange-400" : ""
                        }>{m.polarity}</Badge>
                      )}
                    </div>
                  );
                })()}

                {(openPoint.is_caution || openPoint.contraindications) && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-destructive mb-1">
                      <AlertTriangle className="w-4 h-4" /> Внимание / противопоказания
                    </div>
                    {openPoint.is_caution && (
                      <div className="text-xs text-muted-foreground mb-1">
                        Caution-точка: интимная зона / требует особого внимания
                      </div>
                    )}
                    {openPoint.contraindications && (
                      <div className="whitespace-pre-wrap">{openPoint.contraindications}</div>
                    )}
                  </div>
                )}

                {openPoint.location_description && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Локализация
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{openPoint.location_description}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {openPoint.depth_mm && (
                    <div>
                      <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Глубина введения
                      </div>
                      <div className="text-sm">{openPoint.depth_mm} мм</div>
                    </div>
                  )}
                  {openPoint.manipulation_default && (
                    <div>
                      <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Манипуляция
                      </div>
                      <div className="text-sm">{openPoint.manipulation_default}</div>
                    </div>
                  )}
                </div>

                {openPoint.indications && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Показания
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{openPoint.indications}</div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Упоминается в ИРТ-протоколах ({protocolsForPoint.length})
                  </div>
                  {protocolsForPoint.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Не упоминается в текущих протоколах каталога
                    </div>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {protocolsForPoint.map((pr) => (
                        <li key={pr.id}>
                          <Link
                            to={`/admin/treatment-catalog?id=${pr.id}`}
                            className="text-primary hover:underline"
                          >
                            {pr.name}
                          </Link>
                          {pr.subcategory && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              · {pr.subcategory}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
