import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Search, Table2, ChevronRight } from "lucide-react";

type SortKey = "codiceCliente" | "nomeCliente" | "fatt2026" | "fatt2025";
type SortDir = "asc" | "desc";

interface ClientRow {
  codiceCliente: string;
  nomeCliente: string;
  fatt2026: number;
  fatt2025: number;
}

export default function Anagrafiche() {
  const { records } = useData();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nomeCliente");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const clienti = useMemo(() => {
    const map = new Map<string, { nomeCliente: string; fatt2026: number; fatt2025: number }>();
    records.forEach((r) => {
      const existing = map.get(r.codiceCliente);
      if (existing) {
        if (r.anno === currentYear) existing.fatt2026 += r.imponibile;
        if (r.anno === prevYear) existing.fatt2025 += r.imponibile;
      } else {
        map.set(r.codiceCliente, {
          nomeCliente: r.nomeCliente,
          fatt2026: r.anno === currentYear ? r.imponibile : 0,
          fatt2025: r.anno === prevYear ? r.imponibile : 0,
        });
      }
    });
    return [...map.entries()].map(([codiceCliente, v]): ClientRow => ({
      codiceCliente,
      nomeCliente: v.nomeCliente,
      fatt2026: v.fatt2026,
      fatt2025: v.fatt2025,
    }));
  }, [records, currentYear, prevYear]);

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
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Table2 className="h-16 w-16 mb-4 opacity-40" />
        <p className="text-lg font-medium">Nessun dato disponibile</p>
        <p className="text-sm">Carica un file Excel dalla sezione Upload per iniziare.</p>
      </div>
    );
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: "codiceCliente", label: "Codice" },
    { key: "nomeCliente", label: "Nome Cliente" },
    { key: "fatt2026", label: `Fatturato ${currentYear}` },
    { key: "fatt2025", label: `Fatturato ${prevYear}` },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{filtered.length} clienti</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cerca cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key} className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort(col.key)}>
                      <span className="flex items-center gap-1">{col.label}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></span>
                    </TableHead>
                  ))}
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.codiceCliente} className="group">
                    <TableCell>{r.codiceCliente}</TableCell>
                    <TableCell>
                      <Link to={`/anagrafiche/${r.codiceCliente}`} className="font-medium text-primary hover:underline">
                        {r.nomeCliente}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium text-right tabular-nums">{fmt(r.fatt2026)}</TableCell>
                    <TableCell className="font-medium text-right tabular-nums">{fmt(r.fatt2025)}</TableCell>
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
