import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { getMeseNome } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Coins, Search } from "lucide-react";

export default function Provvigioni() {
  const { records } = useData();
  const [filterAzienda, setFilterAzienda] = useState("FO");
  const [filterAnno, setFilterAnno] = useState("2026");
  const [filterMese, setFilterMese] = useState("__all__");
  const [search, setSearch] = useState("");

  const anni = useMemo(() => [...new Set(records.map((r) => r.anno))].sort(), [records]);
  const mesi = useMemo(() => [...new Set(records.map((r) => r.mese))].sort((a, b) => a - b), [records]);

  const filtered = useMemo(() => {
    let data = records;
    if (filterAzienda !== "__all__") data = data.filter((r) => r.azienda === filterAzienda);
    if (filterAnno !== "__all__") data = data.filter((r) => r.anno === Number(filterAnno));
    if (filterMese !== "__all__") data = data.filter((r) => r.mese === Number(filterMese));
    return data;
  }, [records, filterAzienda, filterAnno, filterMese]);

  const grouped = useMemo(() => {
    const map = new Map<string, { codice: string; nome: string; azienda: string; aziendaNome: string; totale: number }>();
    filtered.forEach((r) => {
      const key = `${r.azienda}_${r.codiceCliente}`;
      const existing = map.get(key);
      if (existing) {
        existing.totale += (r.provvigione ?? 0);
      } else {
        map.set(key, {
          codice: r.codiceCliente,
          nome: r.nomeCliente,
          azienda: r.azienda,
          aziendaNome: r.aziendaNome,
          totale: r.provvigione ?? 0,
        });
      }
    });
    return [...map.values()].sort((a, b) => b.totale - a.totale);
  }, [filtered]);

  const results = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped.filter((r) => r.nome.toLowerCase().includes(q) || r.codice.includes(q));
  }, [grouped, search]);

  const totaleProvvigioni = useMemo(() => results.reduce((s, r) => s + r.totale, 0), [results]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Coins className="h-16 w-16 mb-4 opacity-40" />
        <p className="text-lg font-medium">Nessun dato disponibile</p>
        <p className="text-sm">Carica un file Excel dalla sezione Upload per iniziare.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      </div>

      {/* KPI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Totale Provvigioni</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-xl md:text-2xl font-bold">{fmt(totaleProvvigioni)}</div></CardContent>
      </Card>

      {/* Ricerca */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabella */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Nome Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Azienda</TableHead>
                  <TableHead className="text-right">Provvigione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nessun risultato trovato
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((r) => (
                    <TableRow key={`${r.azienda}_${r.codice}`}>
                      <TableCell className="font-mono text-sm">{r.codice}</TableCell>
                      <TableCell className="text-sm">{r.nome}</TableCell>
                      <TableCell className="hidden sm:table-cell">{r.aziendaNome}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-sm">{fmt(r.totale)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
