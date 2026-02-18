import { useState, useEffect } from "react";
import { DbRecord } from "@/contexts/DataContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getAziendaNome } from "@/types/data";

interface Props {
  record: DbRecord | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<DbRecord>) => Promise<void>;
}

export function RecordEditDialog({ record, open, onClose, onSave }: Props) {
  const [form, setForm] = useState<Partial<DbRecord>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) setForm({ ...record });
  }, [record]);

  const set = (key: keyof DbRecord, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    try {
      await onSave(record.id, {
        anno: form.anno,
        mese: form.mese,
        azienda: form.azienda,
        azienda_nome: form.azienda_nome,
        codice_cliente: form.codice_cliente,
        nome_cliente: form.nome_cliente,
        agente: form.agente,
        marchio: form.marchio,
        articolo: form.articolo,
        imponibile: form.imponibile,
        provvigione: form.provvigione,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Record</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1">
            <Label>Anno</Label>
            <Input type="number" value={form.anno ?? ""} onChange={(e) => set("anno", Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Mese</Label>
            <Input type="number" min={1} max={12} value={form.mese ?? ""} onChange={(e) => set("mese", Number(e.target.value))} />
          </div>

          <div className="col-span-2 space-y-1">
            <Label>Azienda</Label>
            <Select
              value={form.azienda ?? ""}
              onValueChange={(v) => { set("azienda", v); set("azienda_nome", getAziendaNome(v)); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona azienda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FO">FO — Fogliani</SelectItem>
                <SelectItem value="FU">FU — Futurtec</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Codice Cliente</Label>
            <Input value={form.codice_cliente ?? ""} onChange={(e) => set("codice_cliente", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Nome Cliente</Label>
            <Input value={form.nome_cliente ?? ""} onChange={(e) => set("nome_cliente", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Agente</Label>
            <Input value={form.agente ?? ""} onChange={(e) => set("agente", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Marchio</Label>
            <Input value={form.marchio ?? ""} onChange={(e) => set("marchio", e.target.value)} />
          </div>

          <div className="col-span-2 space-y-1">
            <Label>Articolo</Label>
            <Input value={form.articolo ?? ""} onChange={(e) => set("articolo", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Imponibile (€)</Label>
            <Input type="number" step="0.01" value={form.imponibile ?? ""} onChange={(e) => set("imponibile", Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Provvigione (€)</Label>
            <Input type="number" step="0.01" value={form.provvigione ?? ""} onChange={(e) => set("provvigione", Number(e.target.value))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvataggio..." : "Salva"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
