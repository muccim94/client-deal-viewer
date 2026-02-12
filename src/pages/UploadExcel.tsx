import { useState, useCallback } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { parseExcelFile } from "@/lib/parseExcel";
import { SalesRecord } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Upload as UploadIcon, FileSpreadsheet, Check, X, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function UploadExcel() {
  const { records, addRecords, clearRecords } = useData();
  const { role } = useAuth();
  const [preview, setPreview] = useState<SalesRecord[] | null>(null);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);

  const isAdmin = role === "admin";

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

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

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
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'importazione");
    } finally {
      setImporting(false);
    }
  };

  const cancel = () => {
    setPreview(null);
    setFileNames([]);
  };

  const clearAll = async () => {
    try {
      await clearRecords();
      setPreview(null);
      setFileNames([]);
      toast.success("Storico dati cancellato");
    } catch (err: any) {
      toast.error(err.message || "Errore durante la cancellazione");
    }
  };

  const downloadBackup = () => {
    if (!records.length) {
      toast.warning("Nessun dato da esportare");
      return;
    }
    const rows = records.map((r) => ({
      Azienda: r.azienda,
      Anno: r.anno,
      Mese: r.mese,
      Cliente: `${r.azienda}_${r.codiceCliente} - ${r.nomeCliente}`,
      Agente: r.agente,
      Articolo: `${r.azienda}_${r.articolo}`,
      Imponibile: r.imponibile,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dati");
    XLSX.writeFile(wb, `backup_dati_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Backup scaricato");
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              multiple
              className="hidden"
              onChange={onFileInput}
            />
          </div>
        </CardContent>
      </Card>

      {records.length > 0 && (
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
            <p className="text-sm text-muted-foreground">
              Storico attuale: <span className="font-medium text-foreground">{records.length}</span> record
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={downloadBackup}>
                <Download className="h-4 w-4 mr-1" /> Scarica backup
              </Button>
              {isAdmin && (
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
                        Questa azione eliminerà tutti i {records.length} record importati. L'operazione non è reversibile.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAll}>Cancella tutto</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
