import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMeseNome } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Euro, Users, Tag, TrendingUp, TrendingDown, BarChart3, Loader2, Search } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const COLORS = [
  "hsl(215, 70%, 50%)", "hsl(160, 60%, 45%)", "hsl(35, 85%, 55%)",
  "hsl(0, 65%, 55%)", "hsl(270, 55%, 55%)", "hsl(190, 65%, 45%)",
  "hsl(330, 60%, 55%)", "hsl(50, 75%, 50%)", "hsl(120, 45%, 50%)",
  "hsl(200, 70%, 60%)",
];

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
      return data as unknown as { anni: number[]; mesi: number[]; agenti: string[] };
    },
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
        p_agente: filterAgente === "__all__" ? null : filterAgente,
      });
      if (error) throw error;
      return data as unknown as {
        totale: number;
        clienti: number;
        marchi: number;
        topClienti: { name: string; codice: string; value: number; valuePrev: number }[];
        marchiPie: { name: string; value: number }[];
      };
    },
  });

  const { data: clientiList } = useQuery({
    queryKey: ["clienti-search"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_clienti_list");
      if (error) throw error;
      return data as unknown as { codiceCliente: string; nomeCliente: string }[];
    },
    enabled: searchOpen,
  });

  const filteredClienti = useMemo(() => {
    if (!clientiList || !searchQuery.trim()) return clientiList?.slice(0, 20) ?? [];
    const q = searchQuery.toLowerCase();
    return clientiList.filter((c) => c.nomeCliente.toLowerCase().includes(q)).slice(0, 20);
  }, [clientiList, searchQuery]);

  const topClientiWithPrev = stats?.topClienti ?? [];

  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats || (stats.totale === 0 && stats.clienti === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <BarChart3 className="h-16 w-16 mb-4 opacity-40" />
        <p className="text-lg font-medium">Nessun dato disponibile</p>
        <p className="text-sm">Carica un file Excel dalla sezione Upload per iniziare.</p>
      </div>
    );
  }

  const mediaCliente = stats.clienti ? stats.totale / stats.clienti : 0;

  const kpis = [
    { label: "Fatturato Totale", value: fmt(stats.totale), icon: Euro, to: "/fatturato" },
    { label: "Clienti Unici", value: stats.clienti, icon: Users, to: "/anagrafiche" },
    { label: "Marchi", value: stats.marchi, icon: Tag, to: "/marchi" },
    { label: "Media per Cliente", value: fmt(mediaCliente), icon: TrendingUp, to: null },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filtri */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <Select value={filterAzienda} onValueChange={setFilterAzienda}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Tutte le aziende" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutte le aziende</SelectItem>
            <SelectItem value="FO">Fogliani</SelectItem>
            <SelectItem value="FU">Futurtec</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAnno} onValueChange={setFilterAnno}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Tutti gli anni" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli anni</SelectItem>
            {anni.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMese} onValueChange={setFilterMese}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Tutti i mesi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti i mesi</SelectItem>
            {mesi.map((m) => <SelectItem key={m} value={String(m)}>{getMeseNome(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAgente} onValueChange={setFilterAgente}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Tutti gli agenti" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli agenti</SelectItem>
            {agenti.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k) => (
          <Card
            key={k.label}
            className={k.to ? "cursor-pointer transition-shadow hover:shadow-lg" : ""}
            onClick={k.to ? () => navigate(k.to) : undefined}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-lg md:text-2xl font-bold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Top 10 Clienti */}
        <Card>
          <CardHeader><CardTitle className="text-sm md:text-base">Top 10 Clienti per Fatturato</CardTitle></CardHeader>
          <CardContent className="p-0 md:p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8 px-3"></TableHead>
                  <TableHead className="px-2">Cliente</TableHead>
                  <TableHead className="text-right px-3">Fatturato{"\n"}Progressivo</TableHead>
                  <TableHead className="text-right px-3 hidden sm:table-cell">Anno Prec.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClientiWithPrev.map((c) => {
                  const isUp = c.value >= c.valuePrev;
                  return (
                    <TableRow
                      key={c.codice}
                      className={`border-l-2 ${isUp ? "border-l-green-500" : "border-l-red-500"}`}
                    >
                      <TableCell className="px-3 py-2">
                        {isUp
                          ? <TrendingUp className="h-4 w-4 text-green-500" />
                          : <TrendingDown className="h-4 w-4 text-red-500" />}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <Link
                          to={`/anagrafiche/${c.codice}`}
                          className="text-sm font-medium truncate hover:underline hover:text-primary block max-w-[160px] md:max-w-[220px]"
                          title={c.name}
                        >
                          {c.name.length > 22 ? c.name.slice(0, 22) + "…" : c.name}
                        </Link>
                      </TableCell>
                      <TableCell className={`text-right px-3 py-2 text-sm font-semibold ${isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {fmt(c.value)}
                      </TableCell>
                      <TableCell className="text-right px-3 py-2 text-sm text-muted-foreground hidden sm:table-cell">
                        {fmt(c.valuePrev)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                  labelLine={false}
                >
                  {stats.marchiPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 14 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mobile FAB + Search Dialog */}
      {isMobile && (
        <>
          <Button
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full w-12 h-12 shadow-lg"
            size="icon"
            onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cerca cliente</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="Digita nome cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  {filteredClienti.map((c) => (
                    <button
                      key={c.codiceCliente}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(`/anagrafiche/${c.codiceCliente}`);
                      }}
                    >
                      {c.nomeCliente}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
