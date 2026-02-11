import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { getMeseNome } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Euro, Users, Tag, TrendingUp, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = [
  "hsl(215, 70%, 50%)", "hsl(160, 60%, 45%)", "hsl(35, 85%, 55%)",
  "hsl(0, 65%, 55%)", "hsl(270, 55%, 55%)", "hsl(190, 65%, 45%)",
  "hsl(330, 60%, 55%)", "hsl(50, 75%, 50%)", "hsl(120, 45%, 50%)",
  "hsl(200, 70%, 60%)",
];

export default function Dashboard() {
  const { records } = useData();
  const [filterAzienda, setFilterAzienda] = useState("__all__");
  const [filterAnno, setFilterAnno] = useState("__all__");
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
    const map = new Map<string, number>();
    filtered.forEach((r) => map.set(r.nomeCliente, (map.get(r.nomeCliente) ?? 0) + r.imponibile));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const marchiPie = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => map.set(r.marchio, (map.get(r.marchio) ?? 0) + r.imponibile));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const aziendaBar = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => map.set(r.aziendaNome, (map.get(r.aziendaNome) ?? 0) + r.imponibile));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
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
    <div className="space-y-6">
      {/* Filtri */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterAzienda} onValueChange={setFilterAzienda}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tutte le aziende" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutte le aziende</SelectItem>
            <SelectItem value="FO">Fogliani</SelectItem>
            <SelectItem value="FU">Futurtec</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAnno} onValueChange={setFilterAnno}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tutti gli anni" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli anni</SelectItem>
            {anni.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMese} onValueChange={setFilterMese}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tutti i mesi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti i mesi</SelectItem>
            {mesi.map((m) => <SelectItem key={m} value={String(m)}>{getMeseNome(m)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 10 Clienti */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 Clienti per Fatturato</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topClienti} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="value" fill="hsl(215, 70%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuzione per Marchio */}
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuzione Vendite per Marchio</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marchiPie} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={100}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {marchiPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fatturato per Azienda */}
      <Card>
        <CardHeader><CardTitle className="text-base">Fatturato per Azienda</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aziendaBar}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="value" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
