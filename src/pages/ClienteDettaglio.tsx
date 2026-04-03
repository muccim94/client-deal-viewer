import { useMemo, useCallback, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Building2, Pencil, Phone, Mail, ChevronDown, ChevronRight } from "lucide-react";
import AnagraficaEditDialog from "@/components/cliente/AnagraficaEditDialog";
import { getMeseNome } from "@/types/data";
import { SalesRecord } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import Incentivazioni from "@/components/cliente/Incentivazioni";

const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const fmtCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(3).replace('.', ',')}M`;
  if (Math.abs(n) >= 100) return `${(n / 1_000).toFixed(1).replace('.', ',')}k`;
  return `${Math.round(n)} €`;
};

const pct = (curr: number, prev: number) => {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

const getFamiglia = (marchio: string) => marchio.match(/^[A-Za-z.*]+/)?.[0] ?? marchio;

const COLORS = [
  "hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 83%, 58%)", "hsl(187, 85%, 43%)",
  "hsl(330, 81%, 60%)", "hsl(24, 95%, 53%)", "hsl(210, 40%, 60%)",
];

export default function ClienteDettaglio() {
  const { codice } = useParams<{ codice: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<{ azienda: string; mese: number } | null>(null);
  const isMobile = useIsMobile();
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

  const { data: anagrafica } = useQuery({
    queryKey: ["cliente-anagrafica", clientRecords[0]?.nomeCliente],
    queryFn: async () => {
      const nome = clientRecords[0]?.nomeCliente;
      if (!nome) return null;
      const { data, error } = await supabase
        .from("clienti_anagrafica" as any)
        .select("nome_cliente, indirizzo, provincia, telefono, email, partita_iva")
        .eq("nome_cliente", nome)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { nome_cliente: string; indirizzo: string | null; provincia: string | null; telefono: string | null; email: string | null; partita_iva: string | null } | null;
    },
    enabled: !!clientRecords[0]?.nomeCliente,
  });

  const clientName = clientRecords[0]?.nomeCliente ?? "Cliente";
  const anni = useMemo(() => [...new Set(clientRecords.map((r) => r.anno))].sort((a, b) => b - a), [clientRecords]);
  const annoCorrente = anni[0] ?? new Date().getFullYear();
  const annoPrecedente = annoCorrente - 1;

  const { pieData, barData } = useMemo(() => {
    const mapCorr = new Map<string, number>();
    const mapPrec = new Map<string, number>();
    const mapTotal = new Map<string, number>();
    clientRecords.forEach((r) => {
      const fam = getFamiglia(r.marchio);
      mapTotal.set(fam, (mapTotal.get(fam) ?? 0) + r.imponibile);
      if (r.anno === annoCorrente) mapCorr.set(fam, (mapCorr.get(fam) ?? 0) + r.imponibile);
      if (r.anno === annoPrecedente) mapPrec.set(fam, (mapPrec.get(fam) ?? 0) + r.imponibile);
    });
    const sorted = [...mapTotal.entries()].sort((a, b) => b[1] - a[1]);
    const topNames = sorted.slice(0, 8).map(([name]) => name);
    const pieTop = topNames.map((name) => ({ name, value: mapTotal.get(name)! }));
    const altriVal = sorted.slice(8).reduce((s, [, v]) => s + v, 0);
    if (altriVal > 0) pieTop.push({ name: "Altri", value: altriVal });

    const barTop = topNames.map((name) => ({
      name,
      corrente: mapCorr.get(name) ?? 0,
      precedente: mapPrec.get(name) ?? 0,
    }));
    const altriCorr = sorted.slice(8).reduce((s, [n]) => s + (mapCorr.get(n) ?? 0), 0);
    const altriPrec = sorted.slice(8).reduce((s, [n]) => s + (mapPrec.get(n) ?? 0), 0);
    if (altriCorr > 0 || altriPrec > 0) barTop.push({ name: "Altri", corrente: altriCorr, precedente: altriPrec });

    return { pieData: pieTop, barData: barTop };
  }, [clientRecords, annoCorrente, annoPrecedente]);

  const { fattCorrente, fattPrecYTD, fattPrecTotale } = useMemo(() => {
    const mesiAnnoCorrente = clientRecords.filter(r => r.anno === annoCorrente).map(r => r.mese);
    const meseCorrente = mesiAnnoCorrente.length ? Math.max(...mesiAnnoCorrente) : new Date().getMonth() + 1;
    let fattCorrente = 0, fattPrecYTD = 0, fattPrecTotale = 0;
    clientRecords.forEach((r) => {
      if (r.anno === annoCorrente) fattCorrente += r.imponibile;
      if (r.anno === annoPrecedente) {
        fattPrecTotale += r.imponibile;
        if (r.mese <= meseCorrente) fattPrecYTD += r.imponibile;
      }
    });
    return { fattCorrente, fattPrecYTD, fattPrecTotale };
  }, [clientRecords, annoCorrente, annoPrecedente]);

  const aziende = useMemo(() => {
    const names = [...new Set(clientRecords.map((r) => r.aziendaNome))].sort();
    return names.map((name) => {
      const azRecords = clientRecords.filter((r) => r.aziendaNome === name);
      const meseCorr = new Map<number, number>();
      const mesePrec = new Map<number, number>();
      azRecords.forEach((r) => {
        if (r.anno === annoCorrente) meseCorr.set(r.mese, (meseCorr.get(r.mese) ?? 0) + r.imponibile);
        if (r.anno === annoPrecedente) mesePrec.set(r.mese, (mesePrec.get(r.mese) ?? 0) + r.imponibile);
      });
      const rows = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
        const corrente = meseCorr.get(m) ?? 0;
        const precedente = mesePrec.get(m) ?? 0;
        return { mese: m, meseNome: getMeseNome(m), corrente, precedente, delta: pct(corrente, precedente) };
      });
      return { name, rows };
    });
  }, [clientRecords, annoCorrente, annoPrecedente]);

  const goToMarchi = useCallback(() => navigate(`/anagrafiche/${codice}/marchi`), [navigate, codice]);

  const DeltaIcon = ({ val }: { val: number }) => {
    if (val > 1) return <TrendingUp className="h-3 w-3 text-emerald-500 inline" />;
    if (val < -1) return <TrendingDown className="h-3 w-3 text-red-500 inline" />;
    return <Minus className="h-3 w-3 text-muted-foreground inline" />;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/anagrafiche">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-base sm:text-xl md:text-2xl font-bold leading-tight">{clientName}</h1>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Codice: {codice}</p>
        </div>
      </div>

      {/* Scheda Anagrafica + Riepilogo Fatturato affiancati */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base">Riepilogo Fatturato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 sm:space-y-2 p-3 pt-0 sm:p-6 sm:pt-0">
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Fatturato {annoCorrente}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{isMobile ? fmtCompact(fattCorrente) : fmt(fattCorrente)}</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {fattCorrente >= fattPrecYTD
                ? <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                : <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />}
              <span className="text-xs sm:text-sm">
                vs {annoPrecedente} YTD: {isMobile ? fmtCompact(fattPrecYTD) : fmt(fattPrecYTD)}
              </span>
              <span className={`text-xs sm:text-sm font-medium ${
                fattCorrente >= fattPrecYTD ? 'text-emerald-600' : 'text-red-600'
              }`}>
                ({pct(fattCorrente, fattPrecYTD).toFixed(1)}%)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Fatt. {annoPrecedente}: {isMobile ? fmtCompact(fattPrecTotale) : fmt(fattPrecTotale)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base flex items-center justify-between">
              Scheda Anagrafica
              {role === "admin" && (
                <Pencil
                  className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setEditOpen(true)}
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-3 pt-0 sm:p-6 sm:pt-0">
            {anagrafica && (anagrafica.indirizzo || anagrafica.provincia || anagrafica.telefono || anagrafica.email || anagrafica.partita_iva) ? (
              <>
                {anagrafica.partita_iva && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Partita IVA</p>
                      <p className="text-sm font-medium">{anagrafica.partita_iva}</p>
                    </div>
                  </div>
                )}
                {anagrafica.indirizzo && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Indirizzo sede legale</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(anagrafica.indirizzo)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {anagrafica.indirizzo}
                      </a>
                    </div>
                  </div>
                )}
                {anagrafica.provincia && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Provincia</p>
                      <p className="text-sm font-medium">{anagrafica.provincia}</p>
                    </div>
                  </div>
                )}
                {anagrafica.telefono && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefono</p>
                      <a href={`tel:${anagrafica.telefono}`} className="text-sm font-medium text-primary hover:underline">
                        {anagrafica.telefono}
                      </a>
                    </div>
                  </div>
                )}
                {anagrafica.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a href={`mailto:${anagrafica.email}`} className="text-sm font-medium text-primary hover:underline">
                        {anagrafica.email}
                      </a>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Dati non disponibili</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabelle mensili */}
      {aziende.map(({ name, rows }) => {
        const totCorr = rows.reduce((s, r) => s + r.corrente, 0);
        const totPrec = rows.reduce((s, r) => s + r.precedente, 0);
        const totDelta = pct(totCorr, totPrec);
        return (
          <Card key={name}>
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-sm sm:text-base font-semibold">{name} — {annoCorrente} vs {annoPrecedente}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
              <table className="w-full text-xs sm:text-[1.056rem]">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left py-1.5 sm:py-2 px-1 font-medium">Mese</th>
                      <th className="text-right py-1.5 sm:py-2 px-1 font-medium">{annoCorrente}</th>
                      <th className="text-right py-1.5 sm:py-2 px-1 font-medium">{annoPrecedente}</th>
                      <th className="text-right py-1.5 sm:py-2 px-1 font-medium">Δ %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const isExpanded = expandedRow?.azienda === name && expandedRow?.mese === r.mese;
                      const toggleExpand = () => setExpandedRow(isExpanded ? null : { azienda: name, mese: r.mese });
                      
                      // Calcola dettaglio marchi per il mese espanso
                      const marchiDetail = isExpanded ? (() => {
                        const mapCorr = new Map<string, number>();
                        const mapPrec = new Map<string, number>();
                        clientRecords.forEach((rec) => {
                          if (rec.aziendaNome !== name || rec.mese !== r.mese) return;
                          const fam = getFamiglia(rec.marchio);
                          if (rec.anno === annoCorrente) mapCorr.set(fam, (mapCorr.get(fam) ?? 0) + rec.imponibile);
                          if (rec.anno === annoPrecedente) mapPrec.set(fam, (mapPrec.get(fam) ?? 0) + rec.imponibile);
                        });
                        const allMarchi = new Set([...mapCorr.keys(), ...mapPrec.keys()]);
                        return [...allMarchi].map((m) => ({
                          marchio: m,
                          corrente: mapCorr.get(m) ?? 0,
                          precedente: mapPrec.get(m) ?? 0,
                        })).sort((a, b) => b.corrente - a.corrente);
                      })() : [];

                      return (
                        <>
                          <tr
                            key={r.mese}
                            className={`border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                            onClick={toggleExpand}
                          >
                            <td className="py-1.5 sm:py-2 px-1 flex items-center gap-1">
                              {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                              {isMobile ? r.meseNome.substring(0, 3) : r.meseNome}
                            </td>
                            <td className="py-1.5 sm:py-2 px-1 text-right font-medium">{isMobile ? fmtCompact(r.corrente) : fmt(r.corrente)}</td>
                            <td className="py-1.5 sm:py-2 px-1 text-right">{isMobile ? fmtCompact(r.precedente) : fmt(r.precedente)}</td>
                            <td className="py-1.5 sm:py-2 px-1 text-right">
                              <DeltaIcon val={r.delta} />{" "}
                              <span className={r.delta > 1 ? "text-emerald-600" : r.delta < -1 ? "text-red-600" : "text-muted-foreground"}>
                                {r.delta.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                          {isExpanded && marchiDetail.length > 0 && (
                            <tr key={`detail-${r.mese}`}>
                              <td colSpan={4} className="p-0">
                                 <div className="bg-muted/30 border-y px-2 sm:px-3 py-1.5 sm:py-2">
                                   <table className="w-full text-xs sm:text-[1.05rem]">
                                     <thead>
                                       <tr className="text-muted-foreground">
                                         <th className="text-left py-1 px-0.5 font-medium">Marchio</th>
                                         <th className="text-right py-1 px-0.5 font-medium">{annoCorrente}</th>
                                         <th className="text-right py-1 px-0.5 font-medium">{annoPrecedente}</th>
                                       </tr>
                                     </thead>
                                     <tbody>
                                       {marchiDetail.map((md) => (
                                         <tr key={md.marchio} className="border-t border-border/50">
                                           <td className="py-1 px-0.5">{md.marchio}</td>
                                           <td className="py-1 px-0.5 text-right font-medium">{isMobile ? fmtCompact(md.corrente) : fmt(md.corrente)}</td>
                                           <td className="py-1 px-0.5 text-right">{isMobile ? fmtCompact(md.precedente) : fmt(md.precedente)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/50 font-semibold text-xs sm:text-[1.056rem]">
                      <td className="py-2 sm:py-2.5 px-1">Totale</td>
                      <td className="py-2 sm:py-2.5 px-1 text-right">{isMobile ? fmtCompact(totCorr) : fmt(totCorr)}</td>
                      <td className="py-2 sm:py-2.5 px-1 text-right">{isMobile ? fmtCompact(totPrec) : fmt(totPrec)}</td>
                      <td className="py-2 sm:py-2.5 px-1 text-right">
                        <DeltaIcon val={totDelta} />{" "}
                        <span className={totDelta > 1 ? "text-emerald-600" : totDelta < -1 ? "text-red-600" : "text-muted-foreground"}>
                          {totDelta.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Grafico Fatturato per Marchio */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={goToMarchi}>
        <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
          <CardTitle className="text-sm sm:text-base flex items-center justify-between">
            Fatturato per Marchio
            <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">Clicca per dettaglio →</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
            {isMobile ? (
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={30} paddingAngle={2} stroke="none">
                  {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => isMobile ? fmtCompact(value) : fmt(value)} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} formatter={(value: string) => <span className="text-foreground">{value}</span>} />
              </PieChart>
            ) : (
              <BarChart data={barData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => fmt(value)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="corrente" name={`${annoCorrente}`} fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="precedente" name={`${annoPrecedente}`} fill="hsl(210, 40%, 70%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Incentivazioni */}
      <Incentivazioni codice={codice!} nomeCliente={clientName} />

      <AnagraficaEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        nomeCliente={clientName}
        indirizzo={anagrafica?.indirizzo ?? null}
        provincia={anagrafica?.provincia ?? null}
        telefono={anagrafica?.telefono ?? null}
        email={anagrafica?.email ?? null}
        partitaIva={anagrafica?.partita_iva ?? null}
      />
    </div>
  );
}
