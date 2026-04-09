import { useState, useCallback, useEffect, useRef } from "react";
import { useData, DbRecord, FetchFilters } from "@/contexts/DataContext";

import { useAuth } from "@/contexts/AuthContext";
import { parseExcelFile } from "@/lib/parseExcel";
import { parseAnagraficaExcel, AnagraficaRecord } from "@/lib/parseAnagraficaExcel";
import { SalesRecord, getMeseNome } from "@/types/data";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload as UploadIcon, FileSpreadsheet, Check, X, Trash2, Pencil, ChevronLeft, ChevronRight, Search, Plus, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { RecordEditDialog } from "@/components/upload/RecordEditDialog";

const PAGE_SIZE = 50;

const MESI = [
  { v: 1, l: "Gennaio" }, { v: 2, l: "Febbraio" }, { v: 3, l: "Marzo" },
  { v: 4, l: "Aprile" }, { v: 5, l: "Maggio" }, { v: 6, l: "Giugno" },
  { v: 7, l: "Luglio" }, { v: 8, l: "Agosto" }, { v: 9, l: "Settembre" },
  { v: 10, l: "Ottobre" }, { v: 11, l: "Novembre" }, { v: 12, l: "Dicembre" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

export default function UploadExcel() {
  const { addRecords, addRecord, clearRecords, recordCount, refreshRecordCount, fetchRecords, updateRecord, deleteRecord, backupProgress, isBackingUp, runBackup } = useData();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  // --- upload state ---
  const [preview, setPreview] = useState<SalesRecord[] | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);

  // --- editor state ---
  const [editorPage, setEditorPage] = useState(0);
  const [editorTotal, setEditorTotal] = useState(0);
  const [editorRows, setEditorRows] = useState<DbRecord[]>([]);
  const [editorLoading, setEditorLoading] = useState(false);
  const [filters, setFilters] = useState<FetchFilters>({});
  const [filterAnnoStr, setFilterAnnoStr] = useState("");
  const [filterClienteInput, setFilterClienteInput] = useState("");
  const [filterAgenteInput, setFilterAgenteInput] = useState("");
  const [editTarget, setEditTarget] = useState<DbRecord | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbRecord | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showPeriodDeleteDialog, setShowPeriodDeleteDialog] = useState(false);
  const [periodDeleting, setPeriodDeleting] = useState(false);
  const clienteDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agenteDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- anagrafica upload state ---
  const [anagPreview, setAnagPreview] = useState<AnagraficaRecord[] | null>(null);
  const [anagFileName, setAnagFileName] = useState("");
  const [anagDragging, setAnagDragging] = useState(false);
  const [anagImporting, setAnagImporting] = useState(false);

  const isAdmin = role === "admin";

  // Load editor rows whenever filters or page change
  const loadEditor = useCallback(async (f: FetchFilters, page: number) => {
    setEditorLoading(true);
    try {
      const { data, total } = await fetchRecords(f, page);
      setEditorRows(data);
      setEditorTotal(total);
    } catch {
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setEditorLoading(false);
    }
  }, [fetchRecords]);

  useEffect(() => {
    if (isAdmin) refreshRecordCount();
  }, [isAdmin, refreshRecordCount]);

  useEffect(() => {
    if (isAdmin && recordCount != null && recordCount > 0) {
      loadEditor(filters, editorPage);
    }
  }, [filters, editorPage, recordCount, isAdmin, loadEditor]);

  // --- filter handlers ---
  const handleAnnoChange = (v: string) => {
    const anno = v === "all" ? undefined : Number(v);
    setFilterAnnoStr(v);
    setEditorPage(0);
    setFilters((f) => ({ ...f, anno }));
  };

  const handleMeseChange = (v: string) => {
    const mese = v === "all" ? undefined : Number(v);
    setEditorPage(0);
    setFilters((f) => ({ ...f, mese }));
  };

  const handleClienteInput = (v: string) => {
    setFilterClienteInput(v);
    if (clienteDebounce.current) clearTimeout(clienteDebounce.current);
    clienteDebounce.current = setTimeout(() => {
      setEditorPage(0);
      setFilters((f) => ({ ...f, cliente: v || undefined }));
    }, 400);
  };

  const handleAgenteInput = (v: string) => {
    setFilterAgenteInput(v);
    if (agenteDebounce.current) clearTimeout(agenteDebounce.current);
    agenteDebounce.current = setTimeout(() => {
      setEditorPage(0);
      setFilters((f) => ({ ...f, agente: v || undefined }));
    }, 400);
  };

  // Derive unique years from available records (rough: just use filter options)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // --- upload handlers ---
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    try {
      const allData: SalesRecord[] = [];
      const names: string[] = [];
      for (const file of Array.from(files)) {
        const data = await parseExcelFile(file);
        allData.push(...data);
        names.push(file.name);
      }
      setPreview((prev) => prev ? [...prev, ...allData] : allData);
      setFileNames((prev) => [...prev, ...names]);
    } catch {
      toast.error("Errore nel parsing di uno o più file Excel");
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
  };

  const confirm = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const { added, duplicates } = await addRecords(preview);
      if (added === 0) {
        toast.warning("Tutti i record sono già presenti nello storico.");
      } else {
        const msg = duplicates > 0
          ? `${added} record aggiunti, ${duplicates} duplicati ignorati`
          : `${added} record aggiunti allo storico`;
        toast.success(msg);
      }
      setPreview(null);
      setFileNames([]);
      queryClient.invalidateQueries();
      loadEditor(filters, editorPage);
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'importazione");
    } finally {
      setImporting(false);
    }
  };

  const cancel = () => { setPreview(null); setFileNames([]); };

  const clearAll = async () => {
    try {
      await clearRecords();
      setPreview(null);
      setFileNames([]);
      setEditorRows([]);
      setEditorTotal(0);
      queryClient.invalidateQueries();
      toast.success("Storico dati cancellato");
    } catch (err: any) {
      toast.error(err.message || "Errore durante la cancellazione");
    }
  };

  // --- editor handlers ---
  const handleSaveRecord = async (id: string | null, data: Partial<DbRecord>) => {
    try {
      if (id) {
        await updateRecord(id, data);
        toast.success("Record aggiornato");
      } else {
        await addRecord(data as Omit<DbRecord, "id" | "created_at">);
        toast.success("Record aggiunto");
      }
      loadEditor(filters, editorPage);
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Errore durante il salvataggio");
    }
  };

  const handleDeleteRecord = async (record: DbRecord) => {
    try {
      await deleteRecord(record.id);
      toast.success("Record eliminato");
      setSelected((prev) => { const next = new Set(prev); next.delete(record.id); return next; });
      loadEditor(filters, editorPage);
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'eliminazione");
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const ids = Array.from(selected);
      const { error } = await (await import("@/integrations/supabase/client")).supabase
        .from("sales_records")
        .delete()
        .in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} record eliminati`);
      setSelected(new Set());
      loadEditor(filters, editorPage);
      queryClient.invalidateQueries();
      refreshRecordCount();
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'eliminazione multipla");
    } finally {
      setBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const toggleSelectAll = () => {
    const allIds = editorRows.map((r) => r.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...allIds]));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allOnPageSelected = editorRows.length > 0 && editorRows.every((r) => selected.has(r.id));

  const hasActiveFilters = !!(filters.anno || filters.mese || filters.cliente || filters.agente);

  const periodFilterLabel = [
    filters.anno ? `Anno ${filters.anno}` : null,
    filters.mese ? MESI.find(m => m.v === filters.mese)?.l : null,
    filters.cliente ? `Cliente "${filters.cliente}"` : null,
    filters.agente ? `Agente "${filters.agente}"` : null,
  ].filter(Boolean).join(", ");

  const handlePeriodDelete = async () => {
    setPeriodDeleting(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      let q = supabase.from("sales_records").delete();
      if (filters.anno) q = q.eq("anno", filters.anno);
      if (filters.mese) q = q.eq("mese", filters.mese);
      if (filters.cliente) q = q.or(`nome_cliente.ilike.%${filters.cliente}%,codice_cliente.ilike.%${filters.cliente}%`);
      if (filters.agente) q = q.ilike("agente", `%${filters.agente}%`);
      const { error, count } = await q;
      if (error) throw error;
      toast.success(`Record del periodo eliminati con successo`);
      setSelected(new Set());
      loadEditor(filters, 0);
      setEditorPage(0);
      queryClient.invalidateQueries();
      refreshRecordCount();
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'eliminazione per periodo");
    } finally {
      setPeriodDeleting(false);
      setShowPeriodDeleteDialog(false);
    }
  };

  const totalPages = Math.ceil(editorTotal / PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Upload card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carica File Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-lg p-6 md:p-12 text-center transition-colors cursor-pointer ${
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <UploadIcon className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-3 md:mb-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Trascina qui i file Excel oppure clicca per selezionarli
            </p>
            <p className="text-xs text-muted-foreground mt-1">Formati supportati: .xlsx, .xls — puoi selezionare più file</p>
            <input id="file-input" type="file" accept=".xlsx,.xls" multiple className="hidden" onChange={onFileInput} />
          </div>
        </CardContent>
      </Card>

      {/* Record count + clear */}
      {recordCount != null && recordCount > 0 && (
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
            <p className="text-sm text-muted-foreground">
              Storico attuale: <span className="font-medium text-foreground">{recordCount.toLocaleString("it-IT")}</span> record
            </p>
            {isAdmin && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={runBackup} disabled={isBackingUp}>
                  <Download className="h-4 w-4 mr-1" />
                  {backupProgress
                    ? `${Math.round((backupProgress.loaded / backupProgress.total) * 100)}%`
                    : "Backup"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" /> Cancella storico
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancellare tutti i dati?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Questa azione eliminerà tutti i {recordCount.toLocaleString("it-IT")} record importati. L'operazione non è reversibile.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAll}>Cancella tutto</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import preview */}
      {preview && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                Anteprima: {fileNames.join(", ")} ({preview.length} record)
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancel}>
                <X className="h-4 w-4 mr-1" /> Annulla
              </Button>
              <Button size="sm" onClick={confirm} disabled={importing}>
                <Check className="h-4 w-4 mr-1" /> {importing ? "Importazione..." : "Importa dati"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">Azienda</TableHead>
                    <TableHead className="hidden sm:table-cell">Codice</TableHead>
                    <TableHead>Nome Cliente</TableHead>
                    <TableHead className="hidden sm:table-cell">Marchio</TableHead>
                    <TableHead>Imponibile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 50).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="hidden sm:table-cell">{r.aziendaNome}</TableCell>
                      <TableCell className="hidden sm:table-cell">{r.codiceCliente}</TableCell>
                      <TableCell className="text-sm">{r.nomeCliente}</TableCell>
                      <TableCell className="hidden sm:table-cell">{r.marchio}</TableCell>
                      <TableCell className="text-sm">{fmt(r.imponibile)}</TableCell>
                    </TableRow>
                  ))}
                  {preview.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">
                        ...e altri {preview.length - 50} record
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── IMPORTA ANAGRAFICHE (solo admin) ── */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Importa Anagrafiche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!anagPreview ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setAnagDragging(true); }}
                onDragLeave={() => setAnagDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setAnagDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (!file) return;
                  try {
                    const data = await parseAnagraficaExcel(file);
                    setAnagPreview(data);
                    setAnagFileName(file.name);
                  } catch (err: any) {
                    toast.error(err.message || "Errore nel parsing del file");
                  }
                }}
                className={`border-2 border-dashed rounded-lg p-6 md:p-12 text-center transition-colors cursor-pointer ${
                  anagDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onClick={() => document.getElementById("anag-file-input")?.click()}
              >
                <UploadIcon className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-3 md:mb-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Trascina qui un file Excel con i dati anagrafici
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Colonne attese: Nome Cliente, Partita IVA, Indirizzo, Provincia, Telefono, Email
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    const headers = [["Nome Cliente", "Partita IVA", "Indirizzo", "Provincia", "Telefono", "Email"]];
                    const ws = XLSX.utils.aoa_to_sheet(headers);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Template");
                    XLSX.writeFile(wb, "template_anagrafiche.xlsx");
                  }}
                >
                  <Download className="h-4 w-4 mr-1" /> Scarica Template
                </Button>
                <input
                  id="anag-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const data = await parseAnagraficaExcel(file);
                      setAnagPreview(data);
                      setAnagFileName(file.name);
                    } catch (err: any) {
                      toast.error(err.message || "Errore nel parsing del file");
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{anagFileName} — {anagPreview.length} record</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setAnagPreview(null); setAnagFileName(""); }}>
                      <X className="h-4 w-4 mr-1" /> Annulla
                    </Button>
                    <Button
                      size="sm"
                      disabled={anagImporting}
                      onClick={async () => {
                        setAnagImporting(true);
                        try {
                          const { error } = await supabase
                            .from("clienti_anagrafica")
                            .upsert(
                              anagPreview.map((r) => ({
                                nome_cliente: r.nome_cliente,
                                partita_iva: r.partita_iva || null,
                                indirizzo: r.indirizzo || null,
                                provincia: r.provincia || null,
                                telefono: r.telefono || null,
                                email: r.email || null,
                              })),
                              { onConflict: "nome_cliente" }
                            );
                          if (error) throw error;
                          toast.success(`${anagPreview.length} anagrafiche importate/aggiornate`);
                          setAnagPreview(null);
                          setAnagFileName("");
                          queryClient.invalidateQueries();
                        } catch (err: any) {
                          toast.error(err.message || "Errore durante l'importazione");
                        } finally {
                          setAnagImporting(false);
                        }
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" /> {anagImporting ? "Importazione..." : "Importa"}
                    </Button>
                  </div>
                </div>
                <div className="max-h-72 overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome Cliente</TableHead>
                        <TableHead className="hidden sm:table-cell">P.IVA</TableHead>
                        <TableHead className="hidden sm:table-cell">Telefono</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Indirizzo</TableHead>
                        <TableHead className="hidden md:table-cell">Prov.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anagPreview.slice(0, 50).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{r.nome_cliente}</TableCell>
                          <TableCell className="text-sm hidden sm:table-cell">{r.partita_iva || "—"}</TableCell>
                          <TableCell className="text-sm hidden sm:table-cell">{r.telefono || "—"}</TableCell>
                          <TableCell className="text-sm hidden sm:table-cell">{r.email || "—"}</TableCell>
                          <TableCell className="text-sm hidden md:table-cell">{r.indirizzo || "—"}</TableCell>
                          <TableCell className="text-sm hidden md:table-cell">{r.provincia || "—"}</TableCell>
                        </TableRow>
                      ))}
                      {anagPreview.length > 50 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground text-sm">
                            ...e altri {anagPreview.length - 50} record
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── EDITOR SEZIONE (solo admin) ── */}
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Modifica Storico</CardTitle>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {hasActiveFilters && (
                <Button
                  variant="outline" size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowPeriodDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Elimina periodo
                </Button>
              )}
              {selected.size > 0 && (
                <Button
                  variant="destructive" size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  disabled={bulkDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Elimina {selected.size} selezionati
                </Button>
              )}
              <Button size="sm" onClick={() => setAddingNew(true)}>
                <Plus className="h-4 w-4 mr-1" /> Nuovo Record
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtri */}
            <div className="flex flex-wrap gap-2">
              <Select value={filterAnnoStr || "all"} onValueChange={handleAnnoChange}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Anno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli anni</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={handleMeseChange} defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Mese" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i mesi</SelectItem>
                  {MESI.map((m) => (
                    <SelectItem key={m.v} value={String(m.v)}>{m.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-40">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Cerca cliente..."
                  value={filterClienteInput}
                  onChange={(e) => handleClienteInput(e.target.value)}
                />
              </div>

              <div className="relative flex-1 min-w-36">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Cerca agente..."
                  value={filterAgenteInput}
                  onChange={(e) => handleAgenteInput(e.target.value)}
                />
              </div>
            </div>

            {/* Tabella */}
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allOnPageSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Seleziona tutti"
                      />
                    </TableHead>
                    <TableHead className="w-14">Anno</TableHead>
                    <TableHead className="w-24">Mese</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Agente</TableHead>
                    <TableHead className="hidden lg:table-cell">Marchio</TableHead>
                    <TableHead className="text-right">Imponibile</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Provvigione</TableHead>
                    <TableHead className="w-20 text-center">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editorLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                        Caricamento...
                      </TableCell>
                    </TableRow>
                  ) : editorRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                        Nessun record trovato
                      </TableCell>
                    </TableRow>
                  ) : editorRows.map((r) => (
                    <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(r.id)}
                          onCheckedChange={() => toggleSelect(r.id)}
                          aria-label={`Seleziona ${r.nome_cliente}`}
                        />
                      </TableCell>
                      <TableCell className="text-sm">{r.anno}</TableCell>
                      <TableCell className="text-sm">{getMeseNome(r.mese)}</TableCell>
                      <TableCell className="text-sm">{r.nome_cliente}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{r.agente}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{r.marchio}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(r.imponibile)}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-sm">{fmt(r.provvigione)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setEditTarget(r)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <AlertDialog open={deleteTarget?.id === r.id} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(r)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminare il record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Stai per eliminare il record di <strong>{r.nome_cliente}</strong> ({getMeseNome(r.mese)} {r.anno}). L'operazione non è reversibile.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleDeleteRecord(r)}
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginazione */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <Button
                  variant="outline" size="sm"
                  disabled={editorPage === 0}
                  onClick={() => setEditorPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Precedente
                </Button>
                <span>Pagina {editorPage + 1} di {totalPages} ({editorTotal.toLocaleString("it-IT")} record)</span>
                <Button
                  variant="outline" size="sm"
                  disabled={editorPage >= totalPages - 1}
                  onClick={() => setEditorPage((p) => p + 1)}
                >
                  Successivo <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk delete dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare {selected.size} record?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare {selected.size} record selezionati. L'operazione non è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? "Eliminazione..." : "Elimina tutti"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Period delete dialog */}
      <AlertDialog open={showPeriodDeleteDialog} onOpenChange={setShowPeriodDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare tutti i record del periodo?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare <strong>tutti i {editorTotal} record</strong> corrispondenti ai filtri: <strong>{periodFilterLabel}</strong>. L'operazione non è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handlePeriodDelete}
              disabled={periodDeleting}
            >
              {periodDeleting ? "Eliminazione..." : "Elimina periodo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit / New dialog */}
      <RecordEditDialog
        record={addingNew ? null : editTarget}
        open={!!editTarget || addingNew}
        onClose={() => { setEditTarget(null); setAddingNew(false); }}
        onSave={handleSaveRecord}
      />
    </div>
  );
}
