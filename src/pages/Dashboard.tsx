import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { getMeseNome } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Euro, Users, Tag, TrendingUp, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { records } = useData();
  const [filterAzienda, setFilterAzienda] = useState("FO");
  const [filterAnno, setFilterAnno] = useState("2026");
  const [filterMese, setFilterMese] = useState("__all__");

  const anni = useMemo(() => [...new Set(records.map((r) => r.anno))].sort(), [records]);
  const mesi = useMemo(() => [...new Set(records.map((r) => r.mese))].sort((a, b) => a - b), [records]);

  const filtered = useMemo(() => {
    let data = records;
    if (filterAzienda !== "__all__") data = data.filter((r) => r.azienda === filterAzienda);
    if (filterAnno !== "__all__") data = data.filter((r) => r.anno === Number(filterAnno));
    if (filterMese !== "__all__") data = data.filter((r) => r.mese === Number(filterMese));
    return data;
  }, [records, filterAzienda, filterAnno, filterMese]);

  const stats = useMemo(() => {
    const totale = filtered.reduce((s, r) => s + r.imponibile, 0);
    const clienti = new Set(filtered.map((r) => r.codiceCliente)).size;
    const marchi = new Set(filtered.map((r) => r.marchio)).size;
    const mediaCliente = clienti ? totale / clienti : 0;
    return { totale, clienti, marchi, mediaCliente };
  }, [filtered]);

  const topClienti = useMemo(() => {
    const map = new Map<string, { codice: string; totale: number }>();
    filtered.forEach((r) => {
      const existing = map.get(r.nomeCliente);
      if (existing) {
        existing.totale += r.imponibile;
      } else {
        map.set(r.nomeCliente, { codice: r.codiceCliente, totale: r.imponibile });
      }
    });
    return [...map.entries()]
      .sort((a, b) => b[1].totale - a[1].totale)
      .slice(0, 10)
      .map(([name, v]) => ({ name, codice: v.codice, value: v.totale }));
  }, [filtered]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <BarChart3 className="h-16 w-16 mb-4 opacity-40" />
        <p className="text-lg font-medium">Nessun dato disponibile</p>
        <p className="text-sm">Carica un file Excel dalla sezione Upload per iniziare.</p>
      </div>
    );
  }

  const kpis = [
    { label: "Fatturato Totale", value: fmt(stats.totale), icon: Euro },
    { label: "Clienti Unici", value: stats.clienti, icon: Users },
    { label: "Marchi", value: stats.marchi, icon: Tag },
    { label: "Media per Cliente", value: fmt(stats.mediaCliente), icon: TrendingUp },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
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
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-lg md:text-2xl font-bold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Top 10 Clienti */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Top 10 Clienti per Fatturato</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {topClienti.map((c, i) => (
              <div key={c.codice} className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <span className="text-sm md:text-base font-bold text-muted-foreground w-6 text-right shrink-0">{i + 1}.</span>
                  <Link
                    to={`/anagrafiche/${c.codice}`}
                    className="text-sm md:text-base font-medium text-primary hover:underline truncate"
                  >
                    {c.name}
                  </Link>
                </div>
                <span className="text-sm md:text-base font-semibold tabular-nums shrink-0 ml-4">
                  {fmt(c.value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
