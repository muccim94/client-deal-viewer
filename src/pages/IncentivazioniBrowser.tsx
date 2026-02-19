import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Download, FileDown, Loader2, Search, Users } from "lucide-react";

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
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) =>
  new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + "%";

// ── TAB BAR (shared) ──────────────────────────────────────────────────────────
export function AnagraficheTabBar({ active }: { active: "clienti" | "incentivazioni" }) {
  return (
    <div className="flex gap-0 border-b mb-4">
      <Link to="/anagrafiche">
        <button
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            active === "clienti"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Clienti
          </span>
        </button>
      </Link>
      <Link to="/anagrafiche/incentivazioni">
        <button
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            active === "incentivazioni"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" />
            Incentivazioni
          </span>
        </button>
      </Link>
    </div>
  );
}

// ── PDF GENERATION ─────────────────────────────────────────────────────────────
function generateLetteraHtml(l: Lettera, addPageBreak: boolean): string {
  const righe: Riga[] = Array.isArray(l.righe) ? l.righe : [];
  const righeConPremi = righe.map((r) => ({
    ...r,
    premio: r.fatturato * (r.percentuale / 100),
  }));
  const righeValide = righeConPremi.filter((r) => r.fatturato > 0 || r.percentuale > 0);
  const dataOggi = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });

  const rows = righeValide
    .map(
      (r, i) => `
      <tr>
        <td style="text-align:center;color:#666">${i + 1}</td>
        <td style="text-align:right">${fmt(r.fatturato)}</td>
        <td style="text-align:right">${r.percentuale}%</td>
        <td style="text-align:right;font-weight:600">${fmt(r.premio)}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;font-size:12px;max-width:700px;margin:0 auto;padding:40px 32px;${addPageBreak ? "page-break-after:always;" : ""}">
      <div style="text-align:center;margin-bottom:32px">
        <h1 style="font-size:18px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 4px">
          Lettera di Incentivazione
        </h1>
        <div style="width:60px;height:3px;background:#1d4ed8;margin:0 auto"></div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
        <tr>
          <td style="padding:4px 0;color:#555;width:140px">Cliente</td>
          <td style="padding:4px 0;font-weight:600">${l.nome_cliente}</td>
          <td style="padding:4px 0;color:#555;width:140px">Anno di riferimento</td>
          <td style="padding:4px 0;font-weight:600">${l.anno}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555">Codice cliente</td>
          <td style="padding:4px 0;font-weight:600">${l.codice_cliente}</td>
          <td style="padding:4px 0;color:#555">Data emissione</td>
          <td style="padding:4px 0;font-weight:600">${dataOggi}</td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:11px">
        <thead>
          <tr style="background:#1d4ed8;color:#fff">
            <th style="padding:8px;text-align:center;width:40px">#</th>
            <th style="padding:8px;text-align:right">Scaglione Fatturato (€)</th>
            <th style="padding:8px;text-align:right">Premio % per Step</th>
            <th style="padding:8px;text-align:right">Importo Premio (€)</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="4" style="text-align:center;color:#888;padding:12px">Nessuno scaglione inserito</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background:#f3f4f6;font-weight:700;border-top:2px solid #1d4ed8">
            <td colspan="1" style="padding:8px;text-align:right;color:#555">Totale</td>
            <td style="padding:8px;text-align:right">${fmt(l.totale_fatturato)}</td>
            <td style="padding:8px;text-align:right;color:#555">Incidenza: ${fmtPct(l.incidenza)}</td>
            <td style="padding:8px;text-align:right;color:#1d4ed8">${fmt(l.totale_premi)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="display:flex;gap:32px;margin-bottom:24px">
        <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;text-align:center">
          <div style="color:#555;font-size:10px;margin-bottom:2px">Totale Fatturato</div>
          <div style="font-weight:700;font-size:14px">${fmt(l.totale_fatturato)}</div>
        </div>
        <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px;text-align:center">
          <div style="color:#1d4ed8;font-size:10px;margin-bottom:2px">Totale Premi Liquidati</div>
          <div style="font-weight:700;font-size:14px;color:#1d4ed8">${fmt(l.totale_premi)}</div>
        </div>
        <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;text-align:center">
          <div style="color:#555;font-size:10px;margin-bottom:2px">Incidenza %</div>
          <div style="font-weight:700;font-size:14px">${fmtPct(l.incidenza)}</div>
        </div>
      </div>

      ${l.note ? `<div style="background:#fefce8;border:1px solid #fde047;border-radius:6px;padding:12px;font-size:11px"><span style="font-weight:600">Note:</span> ${l.note}</div>` : ""}
    </div>`;
}

const pdfStyles = `
  <style>
    body { margin: 0; padding: 0; background: #fff; }
    table { border-collapse: collapse; }
    td, th { border: 1px solid #e2e8f0; }
    thead th { border-color: #1d4ed8; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>`;

