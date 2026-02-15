import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
  const [search, setSearch] = useState("");
  const [filterAgente, setFilterAgente] = useState("__all__");
  const [sortKey, setSortKey] = useState<SortKey>("nomeCliente");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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
      const q = search.toLowerCase();
      data = data.filter((r) => r.nomeCliente.toLowerCase().includes(q) || r.codiceCliente.includes(q));
    }
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [clienti, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!clienti.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Table2 className="h-16 w-16 mb-4 opacity-40" />
        <p className="text-lg font-medium">Nessun dato disponibile</p>
        <p className="text-sm">Carica un file Excel dalla sezione Upload per iniziare.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base">{filtered.length} clienti</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select value={filterAgente} onValueChange={setFilterAgente}>
                <SelectTrigger className="w-full sm:w-44">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cerca cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("codiceCliente")}>
                    <span className="flex items-center gap-1">Codice<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell w-10">Trend</TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("nomeCliente")}>
                    <span className="flex items-center gap-1">Nome Cliente<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("fattCurrentYear")}>
                    <span className="flex items-center gap-1">{`Fatt. ${currentYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("fattPrevYearYTD")}>
                    <span className="flex items-center gap-1">{`Fatt. ${prevYear} YTD`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("fattPrevYear")}>
                    <span className="flex items-center gap-1">{`Fatt. ${prevYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.codiceCliente} className="group">
                    <TableCell className="hidden sm:table-cell">{r.codiceCliente}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {r.fattCurrentYear >= r.fattPrevYearYTD ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Link to={`/anagrafiche/${r.codiceCliente}`} className="font-medium text-primary hover:underline text-base md:text-lg">
                        {r.nomeCliente}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium text-right tabular-nums text-sm md:text-base">{fmt(r.fattCurrentYear)}</TableCell>
                    <TableCell className="hidden sm:table-cell font-medium text-right tabular-nums">{fmt(r.fattPrevYearYTD)}</TableCell>
                    <TableCell className="hidden sm:table-cell font-medium text-right tabular-nums">{fmt(r.fattPrevYear)}</TableCell>
                    <TableCell>
                      <Link to={`/anagrafiche/${r.codiceCliente}`}>
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
