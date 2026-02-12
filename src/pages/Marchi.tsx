import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Search, Tag, Zap, Sun, Cable } from "lucide-react";

type SortKey = "marchio" | "fatt2026" | "fatt2025";
type SortDir = "asc" | "desc";

interface BrandRow {
  marchio: string;
  fatt2026: number;
  fatt2025: number;
}

export default function Marchi() {
  const { records } = useData();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fatt2026");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  // KPI totals
  const kpi = useMemo(() => {
    let matElettrico = 0;
    let fotovoltaico = 0;
    let cavo = 0;
    records.forEach((r) => {
      if (r.marchio === "FV.") fotovoltaico += r.imponibile;
      else if (r.marchio === "CV.") cavo += r.imponibile;
      else matElettrico += r.imponibile;
    });
    return { matElettrico, fotovoltaico, cavo };
  }, [records]);

  // Brand table
  const brands = useMemo(() => {
    const map = new Map<string, { fatt2026: number; fatt2025: number }>();
    records.forEach((r) => {
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
    }));
  }, [records, currentYear, prevYear]);

  const filtered = useMemo(() => {
    let data = brands;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.marchio.toLowerCase().includes(q));
    }
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Materiale Elettrico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(kpi.matElettrico)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Fotovoltaico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(kpi.fotovoltaico)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Cable className="h-4 w-4" />
              Cavo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(kpi.cavo)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Brand Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.marchio}>
                    <TableCell className="font-medium">{r.marchio}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.fatt2026)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(r.fatt2025)}</TableCell>
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
