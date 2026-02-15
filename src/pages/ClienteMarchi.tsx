import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SalesRecord } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const pct = (curr: number, prev: number) => {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

type SortKey = "marchio" | "corrente" | "precedente" | "delta";

export default function ClienteMarchi() {
  const { codice } = useParams<{ codice: string }>();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("corrente");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: clientRecords = [], isLoading } = useQuery({
    queryKey: ["cliente-detail", codice],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_cliente_detail", {
        p_codice_cliente: codice!,
      });
      if (error) throw error;
      return (data as unknown as SalesRecord[]) ?? [];
    },
    enabled: !!codice,
  });

  const clientName = clientRecords[0]?.nomeCliente ?? "Cliente";
  const anni = useMemo(() => [...new Set(clientRecords.map((r) => r.anno))].sort((a, b) => b - a), [clientRecords]);
  const annoCorrente = anni[0] ?? new Date().getFullYear();
  const annoPrecedente = annoCorrente - 1;

  const marchi = useMemo(() => {
    const map = new Map<string, { corrente: number; precedente: number }>();
    clientRecords.forEach((r) => {
      const entry = map.get(r.marchio) ?? { corrente: 0, precedente: 0 };
      if (r.anno === annoCorrente) entry.corrente += r.imponibile;
      if (r.anno === annoPrecedente) entry.precedente += r.imponibile;
      map.set(r.marchio, entry);
    });
    return [...map.entries()].map(([marchio, v]) => ({
      marchio,
      corrente: v.corrente,
      precedente: v.precedente,
      delta: pct(v.corrente, v.precedente),
    }));
  }, [clientRecords, annoCorrente, annoPrecedente]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q ? marchi.filter((m) => m.marchio.toLowerCase().includes(q)) : marchi;
    return [...list].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "marchio") return mul * a.marchio.localeCompare(b.marchio);
      return mul * (a[sortKey] - b[sortKey]);
    });
  }, [marchi, search, sortKey, sortDir]);

  const toggle = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const totCorr = filtered.reduce((s, m) => s + m.corrente, 0);
  const totPrec = filtered.reduce((s, m) => s + m.precedente, 0);

  const DeltaIcon = ({ val }: { val: number }) => {
    if (val > 1) return <TrendingUp className="h-3 w-3 text-emerald-500 inline" />;
    if (val < -1) return <TrendingDown className="h-3 w-3 text-red-500 inline" />;
    return <Minus className="h-3 w-3 text-muted-foreground inline" />;
  };

  const SortArrow = ({ k }: { k: SortKey }) =>
    sortKey === k ? <span className="ml-0.5 text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span> : null;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to={`/anagrafiche/${codice}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{clientName} — Marchi</h1>
          <p className="text-xs text-muted-foreground">Confronto {annoPrecedente} vs {annoCorrente}</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca marchio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left py-2 px-3 font-medium cursor-pointer select-none" onClick={() => toggle("marchio")}>Marchio<SortArrow k="marchio" /></th>
                  <th className="text-right py-2 px-3 font-medium cursor-pointer select-none" onClick={() => toggle("precedente")}>{annoPrecedente}<SortArrow k="precedente" /></th>
                  <th className="text-right py-2 px-3 font-medium cursor-pointer select-none" onClick={() => toggle("corrente")}>{annoCorrente}<SortArrow k="corrente" /></th>
                  <th className="text-right py-2 px-3 font-medium cursor-pointer select-none" onClick={() => toggle("delta")}>Var.&nbsp;%<SortArrow k="delta" /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.marchio} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                    <td className="py-1.5 px-3 font-medium">{m.marchio}</td>
                    <td className="py-1.5 px-3 text-right">{fmt(m.precedente)}</td>
                    <td className="py-1.5 px-3 text-right font-medium">{fmt(m.corrente)}</td>
                    <td className="py-1.5 px-3 text-right">
                      <DeltaIcon val={m.delta} />{" "}
                      <span className={m.delta > 1 ? "text-emerald-600" : m.delta < -1 ? "text-red-600" : "text-muted-foreground"}>
                        {m.delta.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/50 font-semibold">
                  <td className="py-2 px-3">Totale ({filtered.length})</td>
                  <td className="py-2 px-3 text-right">{fmt(totPrec)}</td>
                  <td className="py-2 px-3 text-right">{fmt(totCorr)}</td>
                  <td className="py-2 px-3 text-right">
                    <DeltaIcon val={pct(totCorr, totPrec)} />{" "}
                    {pct(totCorr, totPrec).toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
