import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMeseNome } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

type RigaMese = {
  azienda: string;
  aziendaNome: string;
  mese: number;
  fattCorrente: number;
  fattPrecedente: number;
};

type RiepilogoResult = {
  annoCorrente: number;
  annoPrecedente: number;
  dati: RigaMese[];
};

const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const pct = (curr: number, prev: number) => {
  if (prev === 0) return curr > 0 ? "+∞" : "—";
  const delta = ((curr - prev) / Math.abs(prev)) * 100;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
};

function AziendaTable({
  label,
  rows,
  annoCorrente,
  annoPrecedente,
}: {
  label: string;
  rows: RigaMese[];
  annoCorrente: number;
  annoPrecedente: number;
}) {
  const mesiMap = new Map<number, RigaMese>();
  rows.forEach((r) => mesiMap.set(r.mese, r));

  const allMesi = Array.from({ length: 12 }, (_, i) => i + 1);
  const totCorrente = rows.reduce((s, r) => s + r.fattCorrente, 0);
  const totPrecedente = rows.reduce((s, r) => s + r.fattPrecedente, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm md:text-base">{label} — {annoCorrente} vs {annoPrecedente}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Mese</TableHead>
              <TableHead className="text-xs text-right">{annoCorrente}</TableHead>
              <TableHead className="text-xs text-right">{annoPrecedente}</TableHead>
              <TableHead className="text-xs text-right">Δ%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allMesi.map((m) => {
              const r = mesiMap.get(m);
              const corrente = r?.fattCorrente ?? 0;
              const precedente = r?.fattPrecedente ?? 0;
              const delta = pct(corrente, precedente);
              const deltaColor =
                corrente > precedente
                  ? "text-green-600"
                  : corrente < precedente
                  ? "text-red-600"
                  : "text-muted-foreground";

              return (
                <TableRow key={m}>
                  <TableCell className="text-xs py-1.5">{getMeseNome(m)}</TableCell>
                  <TableCell className="text-xs text-right py-1.5 font-medium">{fmt(corrente)}</TableCell>
                  <TableCell className="text-xs text-right py-1.5">{fmt(precedente)}</TableCell>
                  <TableCell className={`text-xs text-right py-1.5 font-semibold ${deltaColor}`}>{delta}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="text-xs font-bold py-1.5">Totale</TableCell>
              <TableCell className="text-xs text-right font-bold py-1.5">{fmt(totCorrente)}</TableCell>
              <TableCell className="text-xs text-right font-bold py-1.5">{fmt(totPrecedente)}</TableCell>
              <TableCell
                className={`text-xs text-right font-bold py-1.5 ${
                  totCorrente > totPrecedente ? "text-green-600" : totCorrente < totPrecedente ? "text-red-600" : ""
                }`}
              >
                {pct(totCorrente, totPrecedente)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function FatturatoRiepilogo() {
  const [filterAgente, setFilterAgente] = useState("__all__");

  const { data: agenti } = useQuery({
    queryKey: ["visible-agents"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_visible_agents");
      if (error) throw error;
      return data as string[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["fatturato-riepilogo", filterAgente],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_fatturato_riepilogo" as any, {
        p_agente: filterAgente === "__all__" ? null : filterAgente,
      });
      if (error) throw error;
      return data as unknown as RiepilogoResult;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.dati.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Nessun dato disponibile</p>
      </div>
    );
  }

  const fogliani = data.dati.filter((r) => r.azienda === "FO");
  const futurtec = data.dati.filter((r) => r.azienda === "FU");

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg md:text-xl font-bold">Riepilogo Fatturato</h1>
        </div>
        <Select value={filterAgente} onValueChange={setFilterAgente}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tutti gli agenti" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tutti gli agenti</SelectItem>
            {(agenti ?? []).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <AziendaTable
          label="Fogliani"
          rows={fogliani}
          annoCorrente={data.annoCorrente}
          annoPrecedente={data.annoPrecedente}
        />
        <AziendaTable
          label="Futurtec"
          rows={futurtec}
          annoCorrente={data.annoCorrente}
          annoPrecedente={data.annoPrecedente}
        />
      </div>
    </div>
  );
}
