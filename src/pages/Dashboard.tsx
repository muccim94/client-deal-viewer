import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMeseNome } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from
"@/components/ui/select";
import { Euro, Users, Tag, TrendingUp, TrendingDown, BarChart3, Loader2, Search, X } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from
"@/components/ui/table";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid } from
"recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const COLORS = [
"hsl(215, 70%, 50%)", "hsl(160, 60%, 45%)", "hsl(35, 85%, 55%)",
"hsl(0, 65%, 55%)", "hsl(270, 55%, 55%)", "hsl(190, 65%, 45%)",
"hsl(330, 60%, 55%)", "hsl(50, 75%, 50%)", "hsl(120, 45%, 50%)",
"hsl(200, 70%, 60%)"];


const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [filterAzienda, setFilterAzienda] = useState("FO");
  const [filterAnno, setFilterAnno] = useState("2026");
  const [filterMese, setFilterMese] = useState("__all__");
  const [filterAgente, setFilterAgente] = useState("__all__");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: filterOptions } = useQuery({
    queryKey: ["filter-options"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_filter_options");
      if (error) throw error;
      return data as unknown as {anni: number[];mesi: number[];agenti: string[];};
    }
  });

  const anni = filterOptions?.anni ?? [];
  const mesi = filterOptions?.mesi ?? [];
  const agenti = filterOptions?.agenti ?? [];

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", filterAzienda, filterAnno, filterMese, filterAgente],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats", {
        p_azienda: filterAzienda === "__all__" ? null : filterAzienda,
        p_anno: filterAnno === "__all__" ? null : Number(filterAnno),
        p_mese: filterMese === "__all__" ? null : Number(filterMese),
        p_agente: filterAgente === "__all__" ? null : filterAgente
      });
      if (error) throw error;
      return data as unknown as {
        totale: number;
        clienti: number;
        marchi: number;
        totalePrevYtd: number;
        topClienti: {name: string;codice: string;value: number;valuePrev: number;}[];
        marchiPie: {name: string;value: number;}[];
        monthlyTotals: {mese: number;fatt_current: number;fatt_prev: number;}[];
      };
    }
  });

  const budgetAnno = filterAnno === "__all__" ? new Date().getFullYear() : Number(filterAnno);
  const { data: budgetData } = useQuery({
    queryKey: ["dashboard-budget", budgetAnno, filterAgente],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_budget_data", {
        p_anno: budgetAnno,
        p_agente: filterAgente === "__all__" ? null : filterAgente
      });
      if (error) throw error;
      return data as unknown as {mese: number;budget: number;fatturato: number;}[];
    }
  });

  const { data: clientiList } = useQuery({
    queryKey: ["clienti-search"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_clienti_list");
      if (error) throw error;
      return data as unknown as {codiceCliente: string;nomeCliente: string;}[];
    },
    enabled: searchOpen
  });

  const filteredClienti = useMemo(() => {
    if (!clientiList || !searchQuery.trim()) return clientiList?.slice(0, 20) ?? [];
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const q = normalize(searchQuery);
    return clientiList.filter((c) => normalize(c.nomeCliente).includes(q)).slice(0, 20);
  }, [clientiList, searchQuery]);

  const lastMonthWithData = useMemo(() => {
    if (!stats?.monthlyTotals) return 0;
    return Math.max(0, ...stats.monthlyTotals.filter((m) => m.fatt_current > 0).map((m) => m.mese));
  }, [stats?.monthlyTotals]);

  const chartData = useMemo(() => {
    if (!stats?.monthlyTotals) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const entry = stats.monthlyTotals.find((d) => d.mese === m);
      const budgetEntry = budgetData?.find((b) => b.mese === m);
      return {
        name: monthNames[i],
        current: m <= lastMonthWithData ? entry?.fatt_current ?? 0 : undefined,
        prev: entry?.fatt_prev ?? 0,
        budget: budgetEntry?.budget ?? 0
      };
    });
  }, [stats?.monthlyTotals, budgetData, lastMonthWithData]);

  const budgetYtd = useMemo(() => {
    return budgetData?.filter((b) => b.mese <= lastMonthWithData).reduce((sum, b) => sum + b.budget, 0) ?? 0;
  }, [budgetData, lastMonthWithData]);

  const varBudgetPercent = budgetYtd > 0 ?
  ((stats?.totale ?? 0) - budgetYtd) / budgetYtd * 100 :
  0;
  const isBudgetPositive = varBudgetPercent >= 0;

  const renderEndDot = (props: any) => {
    const { cx, cy, index, payload } = props;
    if (cx == null || cy == null) return null;
    if (payload.current !== undefined && (index === chartData.length - 1 || chartData[index + 1]?.current === undefined)) {
      return <circle cx={cx} cy={cy} r={5} fill="hsl(160, 60%, 45%)" stroke="hsl(var(--background))" strokeWidth={2} />;
    }
    return null;
  };

  const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  const fmtCompact = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
    return fmt(n);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>);

  }

  if (!stats || stats.totale === 0 && stats.clienti === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <BarChart3 className="h-16 w-16 mb-4 opacity-40" />
        <p className="text-lg font-medium">Nessun dato disponibile</p>
        <p className="text-sm">Carica un file Excel dalla sezione Upload per iniziare.</p>
      </div>);

  }

  const varPercent = stats.totalePrevYtd > 0 ?
  (stats.totale - stats.totalePrevYtd) / stats.totalePrevYtd * 100 :
  0;
  const isPositive = varPercent >= 0;

  const kpis = [
  { label: "Fatturato Totale", value: fmtCompact(stats.totale), icon: Euro, to: "/fatturato" },
  { label: "Clienti Unici", value: stats.clienti, icon: Users, to: "/anagrafiche" },
  { label: "Marchi", value: stats.marchi, icon: Tag, to: "/marchi" }];


  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filtri */}
      <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
        <Select value={filterAzienda} onValueChange={setFilterAzienda}>
          <SelectTrigger className="w-full sm:w-44 h-10 sm:h-9 text-sm"><SelectValue placeholder="Tutte le aziende" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutte le aziende</SelectItem>
            <SelectItem value="FO">Fogliani</SelectItem>
            <SelectItem value="FU">Futurtec</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAnno} onValueChange={setFilterAnno}>
          <SelectTrigger className="w-full sm:w-36 h-10 sm:h-9 text-sm"><SelectValue placeholder="Tutti gli anni" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli anni</SelectItem>
            {anni.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMese} onValueChange={setFilterMese}>
          <SelectTrigger className="w-full sm:w-40 h-10 sm:h-9 text-sm"><SelectValue placeholder="Tutti i mesi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti i mesi</SelectItem>
            {mesi.map((m) => <SelectItem key={m} value={String(m)}>{getMeseNome(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAgente} onValueChange={setFilterAgente}>
          <SelectTrigger className="w-full sm:w-44 h-10 sm:h-9 text-sm"><SelectValue placeholder="Tutti gli agenti" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli agenti</SelectItem>
            {agenti.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile: KPI first */}
      <div className="grid grid-cols-3 gap-3 md:hidden">
        {kpis.map((k) =>
        <Card
          key={k.label}
          className="cursor-pointer transition-shadow hover:shadow-lg"
          onClick={() => k.to && navigate(k.to)}>
          
            <CardHeader className="flex flex-row items-center justify-between pb-1 p-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0"><div className="text-base font-bold">{k.value}</div></CardContent>
          </Card>
        )}
      </div>

      {/* Two-column desktop layout */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4 md:space-y-6">
          {/* Fatturato Card with AreaChart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm md:text-base">Totale Fatturato</CardTitle>
              </div>
              <div className="flex items-end justify-between gap-2 mt-1">
                <div className="text-2xl md:text-3xl font-bold px-[10px]">{fmtCompact(stats.totale)}</div>
                <div className="flex flex-col items-end gap-0.5 pb-0.5">
                  <Badge variant={isBudgetPositive ? "default" : "destructive"} className="text-[10px] leading-tight px-1.5 py-0.5">
                    {isBudgetPositive ? "+" : ""}{varBudgetPercent.toFixed(1)}% vs Budget
                  </Badge>
                  <Badge variant={isPositive ? "default" : "destructive"} className="text-[10px] leading-tight px-1.5 py-0.5">
                    {isPositive ? "+" : ""}{varPercent.toFixed(1)}% YoY
                  </Badge>
                </div>
              </div>
              <div className="flex gap-3 ml-[10px] mt-0.5">
                <p className="text-muted-foreground text-xs">
                  vs {fmtCompact(budgetYtd)} budget
                </p>
                <p className="text-muted-foreground text-xs">
                  vs {fmtCompact(stats.totalePrevYtd)} anno prec.
                </p>
              </div>
            </CardHeader>
            <CardContent className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                  
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Area
                    type="monotone"
                    dataKey="prev"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    fill="none"
                    strokeWidth={1.5}
                    name="Anno Prec."
                    connectNulls={false} />
                  
                  <Area
                    type="monotone"
                    dataKey="current"
                    stroke="hsl(160, 60%, 45%)"
                    fill="url(#colorCurrent)"
                    strokeWidth={2}
                    name="Anno Corrente"
                    connectNulls={false}
                    dot={renderEndDot} />
                  
                  <Line
                    type="monotone"
                    dataKey="budget"
                    stroke="hsl(35, 85%, 55%)"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                    name="Budget"
                    connectNulls={true} />
                  
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 10 Clienti */}
          <Card>
            <CardHeader><CardTitle className="text-sm md:text-base">Top 10 Clienti per Fatturato</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-8 px-3"></TableHead>
                    <TableHead className="px-2">Cliente</TableHead>
                    <TableHead className="text-right px-3">Progressivo</TableHead>
                    <TableHead className="text-right px-3 hidden sm:table-cell">Anno Prec.</TableHead>
                    <TableHead className="text-right px-3">Var.%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats.topClienti ?? []).map((c) => {
                    const isUp = c.value >= c.valuePrev;
                    return (
                      <TableRow
                        key={c.codice}
                        style={{ borderLeft: `3px solid ${isUp ? "#22c55e" : "#ef4444"}` }}>
                        
                        <TableCell className="px-3 py-2">
                          {isUp ?
                          <TrendingUp className="h-4 w-4 text-green-500" /> :
                          <TrendingDown className="h-4 w-4 text-red-500" />}
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Link
                            to={`/anagrafiche/${c.codice}`}
                            className="text-sm font-medium truncate hover:underline hover:text-primary block max-w-[160px] md:max-w-[220px]"
                            title={c.name}>
                            
                            {c.name.length > 22 ? c.name.slice(0, 22) + "…" : c.name}
                          </Link>
                        </TableCell>
                        <TableCell className={`text-right px-3 py-2 text-sm font-semibold ${isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {fmtCompact(c.value)}
                        </TableCell>
                        <TableCell className="text-right px-3 py-2 text-sm text-muted-foreground hidden sm:table-cell">
                          {fmtCompact(c.valuePrev)}
                        </TableCell>
                        <TableCell className={`text-right px-3 py-2 text-sm font-semibold ${isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {c.valuePrev > 0 ? `${((c.value - c.valuePrev) / c.valuePrev * 100).toFixed(1)}%` : "—"}
                        </TableCell>
                      </TableRow>);

                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4 md:space-y-6">
          {/* KPI cards - desktop only */}
          <div className="hidden md:grid grid-cols-3 gap-3">
            {kpis.map((k) =>
            <Card
              key={k.label}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => k.to && navigate(k.to)}>
              
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
                  <k.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-lg md:text-2xl font-bold">{k.value}</div></CardContent>
              </Card>
            )}
          </div>

          {/* Distribuzione per Marchio */}
          <Card>
            <CardHeader><CardTitle className="text-sm md:text-base">Distribuzione Vendite per Marchio</CardTitle></CardHeader>
            <CardContent className="h-60 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.marchiPie} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={isMobile ? 70 : 100}
                    label={isMobile ? false : ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}>
                    
                    {stats.marchiPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 14 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAB + Search Dialog */}
      <Button
        className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-50 rounded-full w-12 h-12 shadow-lg"
        size="icon"
        onClick={() => {setSearchOpen(true);setSearchQuery("");}}>
        
        <Search className="h-5 w-5" />
      </Button>

      {isMobile ?
      searchOpen &&
      <>
            <div className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0" onClick={() => setSearchOpen(false)} />
            <div className="fixed inset-x-0 top-0 z-50 bg-background rounded-b-lg shadow-lg max-h-[70vh] flex flex-col animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2 p-3 border-b">
                <Input placeholder="Digita nome cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}><X className="h-4 w-4" /></Button>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-1">
                  {filteredClienti.map((c) =>
              <button key={c.codiceCliente} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors" onClick={() => {setSearchOpen(false);navigate(`/anagrafiche/${c.codiceCliente}`);}}>{c.nomeCliente}</button>
              )}
                </div>
              </ScrollArea>
            </div>
          </> :


      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="sm:max-w-md flex flex-col top-[30%] translate-y-[-30%] sm:top-[50%] sm:translate-y-[-50%]">
            <DialogHeader><DialogTitle>Cerca cliente</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-64">
              <div className="space-y-1">
                {filteredClienti.map((c) =>
              <button key={c.codiceCliente} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors" onClick={() => {setSearchOpen(false);navigate(`/anagrafiche/${c.codiceCliente}`);}}>{c.nomeCliente}</button>
              )}
              </div>
            </ScrollArea>
            <Input placeholder="Digita nome cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
          </DialogContent>
        </Dialog>
      }
    </div>);

}