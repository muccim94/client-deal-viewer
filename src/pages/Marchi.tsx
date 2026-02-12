import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
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
import { ArrowUpDown, Search, Tag, Zap, Sun, Cable, Wrench } from "lucide-react";

type SortKey = "marchio" | "fatt2026" | "fatt2025" | "var";
type SortDir = "asc" | "desc";

interface BrandRow {
  marchio: string;
  fatt2026: number;
  fatt2025: number;
  var: number | null;
}

export default function Marchi() {
  const { records } = useData();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fatt2026");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterAgente, setFilterAgente] = useState("__all__");
  const [filterAnno, setFilterAnno] = useState<string>(String(new Date().getFullYear()));
  const [filterMese, setFilterMese] = useState("__all__");
  const [filterAzienda, setFilterAzienda] = useState("Fogliani");

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  // Unique agents
  const agenti = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.agente));
    return [...set].sort();
  }, [records]);

  const anni = useMemo(() => {
    const set = new Set<number>();
    records.forEach((r) => set.add(r.anno));
    return [...set].sort((a, b) => b - a);
  }, [records]);

  const mesi = useMemo(() => {
    const set = new Set<number>();
    records.forEach((r) => set.add(r.mese));
    return [...set].sort((a, b) => a - b);
  }, [records]);

  // Filtered by agent, year, month
  const filteredRecords = useMemo(() => {
    let data = records;
    if (filterAzienda) data = data.filter((r) => r.aziendaNome === filterAzienda);
    if (filterAgente !== "__all__") data = data.filter((r) => r.agente === filterAgente);
    if (filterAnno !== "__all__") data = data.filter((r) => r.anno === Number(filterAnno));
    if (filterMese !== "__all__") data = data.filter((r) => r.mese === Number(filterMese));
    return data;
  }, [records, filterAzienda, filterAgente, filterAnno, filterMese]);

  // KPI totals
  const kpi = useMemo(() => {
    let matElettrico = 0;
    let fotovoltaico = 0;
    let cavo = 0;
    let ricambi = 0;
    filteredRecords.forEach((r) => {
      if (r.marchio === "FV.") fotovoltaico += r.imponibile;
      else if (r.marchio === "CV.") cavo += r.imponibile;
      else if (r.marchio.startsWith("*RI")) ricambi += r.imponibile;
      else matElettrico += r.imponibile;
    });
    return { matElettrico, fotovoltaico, cavo, ricambi };
  }, [filteredRecords]);

  // Records filtered only by azienda (for table, independent of KPI filters)
  const tableRecords = useMemo(() => {
    return records.filter((r) => r.aziendaNome === filterAzienda);
  }, [records, filterAzienda]);

  // Brand table
  const brands = useMemo(() => {
    const map = new Map<string, { fatt2026: number; fatt2025: number }>();
    tableRecords.forEach((r) => {
      const existing = map.get(r.marchio);
      if (existing) {
        if (r.anno === currentYear) existing.fatt2026 += r.imponibile;
        if (r.anno === prevYear) existing.fatt2025 += r.imponibile;
      } else {
        map.set(r.marchio, {
          fatt2026: r.anno === currentYear ? r.imponibile : 0,
          fatt2025: r.anno === prevYear ? r.imponibile : 0,
        });
      }
    });
    return [...map.entries()].map(([marchio, v]): BrandRow => ({
      marchio,
      fatt2026: v.fatt2026,
      fatt2025: v.fatt2025,
      var: v.fatt2025 > 0 ? ((v.fatt2026 - v.fatt2025) / v.fatt2025) * 100 : null,
    }));
  }, [tableRecords, currentYear, prevYear]);

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

  if (!records.length) {
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
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
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
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Anno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli anni</SelectItem>
            {anni.map((a) => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterMese} onValueChange={setFilterMese}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Mese" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti i mesi</SelectItem>
            {mesi.map((m) => (
              <SelectItem key={m} value={String(m)}>{getMeseNome(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAgente} onValueChange={setFilterAgente}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Tutti gli agenti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli agenti</SelectItem>
            {agenti.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" /> Materiale Elettrico
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(kpi.matElettrico)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sun className="h-4 w-4" /> Fotovoltaico
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(kpi.fotovoltaico)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Cable className="h-4 w-4" /> Cavo
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(kpi.cavo)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Risorsa spesa
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(kpi.ricambi)}</p></CardContent>
        </Card>
      </div>

      {/* Brand Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">{filtered.length} marchi</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cerca marchio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("marchio")}>
                    <span className="flex items-center gap-1">Marchio<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("fatt2026")}>
                    <span className="flex items-center gap-1">{`Fatt. ${currentYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("fatt2025")}>
                    <span className="flex items-center gap-1">{`Fatt. ${prevYear}`}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("var")}>
                    <span className="flex items-center gap-1">Var. %<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const pct = fmtPct(r.var);
                  return (
                    <TableRow key={r.marchio}>
                      <TableCell className="font-medium">{r.marchio}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.fatt2026)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.fatt2025)}</TableCell>
                      <TableCell className="text-right">
                        {pct != null ? (
                          <Badge variant={r.var! >= 0 ? "default" : "destructive"} className={r.var! >= 0 ? "bg-green-600 hover:bg-green-700" : ""}>
                            {pct}
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
    </div>
  );
}
