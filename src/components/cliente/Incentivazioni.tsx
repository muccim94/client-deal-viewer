import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Award, ChevronDown, ChevronUp, Trash2, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Riga {
  fatturato: number;
  percentuale: number;
}

interface Lettera {
  id: string;
  codice_cliente: string;
  nome_cliente: string;
  anno: number;
  note: string | null;
  righe: Riga[];
  totale_fatturato: number;
  totale_premi: number;
  incidenza: number;
  created_at: string;
  created_by: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const fmtPct = (n: number) =>
  new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + "%";

const emptyRighe = (): Riga[] =>
  Array.from({ length: 10 }, () => ({ fatturato: 0, percentuale: 0 }));

interface Props {
  codice: string;
  nomeCliente: string;
}

export default function Incentivazioni({ codice, nomeCliente }: Props) {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  // Form state
  const [righe, setRighe] = useState<Riga[]>(emptyRighe());
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Fetch storico
  const { data: storico = [] } = useQuery<Lettera[]>({
    queryKey: ["incentivazioni", codice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_incentivazioni" as any)
        .select("*")
        .eq("codice_cliente", codice)
        .order("anno", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Lettera[];
    },
    enabled: isAdmin,
  });

  // Live calculations
  const righeCalcolate = righe.map((r) => ({
    ...r,
    premio: r.fatturato * (r.percentuale / 100),
  }));
  const totaleFatturato = righeCalcolate.reduce((s, r) => s + r.fatturato, 0);
  const totalePremi = righeCalcolate.reduce((s, r) => s + r.premio, 0);
  const incidenza = totaleFatturato > 0 ? (totalePremi / totaleFatturato) * 100 : 0;

  const updateRiga = useCallback((i: number, field: keyof Riga, raw: string) => {
    const value = parseFloat(raw.replace(",", ".")) || 0;
    setRighe((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }, []);

  const handleSalva = async () => {
    if (!user) return;
    if (totaleFatturato === 0) {
      toast.error("Inserisci almeno uno scaglione di fatturato");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("cliente_incentivazioni" as any).insert({
        codice_cliente: codice,
        nome_cliente: nomeCliente,
        anno,
        note: note || null,
        righe: righe as any,
        totale_fatturato: totaleFatturato,
        totale_premi: totalePremi,
        incidenza,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success("Lettera salvata con successo");
      setRighe(emptyRighe());
      setNote("");
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["incentivazioni", codice] });
    } catch (e: any) {
      toast.error("Errore nel salvataggio: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleElimina = async (id: string) => {
    try {
      const { error } = await supabase
        .from("cliente_incentivazioni" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Lettera eliminata");
      queryClient.invalidateQueries({ queryKey: ["incentivazioni", codice] });
    } catch (e: any) {
      toast.error("Errore nell'eliminazione: " + e.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isAdmin) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Incentivazioni
          </CardTitle>
          <Button
            size="sm"
            variant={formOpen ? "outline" : "default"}
            onClick={() => setFormOpen((v) => !v)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuova Lettera
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── FORM NUOVA LETTERA ── */}
        {formOpen && (
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            {/* Anno e note */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Anno di riferimento</label>
                <Input
                  type="number"
                  value={anno}
                  onChange={(e) => setAnno(parseInt(e.target.value) || anno)}
                  className="w-28 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-muted-foreground">Note (opzionale)</label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Inserisci eventuali note sulla lettera..."
                  className="text-sm resize-none h-9 py-1.5"
                />
              </div>
            </div>

            {/* Tabella scaglioni */}
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/60">
                    <th className="py-2 px-3 text-center font-medium text-muted-foreground w-10">#</th>
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">Scaglione di Fatturato (€)</th>
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">Premio % per Step</th>
                    <th className="py-2 px-3 text-right font-medium text-muted-foreground">Importo Premio</th>
                  </tr>
                </thead>
                <tbody>
                  {righeCalcolate.map((r, i) => (
                    <tr key={i} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
                      <td className="py-1.5 px-3 text-center text-muted-foreground text-xs">{i + 1}</td>
                      <td className="py-1.5 px-2">
                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          defaultValue={r.fatturato || ""}
                          placeholder="0"
                          onChange={(e) => updateRiga(i, "fatturato", e.target.value)}
                          className="h-7 text-sm w-full"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          defaultValue={r.percentuale || ""}
                          placeholder="0"
                          onChange={(e) => updateRiga(i, "percentuale", e.target.value)}
                          className="h-7 text-sm w-full"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right font-medium">
                        {r.fatturato > 0 && r.percentuale > 0 ? (
                          <span className="text-primary">{fmt(r.premio)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/50 font-semibold text-xs">
                    <td colSpan={1} className="py-2 px-3 text-muted-foreground">TOT.</td>
                    <td className="py-2 px-3">
                      <span className="text-foreground">{fmt(totaleFatturato)}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-muted-foreground text-xs">Incidenza: {fmtPct(incidenza)}</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-primary">{fmt(totalePremi)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Riepilogo KPI */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md bg-background border p-2">
                <p className="text-xs text-muted-foreground">Totale Fatturato</p>
                <p className="text-sm font-bold">{fmt(totaleFatturato)}</p>
              </div>
              <div className="rounded-md bg-background border p-2">
                <p className="text-xs text-muted-foreground">Tot. Premi Liquidati</p>
                <p className="text-sm font-bold text-primary">{fmt(totalePremi)}</p>
              </div>
              <div className="rounded-md bg-background border p-2">
                <p className="text-xs text-muted-foreground">Incidenza</p>
                <p className="text-sm font-bold">{fmtPct(incidenza)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setRighe(emptyRighe()); setNote(""); setFormOpen(false); }}>
                Annulla
              </Button>
              <Button size="sm" onClick={handleSalva} disabled={saving} className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Salvataggio..." : "Salva Lettera"}
              </Button>
            </div>
          </div>
        )}

        {/* ── STORICO ── */}
        {storico.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nessuna lettera di incentivazione salvata per questo cliente.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Storico lettere ({storico.length})
            </p>
            {storico.map((l) => {
              const isExpanded = expandedIds.has(l.id);
              const righeLettera: Riga[] = Array.isArray(l.righe) ? l.righe : [];
              const righeConPremi = righeLettera.map((r) => ({
                ...r,
                premio: r.fatturato * (r.percentuale / 100),
              }));
              return (
                <Collapsible key={l.id} open={isExpanded} onOpenChange={() => toggleExpand(l.id)}>
                  <div className="rounded-lg border bg-muted/20">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm">Anno {l.anno}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(l.created_at).toLocaleDateString("it-IT")}
                          </span>
                          {l.note && (
                            <span className="text-xs text-muted-foreground italic truncate max-w-40">
                              "{l.note}"
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex items-center gap-4 text-xs">
                            <span className="text-muted-foreground">Fatt: <span className="font-medium text-foreground">{fmt(l.totale_fatturato)}</span></span>
                            <span className="text-muted-foreground">Premi: <span className="font-medium text-primary">{fmt(l.totale_premi)}</span></span>
                            <span className="text-muted-foreground">Inc: <span className="font-medium text-foreground">{fmtPct(l.incidenza)}</span></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(l.id); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-3">
                        {/* Mobile KPIs */}
                        <div className="flex sm:hidden gap-3 text-xs">
                          <span className="text-muted-foreground">Fatt: <span className="font-medium text-foreground">{fmt(l.totale_fatturato)}</span></span>
                          <span className="text-muted-foreground">Premi: <span className="font-medium text-primary">{fmt(l.totale_premi)}</span></span>
                          <span className="text-muted-foreground">Inc: <span className="font-medium">{fmtPct(l.incidenza)}</span></span>
                        </div>
                        {l.note && (
                          <p className="text-xs text-muted-foreground italic">Note: {l.note}</p>
                        )}
                        <div className="overflow-auto rounded-md border">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/60">
                                <th className="py-1.5 px-2 text-center text-muted-foreground w-8">#</th>
                                <th className="py-1.5 px-2 text-right text-muted-foreground">Scaglione (€)</th>
                                <th className="py-1.5 px-2 text-right text-muted-foreground">Premio %</th>
                                <th className="py-1.5 px-2 text-right text-muted-foreground">Importo Premio</th>
                              </tr>
                            </thead>
                            <tbody>
                              {righeConPremi
                                .filter((r) => r.fatturato > 0 || r.percentuale > 0)
                                .map((r, i) => (
                                  <tr key={i} className="border-b last:border-0">
                                    <td className="py-1 px-2 text-center text-muted-foreground">{i + 1}</td>
                                    <td className="py-1 px-2 text-right">{fmt(r.fatturato)}</td>
                                    <td className="py-1 px-2 text-right">{r.percentuale}%</td>
                                    <td className="py-1 px-2 text-right font-medium text-primary">{fmt(r.premio)}</td>
                                  </tr>
                                ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t bg-muted/50 font-semibold">
                                <td colSpan={2} className="py-1.5 px-2 text-right">Totale</td>
                                <td className="py-1.5 px-2 text-right text-muted-foreground">{fmtPct(l.incidenza)}</td>
                                <td className="py-1.5 px-2 text-right text-primary">{fmt(l.totale_premi)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Confirm delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina lettera di incentivazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa lettera? L'operazione non è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleElimina(deleteTarget)}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
