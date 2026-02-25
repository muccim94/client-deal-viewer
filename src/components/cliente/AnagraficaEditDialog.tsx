import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomeCliente: string;
  indirizzo: string | null;
  provincia: string | null;
}

export default function AnagraficaEditDialog({ open, onOpenChange, nomeCliente, indirizzo, provincia }: Props) {
  const [addr, setAddr] = useState(indirizzo ?? "");
  const [prov, setProv] = useState(provincia ?? "");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (open) {
      setAddr(indirizzo ?? "");
      setProv(provincia ?? "");
    }
  }, [open, indirizzo, provincia]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("clienti_anagrafica" as any)
      .upsert(
        { nome_cliente: nomeCliente, indirizzo: addr || null, provincia: prov || null } as any,
        { onConflict: "nome_cliente" }
      );
    setSaving(false);
    if (error) {
      toast.error("Errore nel salvataggio");
      return;
    }
    toast.success("Anagrafica aggiornata");
    qc.invalidateQueries({ queryKey: ["cliente-anagrafica", nomeCliente] });
    onOpenChange(false);
  };

  const mapsUrl = addr
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica Anagrafica</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="indirizzo">Indirizzo</Label>
            <Input id="indirizzo" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Via, numero, città..." />
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                <ExternalLink className="h-3 w-3" /> Cerca su Google Maps
              </a>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="provincia">Provincia</Label>
            <Input id="provincia" value={prov} onChange={(e) => setProv(e.target.value)} placeholder="Es. MI, RM..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
