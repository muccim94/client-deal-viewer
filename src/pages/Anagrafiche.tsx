import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { getMeseNome } from "@/types/data";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Search, Table2 } from "lucide-react";

type SortKey = "aziendaNome" | "codiceCliente" | "nomeCliente" | "marchio" | "mese" | "imponibile";
type SortDir = "asc" | "desc";

interface AggregatedRow {
  aziendaNome: string;
  codiceCliente: string;
  nomeCliente: string;
  marchio: string;
  mese: number;
  anno: number;
  imponibile: number;
}

export default function Anagrafiche() {
  const { records } = useData();
  const [search, setSearch] = useState("");
  const [filterAzienda, setFilterAzienda] = useState("__all__");
  const [filterMarchio, setFilterMarchio] = useState("__all__");
  const [sortKey, setSortKey] = useState<SortKey>("nomeCliente");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const marchi = useMemo(() => [...new Set(records.map((r) => r.marchio))].sort(), [records]);

  // Aggregate per combinazione cliente + marchio + mese
  const aggregated = useMemo(() => {
    const map = new Map<string, AggregatedRow>();
    records.forEach((r) => {
      const key = `${r.codiceCliente}|${r.marchio}|${r.mese}|${r.anno}`;
      const existing = map.get(key);
      if (existing) {
        existing.imponibile += r.imponibile;
      } else {
        map.set(key, {
          aziendaNome: r.aziendaNome,
          codiceCliente: r.codiceCliente,
          nomeCliente: r.nomeCliente,
          marchio: r.marchio,
          mese: r.mese,
          anno: r.anno,
          imponibile: r.imponibile,
        });
      }
    });
    return [...map.values()];
  }, [records]);

  const filtered = useMemo(() => {
    let data = aggregated;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.nomeCliente.toLowerCase().includes(q) || r.marchio.toLowerCase().includes(q));
    }
    if (filterAzienda !== "__all__") data = data.filter((r) => r.aziendaNome === filterAzienda);
    if (filterMarchio !== "__all__") data = data.filter((r) => r.marchio === filterMarchio);
    data = [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return data;
  }, [aggregated, search, filterAzienda, filterMarchio, sortKey, sortDir]);

  const totale = useMemo(() => filtered.reduce((s, r) => s + r.imponibile, 0), [filtered]);

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
    { key: "aziendaNome", label: "Azienda" },
    { key: "codiceCliente", label: "Codice" },
    { key: "nomeCliente", label: "Nome Cliente" },
    { key: "marchio", label: "Marchio" },
    { key: "mese", label: "Mese" },
    { key: "imponibile", label: "Imponibile" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca cliente o marchio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterAzienda} onValueChange={setFilterAzienda}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tutte le aziende" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutte le aziende</SelectItem>
            <SelectItem value="Fogliani">Fogliani</SelectItem>
            <SelectItem value="Futurtec">Futurtec</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterMarchio} onValueChange={setFilterMarchio}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tutti i marchi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti i marchi</SelectItem>
            {marchi.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{filtered.length} righe — Totale: {fmt(totale)}</CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.aziendaNome}</TableCell>
                    <TableCell>{r.codiceCliente}</TableCell>
                    <TableCell>{r.nomeCliente}</TableCell>
                    <TableCell>{r.marchio}</TableCell>
                    <TableCell>{getMeseNome(r.mese)} {r.anno}</TableCell>
                    <TableCell className="font-medium">{fmt(r.imponibile)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="font-semibold">Totale</TableCell>
                  <TableCell className="font-semibold">{fmt(totale)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
