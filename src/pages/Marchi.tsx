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
import { ArrowUpDown, Search, Tag, Zap, Sun, Cable, Wrench, Loader2 } from "lucide-react";

type SortKey = "marchio" | "fattCurrentYear" | "fattPrevYearYTD" | "fattPrevYear" | "var";
type SortDir = "asc" | "desc";

interface BrandRow {
  marchio: string;
  fattCurrentYear: number;
  fattPrevYear: number;
  fattPrevYearYTD: number;
  var: number | null;
}

const getFamiglia = (marchio: string) => marchio.slice(0, 3).toUpperCase();

export default function Marchi() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fattCurrentYear");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterAgente, setFilterAgente] = useState("__all__");
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
      };
    },
  });

  const kpi = marchiData?.kpi ?? { mat_elettrico: 0, fotovoltaico: 0, cavo: 0, ricambi: 0 };

  // Group brands by family (first 3 chars) and compute var %
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
        familyMap.set(fam, {
          fattCurrentYear: b.fattCurrentYear,
          fattPrevYear: b.fattPrevYear,
          fattPrevYearYTD: b.fattPrevYearYTD,
        });
      }
    }
    return Array.from(familyMap.entries()).map(([marchio, v]) => ({
      marchio,
      ...v,
      var: v.fattPrevYearYTD > 0 ? ((v.fattCurrentYear - v.fattPrevYearYTD) / v.fattPrevYearYTD) * 100 : null,
    }));
  }, [marchiData]);

  const filtered = useMemo(() => {
    let data = brands;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.marchio.toLowerCase().includes(q));
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
  }, [brands, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

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
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
        <div className="inline-flex rounded-lg border bg-muted p-1 mr-auto">
          {["Fogliani", "Futurtec"].map((az) => (
            <button
              key={az}
              onClick={() => setFilterAzienda(az)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-semibold transition-all",
                filterAzienda === az
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {az}
            </button>
          ))}
        </div>
        <Select value={filterAnno} onValueChange={setFilterAnno}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Anno" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli anni</SelectItem>
            {anni.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMese} onValueChange={setFilterMese}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Mese" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti i mesi</SelectItem>
            {mesi.map((m) => <SelectItem key={m} value={String(m)}>{getMeseNome(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAgente} onValueChange={setFilterAgente}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Tutti gli agenti" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli agenti</SelectItem>
            {agenti.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" /> Materiale Elettrico
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-lg md:text-2xl font-bold">{fmt(kpi.mat_elettrico)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sun className="h-4 w-4" /> Fotovoltaico
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-lg md:text-2xl font-bold">{fmt(kpi.fotovoltaico)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Cable className="h-4 w-4" /> Cavo
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-lg md:text-2xl font-bold">{fmt(kpi.cavo)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Risorsa spesa
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-lg md:text-2xl font-bold">{fmt(kpi.ricambi)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">{filtered.length} famiglie marchio</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cerca marchio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table className="text-[1.05rem]">
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("marchio")}>
                    <span className="flex items-center gap-1">Marchio<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("fattCurrentYear")}>
                    <span className="flex items-center gap-1">{`Fatt. ${currentYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("fattPrevYearYTD")}>
                    <span className="flex items-center gap-1">{`Progr. ${prevYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("var")}>
                    <span className="flex items-center gap-1">Var. %<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 hidden sm:table-cell" onClick={() => toggleSort("fattPrevYear")}>
                    <span className="flex items-center gap-1">{`Totale ${prevYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const pctVal = fmtPct(r.var);
                  return (
                    <TableRow key={r.marchio}>
                      <TableCell className="font-medium py-2 px-2">{r.marchio}</TableCell>
                      <TableCell className="text-right tabular-nums py-2 px-2">{fmt(r.fattCurrentYear)}</TableCell>
                      <TableCell className="text-right tabular-nums py-2 px-2">{fmt(r.fattPrevYearYTD)}</TableCell>
                      <TableCell className="text-right py-2 px-2">
                        {pctVal != null ? (
                          <Badge variant={r.var! >= 0 ? "default" : "destructive"} className={r.var! >= 0 ? "bg-green-600 hover:bg-green-700" : ""}>
                            {pctVal}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums hidden sm:table-cell py-2 px-2">{fmt(r.fattPrevYear)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
