import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { getMeseNome } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const pct = (curr: number, prev: number) => {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

export default function ClienteDettaglio() {
  const { codice } = useParams<{ codice: string }>();
  const { records } = useData();

  const clientRecords = useMemo(
    () => records.filter((r) => r.codiceCliente === codice),
    [records, codice]
  );

  const clientName = clientRecords[0]?.nomeCliente ?? "Cliente";
  const anni = useMemo(() => [...new Set(clientRecords.map((r) => r.anno))].sort((a, b) => b - a), [clientRecords]);
  const annoCorrente = anni[0] ?? new Date().getFullYear();
  const annoPrecedente = annoCorrente - 1;

  // Fatturato totale per marchio
  const perMarchio = useMemo(() => {
    const map = new Map<string, number>();
    clientRecords.forEach((r) => {
      map.set(r.marchio, (map.get(r.marchio) ?? 0) + r.imponibile);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([marchio, totale]) => ({ marchio, totale }));
  }, [clientRecords]);

  const fatturatoTotale = perMarchio.reduce((s, m) => s + m.totale, 0);

  // Per azienda breakdown
  const perAzienda = useMemo(() => {
    const map = new Map<string, number>();
    clientRecords.forEach((r) => {
      const key = r.aziendaNome;
      map.set(key, (map.get(key) ?? 0) + r.imponibile);
    });
    return [...map.entries()].map(([azienda, totale]) => ({ azienda, totale }));
  }, [clientRecords]);

  // Build month-by-month table per azienda
  type MonthRow = {
    mese: number;
    meseNome: string;
    corrente: number;
    precedente: number;
    delta: number;
  };

  const buildMonthTable = (aziendaNome: string): MonthRow[] => {
    const azRecords = clientRecords.filter((r) => r.aziendaNome === aziendaNome);
    const meseCorr = new Map<number, number>();
    const mesePrec = new Map<number, number>();
    azRecords.forEach((r) => {
      if (r.anno === annoCorrente) meseCorr.set(r.mese, (meseCorr.get(r.mese) ?? 0) + r.imponibile);
      if (r.anno === annoPrecedente) mesePrec.set(r.mese, (mesePrec.get(r.mese) ?? 0) + r.imponibile);
    });

    return Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
      const corrente = meseCorr.get(m) ?? 0;
      const precedente = mesePrec.get(m) ?? 0;
      return {
        mese: m,
        meseNome: getMeseNome(m),
        corrente,
        precedente,
        delta: pct(corrente, precedente),
      };
    });
  };

  const aziende = useMemo(() => {
    const names = [...new Set(clientRecords.map((r) => r.aziendaNome))].sort();
    return names.map((name) => ({ name, rows: buildMonthTable(name) }));
  }, [clientRecords, annoCorrente, annoPrecedente]);

  const DeltaIcon = ({ val }: { val: number }) => {
    if (val > 1) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500 inline" />;
    if (val < -1) return <TrendingDown className="h-3.5 w-3.5 text-red-500 inline" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground inline" />;
  };

  if (!clientRecords.length) {
    return (
      <div className="space-y-4">
        <Link to="/anagrafiche">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Torna alle anagrafiche</Button>
        </Link>
        <p className="text-muted-foreground">Nessun dato per questo cliente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/anagrafiche">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{clientName}</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Codice: {codice}</p>
        </div>
      </div>

      {/* KPI cards per anno e azienda */}
      {(() => {
        const perAziendaAnno = (azienda: string, anno: number) =>
          clientRecords.filter((r) => r.aziendaNome === azienda && r.anno === anno).reduce((s, r) => s + r.imponibile, 0);
        const aziendeNomi = [...new Set(clientRecords.map((r) => r.aziendaNome))].sort();
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {aziendeNomi.map((az) => (
              <Card key={`${az}-${annoCorrente}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="h-4 w-4" />{az} {annoCorrente}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-lg md:text-2xl font-bold">{fmt(perAziendaAnno(az, annoCorrente))}</p></CardContent>
              </Card>
            ))}
            {aziendeNomi.map((az) => (
              <Card key={`${az}-${annoPrecedente}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="h-4 w-4" />{az} {annoPrecedente}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-lg md:text-2xl font-bold">{fmt(perAziendaAnno(az, annoPrecedente))}</p></CardContent>
              </Card>
            ))}
          </div>
        );
      })()}

      {/* Marchi breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fatturato per Marchio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {perMarchio.map((m) => (
              <Badge key={m.marchio} variant="secondary" className="text-xs md:text-sm py-1 md:py-1.5 px-2 md:px-3">
                {m.marchio}: {fmt(m.totale)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly tables per azienda */}
      {aziende.map(({ name, rows }) => {
        const totCorr = rows.reduce((s, r) => s + r.corrente, 0);
        const totPrec = rows.reduce((s, r) => s + r.precedente, 0);
        return (
          <Card key={name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{name} — Confronto {annoPrecedente} vs {annoCorrente}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mese</TableHead>
                      <TableHead className="text-right">{annoPrecedente}</TableHead>
                      <TableHead className="text-right">{annoCorrente}</TableHead>
                      <TableHead className="text-right">Δ %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.mese}>
                        <TableCell className="text-sm">{r.meseNome}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(r.precedente)}</TableCell>
                        <TableCell className="text-right font-medium text-sm">{fmt(r.corrente)}</TableCell>
                        <TableCell className="text-right text-sm">
                          <DeltaIcon val={r.delta} />{" "}
                          <span className={r.delta > 1 ? "text-emerald-600" : r.delta < -1 ? "text-red-600" : "text-muted-foreground"}>
                            {r.delta.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Totale</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(totPrec)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(totCorr)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        <DeltaIcon val={pct(totCorr, totPrec)} />{" "}
                        {pct(totCorr, totPrec).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
