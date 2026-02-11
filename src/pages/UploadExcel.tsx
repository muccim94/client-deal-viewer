import { useState, useCallback } from "react";
import { useData } from "@/contexts/DataContext";
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
  const { records, setRecords } = useData();
  const [preview, setPreview] = useState<SalesRecord[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      const data = await parseExcelFile(file);
      setPreview(data);
      setFileName(file.name);
    } catch {
      toast.error("Errore nel parsing del file Excel");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const recordKey = (r: SalesRecord) =>
    `${r.azienda}|${r.anno}|${r.mese}|${r.codiceCliente}|${r.articolo}|${r.imponibile}`;

  const confirm = () => {
    if (!preview) return;
    const existingKeys = new Set(records.map(recordKey));
    const nuovi = preview.filter((r) => !existingKeys.has(recordKey(r)));
    const duplicati = preview.length - nuovi.length;

    if (nuovi.length === 0) {
      toast.warning("Tutti i record sono già presenti nello storico.");
      return;
    }

    setRecords([...records, ...nuovi]);
    const msg = duplicati > 0
      ? `${nuovi.length} record aggiunti, ${duplicati} duplicati ignorati (totale: ${records.length + nuovi.length})`
      : `${nuovi.length} record aggiunti allo storico (totale: ${records.length + nuovi.length})`;
    toast.success(msg);
    setPreview(null);
    setFileName("");
  };

  const cancel = () => {
    setPreview(null);
    setFileName("");
  };

  const clearAll = () => {
    setRecords([]);
    setPreview(null);
    setFileName("");
    toast.success("Storico dati cancellato");
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
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <UploadIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Trascina qui il file Excel oppure clicca per selezionarlo
            </p>
            <p className="text-xs text-muted-foreground mt-1">Formati supportati: .xlsx, .xls</p>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onFileInput}
            />
          </div>
        </CardContent>
      </Card>

      {records.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-muted-foreground">
              Storico attuale: <span className="font-medium text-foreground">{records.length}</span> record
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadBackup}>
                <Download className="h-4 w-4 mr-1" /> Scarica backup
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
                      Questa azione eliminerà tutti i {records.length} record importati. L'operazione non è reversibile.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction onClick={clearAll}>Cancella tutto</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {preview && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                Anteprima: {fileName} ({preview.length} record)
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancel}>
                <X className="h-4 w-4 mr-1" /> Annulla
              </Button>
              <Button size="sm" onClick={confirm}>
                <Check className="h-4 w-4 mr-1" /> Importa dati
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Azienda</TableHead>
                    <TableHead>Codice</TableHead>
                    <TableHead>Nome Cliente</TableHead>
                    <TableHead>Marchio</TableHead>
                    <TableHead>Imponibile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 50).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.aziendaNome}</TableCell>
                      <TableCell>{r.codiceCliente}</TableCell>
                      <TableCell>{r.nomeCliente}</TableCell>
                      <TableCell>{r.marchio}</TableCell>
                      <TableCell>{fmt(r.imponibile)}</TableCell>
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
