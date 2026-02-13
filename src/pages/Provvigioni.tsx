import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMeseNome } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Coins, Search, Loader2 } from "lucide-react";

interface ProvvigioneRow {
  codice: string;
  nome: string;
  azienda: string;
  aziendaNome: string;
  totale: number;
}

export default function Provvigioni() {
  const [filterAzienda, setFilterAzienda] = useState("FO");
  const [filterAnno, setFilterAnno] = useState("2026");
  const [filterMese, setFilterMese] = useState("__all__");
  const [search, setSearch] = useState("");

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

  const { data: grouped = [], isLoading } = useQuery({
    queryKey: ["provvigioni", filterAzienda, filterAnno, filterMese],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_provvigioni_grouped", {
        p_azienda: filterAzienda === "__all__" ? null : filterAzienda,
        p_anno: filterAnno === "__all__" ? null : Number(filterAnno),
        p_mese: filterMese === "__all__" ? null : Number(filterMese),
      });
      if (error) throw error;
      return (data as unknown as ProvvigioneRow[]) ?? [];
    },
  });

  const results = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped.filter((r) => r.nome.toLowerCase().includes(q) || r.codice.includes(q));
  }, [grouped, search]);

  const totaleProvvigioni = useMemo(() => results.reduce((s, r) => s + r.totale, 0), [results]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!grouped.length && !isLoading) {
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Totale Provvigioni</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent><div className="text-xl md:text-2xl font-bold">{fmt(totaleProvvigioni)}</div></CardContent>
      </Card>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

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
