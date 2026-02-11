import { useState, useCallback } from "react";
import { useData } from "@/contexts/DataContext";
import { parseExcelFile } from "@/lib/parseExcel";
import { SalesRecord } from "@/types/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Upload as UploadIcon, FileSpreadsheet, Check, X } from "lucide-react";
import { toast } from "sonner";

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


  const confirm = () => {
    if (!preview) return;
    setRecords([...records, ...preview]);
    toast.success(`${preview.length} record aggiunti allo storico (totale: ${records.length + preview.length})`);
    setPreview(null);
    setFileName("");
  };

  const cancel = () => {
    setPreview(null);
    setFileName("");
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
