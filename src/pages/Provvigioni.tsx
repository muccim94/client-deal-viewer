import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getMeseNome } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Coins, Search, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const MESI_SHORT = ["", "Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

interface ProvvigioneRow {
  codice: string;
  nome: string;
  azienda: string;
  aziendaNome: string;
  totale: number;
}

interface ChartData {
  total_current: number;
  total_prev: number;
  max_month: number;
  current_year: number;
  prev_year: number;
  monthly_totals: { mese: number; provv_current: number; provv_prev: number }[];
}

export default function Provvigioni() {
  const { role, canViewProvvigioni } = useAuth();
  const [filterAzienda, setFilterAzienda] = useState("FO");
  const [filterMeseDa, setFilterMeseDa] = useState("1");
  const [filterMeseA, setFilterMeseA] = useState<string | null>(null);
  const [filterAgente, setFilterAgente] = useState("__all__");
  const [search, setSearch] = useState("");

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

  const agenti = filterOptions?.agenti ?? [];

  // Chart data
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["provvigioni-chart", filterAzienda, filterMeseDa, filterMeseA, filterAgente],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_provvigioni_chart", {
        p_azienda: filterAzienda === "__all__" ? null : filterAzienda,
        p_mese_da: Number(filterMeseDa),
        p_mese_a: filterMeseA ? Number(filterMeseA) : null,
        p_agente: filterAgente === "__all__" ? null : filterAgente,
      });
      if (error) throw error;
      return data as unknown as ChartData;
    },
  });

  const effectiveMeseA = filterMeseA ? Number(filterMeseA) : (chartData?.max_month ?? new Date().getMonth() + 1);

  // Table data — use current year, month range
  const { data: grouped = [], isLoading: tableLoading } = useQuery({
    queryKey: ["provvigioni", filterAzienda, filterMeseDa, effectiveMeseA, filterAgente],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_provvigioni_grouped", {
        p_azienda: filterAzienda === "__all__" ? null : filterAzienda,
        p_anno: currentYear,
        p_mese_da: Number(filterMeseDa),
        p_mese_a: effectiveMeseA,
        p_agente: filterAgente === "__all__" ? null : filterAgente,
      });
      if (error) throw error;
      return (data as unknown as ProvvigioneRow[]) ?? [];
    },
    enabled: !!chartData, // wait for chart to know effectiveMeseA
  });

  const isLoading = chartLoading || tableLoading;

  const results = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped.filter((r) => r.nome.toLowerCase().includes(q) || r.codice.includes(q));
  }, [grouped, search]);

  const totaleProvvigioni = chartData?.total_current ?? 0;
  const totalePrev = chartData?.total_prev ?? 0;
  const totalVar = totalePrev > 0 ? ((totaleProvvigioni - totalePrev) / totalePrev) * 100 : null;

  // Chart rendering
  const lastMonthWithData = useMemo(() => {
    if (!chartData?.monthly_totals) return 0;
    return Math.max(0, ...chartData.monthly_totals.filter(m => m.provv_current > 0).map(m => m.mese));
  }, [chartData?.monthly_totals]);

  const areaChartData = useMemo(() => {
    if (!chartData?.monthly_totals) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const entry = chartData.monthly_totals.find(d => d.mese === m);
      return {
        name: MESI_SHORT[m],
        current: m <= lastMonthWithData ? (entry?.provv_current ?? 0) : undefined,
        prev: entry?.provv_prev ?? 0,
      };
    });
  }, [chartData?.monthly_totals, lastMonthWithData]);

  const fmt = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
    return `${Math.round(n)}`;
  };

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  const fmtPct = (n: number | null) => {
    if (n == null) return null;
    return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  };

  if (role !== "admin" && !canViewProvvigioni) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Coins className="h-16 w-16 mb-4 opacity-40" />
        <p className="text-lg font-medium">Accesso non consentito</p>
        <p className="text-sm">Non hai i permessi per visualizzare le provvigioni.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters — same layout as Marchi */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Left: Azienda toggle */}
        <div className="inline-flex rounded-lg border bg-muted p-0.5 sm:p-1">
          {[{ label: "Fogliani", value: "FO" }, { label: "Futurtec", value: "FU" }].map(az => (
            <button
              key={az.value}
              onClick={() => setFilterAzienda(az.value)}
              className={cn(
                "px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all",
                filterAzienda === az.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {az.label}
            </button>
          ))}
        </div>

        {/* Center: Period selectors */}
        <div className="flex items-center gap-1.5 sm:mx-auto">
          <span className="text-xs text-muted-foreground font-medium">Da</span>
          <Select value={filterMeseDa} onValueChange={v => { setFilterMeseDa(v); if (Number(v) > effectiveMeseA) setFilterMeseA(v); }}>
            <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-[100px] sm:w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <SelectItem key={m} value={String(m)}>{getMeseNome(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground font-medium">A</span>
          <Select value={String(effectiveMeseA)} onValueChange={v => setFilterMeseA(v)}>
            <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-[100px] sm:w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <SelectItem key={m} value={String(m)}>{getMeseNome(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right: Agente toggle */}
        <div className="inline-flex rounded-lg border bg-muted p-0.5 sm:p-1 sm:ml-auto overflow-x-auto max-w-full">
          {agenti.length <= 5 ? (
            <>
              <button
                onClick={() => setFilterAgente("__all__")}
                className={cn(
                  "px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                  filterAgente === "__all__"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tutti
              </button>
              {agenti.map(a => (
                <button
                  key={a}
                  onClick={() => setFilterAgente(a)}
                  className={cn(
                    "px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                    filterAgente === a
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {a}
                </button>
              ))}
            </>
          ) : (
            <Select value={filterAgente} onValueChange={setFilterAgente}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm border-0 bg-transparent shadow-none w-[140px]"><SelectValue placeholder="Agente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tutti gli agenti</SelectItem>
                {agenti.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Chart Widget */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Totale Provvigioni</p>
              <div className="mt-1">
                <span className="text-2xl sm:text-3xl font-bold">{fmt(totaleProvvigioni)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs {fmt(totalePrev)} prog. {prevYear}</p>
            </div>
            {totalVar != null && (
              <div className="flex items-start pt-1">
                <Badge
                  variant={totalVar >= 0 ? "default" : "destructive"}
                  className={cn("text-sm", totalVar >= 0 ? "bg-green-600 hover:bg-green-700" : "")}
                >
                  {totalVar >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {fmtPct(totalVar)}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[140px] sm:h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProvvCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} className="fill-muted-foreground" hide />
                <Tooltip
                  formatter={(value: number) => fmtCurrency(value)}
                  labelFormatter={l => `Mese: ${l}`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                />
                <Area type="monotone" dataKey="current" stroke="hsl(142, 71%, 45%)" fill="url(#colorProvvCurrent)" strokeWidth={2} name={String(currentYear)} connectNulls={false} />
                <Area type="monotone" dataKey="prev" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={1.5} strokeDasharray="5 5" name={String(prevYear)} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Codice</TableHead>
                  <TableHead>Nome Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Azienda</TableHead>
                  <TableHead className="text-right">Provvigione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nessun risultato trovato
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((r) => (
                    <TableRow key={`${r.azienda}_${r.codice}`}>
                      <TableCell className="hidden sm:table-cell font-mono text-sm px-2 sm:px-4">{r.codice}</TableCell>
                      <TableCell className="text-sm px-2 sm:px-4"><span className="block max-w-[150px] sm:max-w-none truncate">{r.nome}</span></TableCell>
                      <TableCell className="hidden sm:table-cell px-2 sm:px-4">{r.aziendaNome}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-xs sm:text-sm px-2 sm:px-4">{fmtCurrency(r.totale)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
