import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Phone, Mail, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Referente {
  id: string;
  codice_cliente: string;
  nome: string;
  ruolo: string | null;
  telefono: string | null;
  email: string | null;
}

interface Props {
  codiceCliente: string;
}

const emptyForm = { nome: "", ruolo: "", telefono: "", email: "" };

export default function ClienteReferenti({ codiceCliente }: Props) {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: referenti = [], isLoading } = useQuery({
    queryKey: ["cliente-referenti", codiceCliente],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_referenti")
        .select("*")
        .eq("codice_cliente", codiceCliente)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Referente[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cliente-referenti", codiceCliente] });

  const upsert = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Il nome è obbligatorio");
      const payload = {
        codice_cliente: codiceCliente,
        nome: form.nome.trim(),
        ruolo: form.ruolo.trim() || null,
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        created_by: user!.id,
      };
      if (editingId) {
        const { error } = await supabase.from("cliente_referenti").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cliente_referenti").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Referente aggiornato" : "Referente aggiunto");
      invalidate();
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cliente_referenti").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Referente eliminato"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: Referente) => {
    setEditingId(r.id);
    setForm({ nome: r.nome, ruolo: r.ruolo ?? "", telefono: r.telefono ?? "", email: r.email ?? "" });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };

  return (
    <Card>
      <CardHeader className="pb-2 p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base flex items-center justify-between">
          <span className="flex items-center gap-2"><Users className="h-4 w-4" />Referenti</span>
          {isAdmin && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openNew}>
              <Plus className="h-3 w-3 mr-1" />Aggiungi
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        ) : referenti.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun referente registrato</p>
        ) : (
          <div className="space-y-3">
            {referenti.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-2 p-2 rounded-md border bg-muted/20">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.nome}</p>
                  {r.ruolo && <p className="text-xs text-muted-foreground">{r.ruolo}</p>}
                  <div className="flex flex-wrap gap-3 mt-1">
                    {r.telefono && (
                      <a href={`tel:${r.telefono}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Phone className="h-3 w-3" />{r.telefono}
                      </a>
                    )}
                    {r.email && (
                      <a href={`mailto:${r.email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />{r.email}
                      </a>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(r)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteMut.mutate(r.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifica Referente" : "Nuovo Referente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome e cognome" />
            </div>
            <div>
              <Label>Ruolo</Label>
              <Input value={form.ruolo} onChange={(e) => setForm({ ...form, ruolo: e.target.value })} placeholder="Es. Titolare, Resp. acquisti" />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Numero di telefono" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@esempio.it" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annulla</Button>
            <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>
              {upsert.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
