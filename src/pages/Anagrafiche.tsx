import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Search, Table2, ChevronRight } from "lucide-react";

type SortKey = "codiceCliente" | "nomeCliente" | "aziende" | "totale";
type SortDir = "asc" | "desc";

interface ClientRow {
  codiceCliente: string;
  nomeCliente: string;
  aziende: string;
  totale: number;
  numMarchi: number;
}

export default function Anagrafiche() {
  const { records } = useData();
  const [search, setSearch] = useState("");
  const [filterAzienda, setFilterAzienda] = useState("__all__");
  const [sortKey, setSortKey] = useState<SortKey>("nomeCliente");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Aggregate per cliente
  const clienti = useMemo(() => {
    const map = new Map<string, { nomeCliente: string; aziende: Set<string>; marchi: Set<string>; totale: number }>();
    records.forEach((r) => {
      const existing = map.get(r.codiceCliente);
      if (existing) {
        existing.totale += r.imponibile;
        existing.aziende.add(r.aziendaNome);
        existing.marchi.add(r.marchio);
      } else {
        map.set(r.codiceCliente, {
          nomeCliente: r.nomeCliente,
          aziende: new Set([r.aziendaNome]),
          marchi: new Set([r.marchio]),
          totale: r.imponibile,
        });
      }
    });
    return [...map.entries()].map(([codiceCliente, v]): ClientRow => ({
      codiceCliente,
      nomeCliente: v.nomeCliente,
      aziende: [...v.aziende].sort().join(", "),
      totale: v.totale,
      numMarchi: v.marchi.size,
    }));
  }, [records]);

  const filtered = useMemo(() => {
    let data = clienti;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.nomeCliente.toLowerCase().includes(q) || r.codiceCliente.includes(q));
    }
    if (filterAzienda !== "__all__") {
      data = data.filter((r) => r.aziende.includes(filterAzienda));
    }
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [clienti, search, filterAzienda, sortKey, sortDir]);

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
    { key: "aziende", label: "Aziende" },
    { key: "totale", label: "Fatturato Totale" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterAzienda} onValueChange={setFilterAzienda}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tutte le aziende" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutte le aziende</SelectItem>
            <SelectItem value="Fogliani">Fogliani</SelectItem>
            <SelectItem value="Futurtec">Futurtec</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{filtered.length} clienti</CardTitle>
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
                    <TableCell>{r.aziende}</TableCell>
                    <TableCell className="font-medium">{fmt(r.totale)}</TableCell>
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
