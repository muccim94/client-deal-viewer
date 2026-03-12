import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnagraficheTabBar } from "@/pages/IncentivazioniBrowser";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Search, Table2, ChevronRight, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type SortKey = "codiceCliente" | "nomeCliente" | "fattCurrentYear" | "fattPrevYearYTD" | "fattPrevYear";
type SortDir = "asc" | "desc";

interface ClientRow {
  codiceCliente: string;
  nomeCliente: string;
  fattCurrentYear: number;
  fattPrevYearYTD: number;
  fattPrevYear: number;
}

export default function Anagrafiche() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterAgente, setFilterAgente] = useState("__all__");
  const [sortKey, setSortKey] = useState<SortKey>("nomeCliente");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFullYear, setShowFullYear] = useState(() => {
    const saved = localStorage.getItem("anagrafiche-show-full-year");
    return saved !== null ? saved === "true" : true;
  });

  const handleToggleFullYear = (checked: boolean) => {
    setShowFullYear(checked);
    localStorage.setItem("anagrafiche-show-full-year", String(checked));
  };

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const { data: agenti = [] } = useQuery({
    queryKey: ["visible-agents"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_visible_agents");
      if (error) throw error;
      return (data as string[]) ?? [];
    },
  });

  const { data: clienti = [], isLoading } = useQuery({
    queryKey: ["clienti-list", filterAgente],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_clienti_list", {
        p_agente: filterAgente === "__all__" ? null : filterAgente,
      });
      if (error) throw error;
      return (data as unknown as ClientRow[]) ?? [];
    },
  });

  const filtered = useMemo(() => {
    let data = clienti;
    if (search) {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "");
      const q = normalize(search);
      data = data.filter((r) => normalize(r.nomeCliente).includes(q) || r.codiceCliente.includes(q));
    }
    // Apply quick filter
    if (activeFilter === "perdita") {
      data = data.filter((r) => r.fattCurrentYear <= r.fattPrevYearYTD);
    } else if (activeFilter === "sotto5k") {
      data = data.filter((r) => r.fattCurrentYear < 5000);
    } else if (activeFilter === "top10") {
      data = [...data].sort((a, b) => b.fattCurrentYear - a.fattCurrentYear).slice(0, 10);
    }
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [clienti, search, sortKey, sortDir, activeFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const fmtCompact = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
    return `${n} €`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <AnagraficheTabBar active="clienti" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!clienti.length) {
    return (
      <div className="space-y-4">
        <AnagraficheTabBar active="clienti" />
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Table2 className="h-16 w-16 mb-4 opacity-40" />
          <p className="text-lg font-medium">Nessun dato disponibile</p>
          <p className="text-sm">Carica un file Excel dalla sezione Upload per iniziare.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-hidden">
      <AnagraficheTabBar active="clienti" />
      <Card>
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base">{filtered.length} clienti</CardTitle>
            <div className="flex flex-row items-center gap-1.5 sm:gap-2">
              <Select value={filterAgente} onValueChange={setFilterAgente}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-44">
                  <SelectValue placeholder="Tutti gli agenti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tutti gli agenti</SelectItem>
                  {agenti.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input placeholder="Cerca cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 sm:pl-9 h-8 sm:h-10 text-xs sm:text-sm" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {[
              { key: "perdita", label: "Clienti in perdita" },
              { key: "sotto5k", label: "Sotto i 5k" },
              { key: "top10", label: "Top 10 clienti" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter((prev) => (prev === f.key ? null : f.key))}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.8rem] sm:px-5 sm:py-2 sm:text-[0.95rem] border transition-colors ${
                  activeFilter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-input hover:bg-accent"
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <Label htmlFor="toggle-full-year" className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Fatt. {prevYear}</Label>
              <Switch id="toggle-full-year" checked={showFullYear} onCheckedChange={handleToggleFullYear} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 min-w-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell cursor-pointer select-none hover:bg-muted/50 px-2 md:px-4" onClick={() => toggleSort("codiceCliente")}>
                    <span className="flex items-center gap-1">Codice<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell w-10">Trend</TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 px-2 md:px-4" onClick={() => toggleSort("nomeCliente")}>
                    <span className="flex items-center gap-1">Nome Cliente<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 px-2 md:px-4 text-right" onClick={() => toggleSort("fattCurrentYear")}>
                    <span className="flex items-center justify-end gap-1">{`Fatt. ${currentYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="hidden md:table-cell cursor-pointer select-none hover:bg-muted/50 px-2 md:px-4" onClick={() => toggleSort("fattPrevYearYTD")}>
                    <span className="flex items-center gap-1">{`Fatt. ${prevYear} YTD`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  {showFullYear && (
                    <TableHead className="hidden sm:table-cell cursor-pointer select-none hover:bg-muted/50 px-2 md:px-4" onClick={() => toggleSort("fattPrevYear")}>
                      <span className="flex items-center gap-1">{`Fatt. ${prevYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                    </TableHead>
                  )}
                  <TableHead className="hidden sm:table-cell w-8 px-0 sm:px-2" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.codiceCliente} className="group cursor-pointer sm:cursor-default" onClick={() => navigate(`/anagrafiche/${r.codiceCliente}`)}>
                    <TableCell className="hidden sm:table-cell px-2 md:px-4">{r.codiceCliente}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {r.fattCurrentYear >= r.fattPrevYearYTD ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="px-3 sm:px-2 md:px-4">
                      <Link to={`/anagrafiche/${r.codiceCliente}`} className="font-medium text-primary hover:underline text-sm md:text-lg" onClick={(e) => e.stopPropagation()}>
                        {r.nomeCliente}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium text-right pr-4 sm:pr-2 md:pr-4 tabular-nums text-sm md:text-base px-1 sm:px-2 md:px-4 whitespace-nowrap">
                      <span className={`sm:text-foreground ${
                        r.fattCurrentYear >= r.fattPrevYearYTD ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span className="sm:hidden">{fmtCompact(r.fattCurrentYear)}</span>
                        <span className="hidden sm:inline">{fmt(r.fattCurrentYear)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-medium text-right tabular-nums px-2 md:px-4">{fmt(r.fattPrevYearYTD)}</TableCell>
                    {showFullYear && <TableCell className="hidden sm:table-cell font-medium text-right tabular-nums px-2 md:px-4">{fmt(r.fattPrevYear)}</TableCell>}
                    <TableCell className="hidden sm:table-cell px-0 sm:px-2 md:px-4 w-8">
                      <Link to={`/anagrafiche/${r.codiceCliente}`} onClick={(e) => e.stopPropagation()}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