function openPdfWindow(lettere: Lettera[]) {
  const html = lettere.map((l, i) => generateLetteraHtml(l, i < lettere.length - 1)).join("");
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<html><head><title>Incentivazioni</title>${pdfStyles}</head><body>${html}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function IncentivazioniBrowser() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [filterAnno, setFilterAnno] = useState<string>("__all__");
  const [filterCliente, setFilterCliente] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: rows = [], isLoading } = useQuery<Lettera[]>({
    queryKey: ["all-incentivazioni"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_incentivazioni" as any)
        .select("*")
        .order("anno", { ascending: false })
        .order("nome_cliente", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Lettera[];
    },
    enabled: isAdmin,
  });

  // Available years for filter
  const anni = useMemo(() => {
    const set = new Set<number>(rows.map((r) => r.anno));
    return Array.from(set).sort((a, b) => b - a);
  }, [rows]);

  // Filtered list (client-side for snappiness)
  const filtered = useMemo(() => {
    let data = rows;
    if (filterAnno !== "__all__") {
      data = data.filter((r) => r.anno === parseInt(filterAnno));
    }
    if (filterCliente.trim()) {
      const q = filterCliente.trim().toLowerCase();
      data = data.filter(
        (r) =>
          r.nome_cliente.toLowerCase().includes(q) ||
          r.codice_cliente.toLowerCase().includes(q)
      );
    }
    return data;
  }, [rows, filterAnno, filterCliente]);

  // Selection logic
  const allIds = filtered.map((r) => r.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = allIds.some((id) => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = allIds.filter((id) => selected.has(id)).length;

  const handleDownloadSelected = () => {
    const lettere = filtered.filter((l) => selected.has(l.id));
    if (!lettere.length) return;
    openPdfWindow(lettere);
  };

  const handleDownloadSingle = (l: Lettera) => {
    openPdfWindow([l]);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Award className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">Accesso non autorizzato</p>
        <p className="text-sm">Solo gli amministratori possono visualizzare le incentivazioni.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnagraficheTabBar active="incentivazioni" />

      <Card>
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              {isLoading ? "Caricamento..." : `${filtered.length} incentivazioni`}
              {selectedCount > 0 && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({selectedCount} selezionate)
                </span>
              )}
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              {/* Anno filter */}
              <Select value={filterAnno} onValueChange={setFilterAnno}>
                <SelectTrigger className="h-8 text-xs w-32">
                  <SelectValue placeholder="Tutti gli anni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tutti gli anni</SelectItem>
                  {anni.map((a) => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Cliente filter */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Codice o nome cliente..."
                  value={filterCliente}
                  onChange={(e) => setFilterCliente(e.target.value)}
                  className="pl-7 h-8 text-xs w-48"
                />
              </div>

              {/* Download selected */}
              <Button
                size="sm"
                variant={selectedCount > 0 ? "default" : "outline"}
                className="h-8 gap-1.5 text-xs"
                onClick={handleDownloadSelected}
                disabled={selectedCount === 0}
              >
                <Download className="h-3.5 w-3.5" />
                {selectedCount > 0 ? `Scarica PDF (${selectedCount})` : "Scarica PDF"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Award className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Nessuna incentivazione trovata</p>
              <p className="text-xs mt-1">
                {rows.length === 0
                  ? "Non ci sono ancora lettere di incentivazione salvate."
                  : "Prova a modificare i filtri di ricerca."}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 px-3">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        aria-label="Seleziona tutto"
                        className={someSelected && !allSelected ? "opacity-50" : ""}
                      />
                    </TableHead>
                    <TableHead className="px-3">Cliente</TableHead>
                    <TableHead className="px-3 hidden sm:table-cell">Codice</TableHead>
                    <TableHead className="px-3 text-center">Anno</TableHead>
                    <TableHead className="px-3 text-right hidden md:table-cell">Fatt. Totale</TableHead>
                    <TableHead className="px-3 text-right">Tot. Premi</TableHead>
                    <TableHead className="px-3 text-right hidden sm:table-cell">Incidenza</TableHead>
                    <TableHead className="px-3 text-center w-14">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id} className={selected.has(l.id) ? "bg-primary/5" : ""}>
                      <TableCell className="px-3">
                        <Checkbox
                          checked={selected.has(l.id)}
                          onCheckedChange={() => toggleOne(l.id)}
                          aria-label={`Seleziona ${l.nome_cliente}`}
                        />
                      </TableCell>
                      <TableCell className="px-3">
                        <Link
                          to={`/anagrafiche/${l.codice_cliente}`}
                          className="font-medium text-primary hover:underline text-sm"
                        >
                          {l.nome_cliente}
                        </Link>
                        <div className="text-xs text-muted-foreground sm:hidden">{l.codice_cliente}</div>
                      </TableCell>
                      <TableCell className="px-3 hidden sm:table-cell text-sm text-muted-foreground">
                        {l.codice_cliente}
                      </TableCell>
                      <TableCell className="px-3 text-center text-sm font-medium">{l.anno}</TableCell>
                      <TableCell className="px-3 text-right tabular-nums text-sm hidden md:table-cell">
                        {fmt(l.totale_fatturato)}
                      </TableCell>
                      <TableCell className="px-3 text-right tabular-nums text-sm font-semibold text-primary">
                        {fmt(l.totale_premi)}
                      </TableCell>
                      <TableCell className="px-3 text-right tabular-nums text-sm hidden sm:table-cell text-muted-foreground">
                        {fmtPct(l.incidenza)}
                      </TableCell>
                      <TableCell className="px-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => handleDownloadSingle(l)}
                          title="Esporta PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
