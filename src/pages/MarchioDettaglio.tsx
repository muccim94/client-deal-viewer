import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, ArrowUpDown, Search, Loader2,
  TrendingUp, TrendingDown, Users, DollarSign, AlertTriangle, Sparkles,
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

interface ClienteRow {
  codice_cliente: string;
  nome_cliente: string;
  fatt_current: number;
  fatt_prev_ytd: number;
  fatt_prev_total: number;
  var_pct: number | null;
}

type SortKey = "nome_cliente" | "fatt_current" | "fatt_prev_ytd" | "var_pct";
type SortDir = "asc" | "desc";

const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const fmtCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `€ ${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `€ ${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};

const fmtPct = (n: number | null) => {
  if (n == null) return "N/A";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
};

export default function MarchioDettaglio() {
  const { famiglia } = useParams<{ famiglia: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fatt_current");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["marchio-clienti", famiglia],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_marchio_clienti_stats", {
        p_famiglia: famiglia!,
      });
      if (error) throw error;
      return data as unknown as {
        anno_corrente: number;
        anno_precedente: number;
        max_month: number;
        clienti: { codice_cliente: string; nome_cliente: string; fatt_current: number; fatt_prev_ytd: number; fatt_prev_total: number }[];
      };
    },
    enabled: !!famiglia,
  });

  const clienti: ClienteRow[] = useMemo(() => {
    if (!data?.clienti) return [];
    return data.clienti.map(c => ({
      ...c,
      var_pct: c.fatt_prev_ytd > 0
        ? ((c.fatt_current - c.fatt_prev_ytd) / c.fatt_prev_ytd) * 100
        : c.fatt_current > 0 ? null : null,
    }));
  }, [data]);

  // KPIs
  const totalCurrent = useMemo(() => clienti.reduce((s, c) => s + c.fatt_current, 0), [clienti]);
  const totalPrevYTD = useMemo(() => clienti.reduce((s, c) => s + c.fatt_prev_ytd, 0), [clienti]);
  const totalVar = totalPrevYTD > 0 ? ((totalCurrent - totalPrevYTD) / totalPrevYTD) * 100 : null;
  const activeClients = clienti.filter(c => c.fatt_current > 0).length;

  // Distribution bars (top 3 + others)
  const distribution = useMemo(() => {
    const sorted = [...clienti].sort((a, b) => b.fatt_current - a.fatt_current);
    const top = sorted.slice(0, 3);
    const others = sorted.slice(3);
    const othersTotal = others.reduce((s, c) => s + c.fatt_current, 0);
    const items = top.map(c => ({
      label: c.nome_cliente,
      value: c.fatt_current,
      pct: totalCurrent > 0 ? (c.fatt_current / totalCurrent) * 100 : 0,
    }));
    if (others.length > 0 && othersTotal > 0) {
      items.push({
        label: `Altri ${others.length}`,
        value: othersTotal,
        pct: totalCurrent > 0 ? (othersTotal / totalCurrent) * 100 : 0,
      });
    }
    return items;
  }, [clienti, totalCurrent]);

  // Scatter data
  const scatterData = useMemo(() =>
    clienti
      .filter(c => c.fatt_current > 0 && c.var_pct !== null)
      .map(c => ({
        x: c.fatt_current,
        y: c.var_pct!,
        z: c.fatt_current,
        name: c.nome_cliente,
        codice: c.codice_cliente,
      })),
    [clienti]
  );

  // Insights
  const declining = useMemo(() =>
    clienti.filter(c => c.var_pct !== null && c.var_pct < -20).sort((a, b) => a.var_pct! - b.var_pct!),
    [clienti]
  );
  const growing = useMemo(() =>
    clienti.filter(c => c.var_pct !== null && c.var_pct > 50).sort((a, b) => b.var_pct! - a.var_pct!),
    [clienti]
  );

  // Filtered & sorted table
  const maxFatt = useMemo(() => Math.max(1, ...clienti.map(c => c.fatt_current)), [clienti]);

  const filtered = useMemo(() => {
    let d = clienti;
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(c => c.nome_cliente.toLowerCase().includes(q) || c.codice_cliente.includes(q));
    }
    return [...d].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [clienti, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const annoCorrente = data?.anno_corrente ?? new Date().getFullYear();
  const annoPrecedente = data?.anno_precedente ?? annoCorrente - 1;

  const DIST_COLORS = [
    "hsl(var(--primary))",
    "hsl(210, 70%, 55%)",
    "hsl(280, 60%, 55%)",
    "hsl(var(--muted-foreground))",
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/marchi")}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{famiglia} — Analisi Clienti</h1>
          <p className="text-sm text-muted-foreground">
            Dettaglio clienti per famiglia marchio {famiglia}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Fatturato {annoCorrente}</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-2xl font-bold">{fmtCompact(totalCurrent)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Crescita vs {annoPrecedente}</p>
              {totalVar != null && totalVar >= 0
                ? <TrendingUp className="h-4 w-4 text-green-500" />
                : <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className={cn("text-2xl font-bold", totalVar != null && totalVar >= 0 ? "text-green-600" : "text-red-600")}>
              {fmtPct(totalVar)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Progressivo YTD</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Clienti attivi</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-2xl font-bold">{activeClients}</span>
            <p className="text-xs text-muted-foreground mt-1">su {clienti.length} totali</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution + Scatter in 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribuzione fatturato clienti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {distribution.map((d, i) => (
              <div key={d.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[60%]">{d.label}</span>
                  <span className="text-muted-foreground tabular-nums">{fmtCompact(d.value)} ({d.pct.toFixed(1)}%)</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${d.pct}%`,
                      backgroundColor: DIST_COLORS[Math.min(i, DIST_COLORS.length - 1)],
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Scatter Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Crescita clienti</CardTitle>
          </CardHeader>
          <CardContent>
            {scatterData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Fatturato"
                      tick={{ fontSize: 10 }}
                      tickFormatter={v => fmtCompact(v)}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Var %"
                      tick={{ fontSize: 10 }}
                      tickFormatter={v => `${v.toFixed(0)}%`}
                      className="fill-muted-foreground"
                    />
                    <ZAxis type="number" dataKey="z" range={[40, 400]} />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
                            <p className="font-semibold">{d.name}</p>
                            <p>Fatturato: {fmt(d.x)}</p>
                            <p>Var: {fmtPct(d.y)}</p>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={scatterData}>
                      {scatterData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.y >= 0 ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"}
                          fillOpacity={0.7}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Dati insufficienti per il grafico</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clienti Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <CardTitle className="text-base">Clienti che acquistano {famiglia}</CardTitle>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cerca cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("nome_cliente")}>
                    <span className="flex items-center gap-1">Cliente <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="w-[120px] hidden sm:table-cell">Quota</TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("fatt_current")}>
                    <span className="flex items-center gap-1">Fatt. {annoCorrente} <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 hidden sm:table-cell" onClick={() => toggleSort("fatt_prev_ytd")}>
                    <span className="flex items-center gap-1">Progr. {annoPrecedente} <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("var_pct")}>
                    <span className="flex items-center gap-1">Var % <ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow
                    key={c.codice_cliente}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/anagrafiche/${c.codice_cliente}`)}
                  >
                    <TableCell className="font-medium max-w-[200px] truncate">{c.nome_cliente}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(c.fatt_current / maxFatt) * 100}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(c.fatt_current)}</TableCell>
                    <TableCell className="text-right tabular-nums hidden sm:table-cell">{fmt(c.fatt_prev_ytd)}</TableCell>
                    <TableCell className="text-right">
                      {c.var_pct != null ? (
                        <Badge
                          variant={c.var_pct >= 0 ? "default" : "destructive"}
                          className={c.var_pct >= 0 ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {fmtPct(c.var_pct)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="font-bold">
                  <TableCell>TOTALE</TableCell>
                  <TableCell className="hidden sm:table-cell" />
                  <TableCell className="text-right tabular-nums">{fmt(totalCurrent)}</TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">{fmt(totalPrevYTD)}</TableCell>
                  <TableCell className="text-right">
                    {totalVar != null ? (
                      <Badge
                        variant={totalVar >= 0 ? "default" : "destructive"}
                        className={totalVar >= 0 ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {fmtPct(totalVar)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {(declining.length > 0 || growing.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {declining.length > 0 && (
            <Alert variant="destructive" className="border-red-300 dark:border-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Clienti in forte calo (&gt; -20%)</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {declining.slice(0, 5).map(c => (
                    <li key={c.codice_cliente} className="flex justify-between text-sm">
                      <span className="truncate max-w-[60%]">{c.nome_cliente}</span>
                      <span className="font-semibold">{fmtPct(c.var_pct)}</span>
                    </li>
                  ))}
                  {declining.length > 5 && (
                    <li className="text-sm text-muted-foreground">...e altri {declining.length - 5}</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {growing.length > 0 && (
            <Alert className="border-green-300 dark:border-green-800">
              <Sparkles className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">Clienti in forte crescita (&gt; +50%)</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {growing.slice(0, 5).map(c => (
                    <li key={c.codice_cliente} className="flex justify-between text-sm">
                      <span className="truncate max-w-[60%]">{c.nome_cliente}</span>
                      <span className="font-semibold text-green-600">{fmtPct(c.var_pct)}</span>
                    </li>
                  ))}
                  {growing.length > 5 && (
                    <li className="text-sm text-muted-foreground">...e altri {growing.length - 5}</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
