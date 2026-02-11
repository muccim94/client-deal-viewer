import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Search, Table2 } from "lucide-react";

type SortKey = "cliente" | "prodotto" | "importo";
type SortDir = "asc" | "desc";

export default function Anagrafiche() {
  const { records } = useData();
  const [search, setSearch] = useState("");
  const [filterCliente, setFilterCliente] = useState("__all__");
  const [filterProdotto, setFilterProdotto] = useState("__all__");
  const [sortKey, setSortKey] = useState<SortKey>("cliente");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const clienti = useMemo(() => [...new Set(records.map((r) => r.cliente))].sort(), [records]);
  const prodotti = useMemo(() => [...new Set(records.map((r) => r.prodotto))].sort(), [records]);

  const filtered = useMemo(() => {
    let data = records;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => r.cliente.toLowerCase().includes(q) || r.prodotto.toLowerCase().includes(q));
    }
    if (filterCliente !== "__all__") data = data.filter((r) => r.cliente === filterCliente);
    if (filterProdotto !== "__all__") data = data.filter((r) => r.prodotto === filterProdotto);
    data = [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return data;
  }, [records, search, filterCliente, filterProdotto, sortKey, sortDir]);

  const totale = useMemo(() => filtered.reduce((s, r) => s + r.importo, 0), [filtered]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca cliente o prodotto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCliente} onValueChange={setFilterCliente}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tutti i clienti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti i clienti</SelectItem>
            {clienti.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProdotto} onValueChange={setFilterProdotto}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tutti i prodotti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti i prodotti</SelectItem>
            {prodotti.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{filtered.length} record trovati — Totale: {fmt(totale)}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {(["cliente", "prodotto", "importo"] as SortKey[]).map((key) => (
                  <TableHead
                    key={key}
                    className="cursor-pointer select-none hover:bg-muted/50"
                    onClick={() => toggleSort(key)}
                  >
                    <span className="flex items-center gap-1 capitalize">
                      {key}
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.cliente}</TableCell>
                  <TableCell>{r.prodotto}</TableCell>
                  <TableCell className="font-medium">{fmt(r.importo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">Totale</TableCell>
                <TableCell className="font-semibold">{fmt(totale)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
