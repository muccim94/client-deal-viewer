import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Report {
  id: string;
  codice_cliente: string;
  data_report: string;
  tipo: string;
  oggetto: string | null;
  note: string | null;
}

interface Props {
  codiceCliente: string;
}

const emptyForm = { data_report: new Date(), tipo: "visita" as string, oggetto: "", note: "" };

export default function ClienteReport({ codiceCliente }: Props) {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["cliente-report", codiceCliente],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_report")
        .select("*")
        .eq("codice_cliente", codiceCliente)
        .order("data_report", { ascending: false });
      if (error) throw error;
      return data as Report[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cliente-report", codiceCliente] });

  const upsert = useMutation({
    mutationFn: async () => {
      if (!form.tipo) throw new Error("Il tipo è obbligatorio");
      const payload = {
        codice_cliente: codiceCliente,
        data_report: format(form.data_report, "yyyy-MM-dd"),
        tipo: form.tipo,
        oggetto: form.oggetto.trim() || null,
        note: form.note.trim() || null,
        created_by: user!.id,
      };
      if (editingId) {
        const { error } = await supabase.from("cliente_report").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cliente_report").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Report aggiornato" : "Report aggiunto");
      invalidate();
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cliente_report").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Report eliminato"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: Report) => {
    setEditingId(r.id);
    setForm({
      data_report: new Date(r.data_report),
      tipo: r.tipo,
      oggetto: r.oggetto ?? "",
      note: r.note ?? "",
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };

  return (
    <Card>
      <CardHeader className="pb-2 p-3 sm:p-6">
        <CardTitle className="text-sm sm:text-base flex items-center justify-between">
          <span className="flex items-center gap-2"><FileText className="h-4 w-4" />Report Visite / Chiamate</span>
          {isAdmin && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openNew}>
              <Plus className="h-3 w-3 mr-1" />Nuovo report
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun report registrato</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="p-3 rounded-md border bg-muted/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(r.data_report), "dd MMM yyyy", { locale: it })}
                      </span>
                      <Badge variant={r.tipo === "visita" ? "default" : "secondary"} className="text-[10px] h-5">
                        {r.tipo === "visita" ? "Visita" : "Chiamata"}
                      </Badge>
                    </div>
                    {r.oggetto && <p className="text-sm font-medium mt-1">{r.oggetto}</p>}
                    {r.note && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{r.note}</p>}
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
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifica Report" : "Nuovo Report"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !form.data_report && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(form.data_report, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.data_report}
                    onSelect={(d) => d && setForm({ ...form, data_report: d })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visita">Visita</SelectItem>
                  <SelectItem value="chiamata">Chiamata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Oggetto</Label>
              <Input value={form.oggetto} onChange={(e) => setForm({ ...form, oggetto: e.target.value })} placeholder="Argomento principale" />
            </div>
            <div>
              <Label>Note</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Dettagli dell'incontro o della chiamata..."
                rows={4}
              />
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
