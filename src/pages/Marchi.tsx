import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMeseNome } from "@/types/data";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown, Search, Tag, Loader2, TrendingUp, TrendingDown, Trophy,
  Zap, Cable, Sun, Wrench,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// Marchi premianti from Excel
const MARCHI_PREMIANTI = ["VIW", "DIS", "IBO", "INS", "BTI", "GEW", "LEG", "PHL", "LDV", "SNR", "FOS", "SIE", "ABB", "HAG", "PHA"];

type SortKey = "marchio" | "fattCurrentYear" | "fattPrevYearYTD" | "var";
type SortDir = "asc" | "desc";

interface BrandRow {
  marchio: string;
  fattCurrentYear: number;
  fattPrevYear: number;
  fattPrevYearYTD: number;
  var: number | null;
  sparkline: { mese: number; value: number }[];
}

interface MonthlyTotal {
  mese: number;
  fatt_current: number;
  fatt_prev: number;
}

interface BrandMonthly {
  marchio: string;
  mese: number;
  fatt_current: number;
  fatt_prev: number;
}

const getFamiglia = (marchio: string) => marchio.slice(0, 3).toUpperCase();

const MESI_SHORT = ["", "Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

function MiniSparkline({ data, color = "hsl(142, 71%, 45%)" }: { data: { mese: number; value: number }[]; color?: string }) {
  if (!data.length) return null;
  return (
    <LineChart width={40} height={18} data={data}>
      <Line type="monotone" dataKey="value" stroke={color} dot={false} strokeWidth={1.5} />
    </LineChart>
  );
}

export default function Marchi() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fattCurrentYear");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterAgente, setFilterAgente] = useState("__all__");
  const [filterTop, setFilterTop] = useState(false);
  const [filterAnno, setFilterAnno] = useState<string>(String(new Date().getFullYear()));
  const [filterMese, setFilterMese] = useState("__all__");
  const [filterAzienda, setFilterAzienda] = useState("Fogliani");

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_filter_options");
      if (error) throw error;
      return data as unknown as { anni: number[]; mesi: number[]; agenti: string[] };
    },
  });

  const anni = filterOptions?.anni ?? [];
  const mesi = filterOptions?.mesi ?? [];
  const agenti = filterOptions?.agenti ?? [];

  const { data: marchiData, isLoading } = useQuery({
    queryKey: ["marchi-stats", filterAzienda, filterAnno, filterMese, filterAgente],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_marchi_stats", {
        p_azienda_nome: filterAzienda || null,
        p_anno: filterAnno === "__all__" ? null : Number(filterAnno),
        p_mese: filterMese === "__all__" ? null : Number(filterMese),
        p_agente: filterAgente === "__all__" ? null : filterAgente,
      });
      if (error) throw error;
      return data as unknown as {
        kpi: { mat_elettrico: number; fotovoltaico: number; cavo: number; ricambi: number };
        brands: { marchio: string; fattCurrentYear: number; fattPrevYear: number; fattPrevYearYTD: number }[];
        monthly_totals: MonthlyTotal[];
        brand_monthly: BrandMonthly[];
      };
    },
  });

  // Build brand monthly map for sparklines
  const brandMonthlyMap = useMemo(() => {
    const map = new Map<string, { mese: number; value: number }[]>();
    if (!marchiData?.brand_monthly) return map;
    for (const bm of marchiData.brand_monthly) {
      const fam = getFamiglia(bm.marchio);
      if (!map.has(fam)) map.set(fam, []);
      const arr = map.get(fam)!;
      const existing = arr.find(e => e.mese === bm.mese);
      if (existing) existing.value += bm.fatt_current;
      else arr.push({ mese: bm.mese, value: bm.fatt_current });
    }
    // Sort each by mese
    for (const [, arr] of map) arr.sort((a, b) => a.mese - b.mese);
    return map;
  }, [marchiData?.brand_monthly]);

  // Group brands by family
  const brands: BrandRow[] = useMemo(() => {
    if (!marchiData?.brands) return [];
    const familyMap = new Map<string, { fattCurrentYear: number; fattPrevYear: number; fattPrevYearYTD: number }>();
    for (const b of marchiData.brands) {
      const fam = getFamiglia(b.marchio);
      const existing = familyMap.get(fam);
      if (existing) {
        existing.fattCurrentYear += b.fattCurrentYear;
        existing.fattPrevYear += b.fattPrevYear;
        existing.fattPrevYearYTD += b.fattPrevYearYTD;
      } else {
        familyMap.set(fam, { fattCurrentYear: b.fattCurrentYear, fattPrevYear: b.fattPrevYear, fattPrevYearYTD: b.fattPrevYearYTD });
      }
    }
    return Array.from(familyMap.entries()).map(([marchio, v]) => ({
      marchio,
      ...v,
      var: v.fattPrevYearYTD > 0 ? ((v.fattCurrentYear - v.fattPrevYearYTD) / v.fattPrevYearYTD) * 100 : null,
      sparkline: brandMonthlyMap.get(marchio) ?? [],
    }));
  }, [marchiData?.brands, brandMonthlyMap]);

  // Totals for header card
  const totalCurrent = useMemo(() => brands.reduce((s, b) => s + b.fattCurrentYear, 0), [brands]);
  const totalPrevYTD = useMemo(() => brands.reduce((s, b) => s + b.fattPrevYearYTD, 0), [brands]);
  const totalVar = totalPrevYTD > 0 ? ((totalCurrent - totalPrevYTD) / totalPrevYTD) * 100 : null;

  // Monthly totals for area chart
  // Find last month with current year data
  const lastMonthWithData = useMemo(() => {
    if (!marchiData?.monthly_totals) return 0;
    return Math.max(0, ...marchiData.monthly_totals.filter(m => m.fatt_current > 0).map(m => m.mese));
  }, [marchiData?.monthly_totals]);

  const chartData = useMemo(() => {
    if (!marchiData?.monthly_totals) return [];
    // Build all 12 months, current year line stops at lastMonthWithData
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const entry = marchiData.monthly_totals.find((d: MonthlyTotal) => d.mese === m);
      return {
        name: MESI_SHORT[m],
        current: m <= lastMonthWithData ? (entry?.fatt_current ?? 0) : undefined,
        prev: entry?.fatt_prev ?? 0,
      };
    });
  }, [marchiData?.monthly_totals, lastMonthWithData]);

  // Top 3 growing, declining, premianti
  const top3Growing = useMemo(() =>
    [...brands].filter(b => b.var !== null && b.var > 0).sort((a, b) => b.var! - a.var!).slice(0, 3),
    [brands]
  );
  const top3Declining = useMemo(() =>
    [...brands].filter(b => b.var !== null && b.var < 0).sort((a, b) => a.var! - b.var!).slice(0, 3),
    [brands]
  );
  const top3Premianti = useMemo(() =>
    [...brands].filter(b => MARCHI_PREMIANTI.includes(b.marchio)).sort((a, b) => b.fattCurrentYear - a.fattCurrentYear).slice(0, 3),
    [brands]
  );

  // Filtered & sorted table
  const filtered = useMemo(() => {
    let data = brands;
    if (filterTop) data = data.filter(r => MARCHI_PREMIANTI.includes(r.marchio));
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r => r.marchio.toLowerCase().includes(q));
    }
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [brands, search, sortKey, sortDir, filterTop]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  const fmtCompact = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `€ ${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `€ ${(n / 1_000).toFixed(0)}K`;
    return fmt(n);
  };

  const fmtPct = (n: number | null) => {
    if (n == null) return null;
    return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brands.length && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Tag className="h-16 w-16 mb-4 opacity-40" />
        <p className="text-lg font-medium">Nessun dato disponibile</p>
        <p className="text-sm">Carica un file Excel dalla sezione Upload per iniziare.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
        <div className="inline-flex rounded-lg border bg-muted p-0.5 sm:p-1 mr-auto">
          {["Fogliani", "Futurtec"].map(az => (
            <button
              key={az}
              onClick={() => setFilterAzienda(az)}
              className={cn(
                "px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all",
                filterAzienda === az
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {az}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:flex gap-2">
          <Select value={filterAnno} onValueChange={setFilterAnno}>
            <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm sm:w-40"><SelectValue placeholder="Anno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tutti gli anni</SelectItem>
              {anni.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterMese} onValueChange={setFilterMese}>
            <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm sm:w-48"><SelectValue placeholder="Mese" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tutti i mesi</SelectItem>
              {mesi.map(m => <SelectItem key={m} value={String(m)}>{getMeseNome(m)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterAgente} onValueChange={setFilterAgente}>
            <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm sm:w-56"><SelectValue placeholder="Agenti" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tutti gli agenti</SelectItem>
              {agenti.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Total Revenue Card with Area Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Totale Fatturato</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl sm:text-3xl font-bold">{fmtCompact(totalCurrent)}</span>
                {totalVar != null && (
                  <Badge
                    variant={totalVar >= 0 ? "default" : "destructive"}
                    className={cn("text-sm", totalVar >= 0 ? "bg-green-600 hover:bg-green-700" : "")}
                  >
                    {totalVar >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {fmtPct(totalVar)}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs {fmtCompact(totalPrevYTD)} prog. {prevYear}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[140px] sm:h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmtCompact(v)} className="fill-muted-foreground" hide />
                <Tooltip
                  formatter={(value: number) => fmt(value)}
                  labelFormatter={l => `Mese: ${l}`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                />
                <Area type="monotone" dataKey="current" stroke="hsl(142, 71%, 45%)" fill="url(#colorCurrent)" strokeWidth={2} name={String(currentYear)} />
                <Area type="monotone" dataKey="prev" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={1.5} strokeDasharray="5 5" name={String(prevYear)} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Mat. Elettrico", value: marchiData?.kpi?.mat_elettrico ?? 0, icon: Zap, color: "text-blue-500" },
          { label: "Cavo", value: marchiData?.kpi?.cavo ?? 0, icon: Cable, color: "text-orange-500" },
          { label: "Fotovoltaico", value: marchiData?.kpi?.fotovoltaico ?? 0, icon: Sun, color: "text-yellow-500" },
          { label: "Risorsa Utilizzata", value: marchiData?.kpi?.ricambi ?? 0, icon: Wrench, color: "text-muted-foreground" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <kpi.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <span className="text-lg sm:text-2xl font-bold">{fmtCompact(kpi.value)}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Brands Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{filtered.length} Marchi</CardTitle>
              <button
                onClick={() => setFilterTop(v => !v)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-bold border transition-all",
                  filterTop
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : "bg-transparent text-yellow-600 border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
                )}
              >
                TOP
              </button>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cerca marchio..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-auto">
            <Table className="text-sm sm:text-[1.05rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 px-1.5 sm:px-[10px]" onClick={() => toggleSort("marchio")}>
                    <span className="flex items-center gap-1">Marchio<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 px-1.5 sm:px-[10px]" onClick={() => toggleSort("fattCurrentYear")}>
                    <span className="flex items-center gap-1">{`Fatt. ${currentYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 px-1.5 sm:px-[10px] hidden sm:table-cell" onClick={() => toggleSort("fattPrevYearYTD")}>
                    <span className="flex items-center gap-1">{`Progr. ${prevYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 px-1.5 sm:px-[10px]" onClick={() => toggleSort("var")}>
                    <span className="flex items-center gap-1">Var.&nbsp;%<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const pctVal = fmtPct(r.var);
                  return (
                    <TableRow key={r.marchio}>
                      <TableCell className="font-medium py-1.5 px-1.5 sm:py-2 sm:px-2">
                        <div className="flex items-center gap-1.5">
                          {r.marchio}
                          {MARCHI_PREMIANTI.includes(r.marchio) && (
                            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] px-1.5 py-0 leading-tight">TOP</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-1.5 px-1.5 sm:py-2 sm:px-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="hidden sm:inline"><MiniSparkline data={r.sparkline} color={r.var != null && r.var >= 0 ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"} /></span>
                          <span className="tabular-nums">{fmt(r.fattCurrentYear)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums py-1.5 px-1.5 sm:py-2 sm:px-2 hidden sm:table-cell">{fmt(r.fattPrevYearYTD)}</TableCell>
                      <TableCell className="text-right py-1.5 px-1.5 sm:py-2 sm:px-2">
                        {pctVal != null ? (
                          <Badge variant={r.var! >= 0 ? "default" : "destructive"} className={r.var! >= 0 ? "bg-green-600 hover:bg-green-700" : ""}>
                            {pctVal}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
        {/* Growing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" /> Marchi in crescita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {top3Growing.map(b => (
              <div key={b.marchio} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MiniSparkline data={b.sparkline} color="hsl(142, 71%, 45%)" />
                  <span className="font-medium text-sm">{b.marchio}</span>
                </div>
                <span className="text-sm font-semibold text-green-600">{fmtPct(b.var)}</span>
              </div>
            ))}
            {!top3Growing.length && <p className="text-sm text-muted-foreground">Nessun dato</p>}
          </CardContent>
        </Card>

        {/* Declining */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-500" /> Marchi in calo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {top3Declining.map(b => (
              <div key={b.marchio} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MiniSparkline data={b.sparkline} color="hsl(0, 84%, 60%)" />
                  <span className="font-medium text-sm">{b.marchio}</span>
                </div>
                <span className="text-sm font-semibold text-red-600">{fmtPct(b.var)}</span>
              </div>
            ))}
            {!top3Declining.length && <p className="text-sm text-muted-foreground">Nessun dato</p>}
          </CardContent>
        </Card>

        {/* Premianti */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4 text-yellow-500" /> Marchi TOP (Premianti)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {top3Premianti.map(b => (
              <div key={b.marchio} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MiniSparkline data={b.sparkline} color="hsl(45, 93%, 47%)" />
                  <span className="font-medium text-sm">{b.marchio}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmtCompact(b.fattCurrentYear)}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">{fmtCompact(b.fattPrevYearYTD)}</p>
                </div>
              </div>
            ))}
            {!top3Premianti.length && <p className="text-sm text-muted-foreground">Nessun dato</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
