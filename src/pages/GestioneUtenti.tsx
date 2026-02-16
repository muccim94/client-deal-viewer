import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Users, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface UserInfo {
  id: string;
  email: string;
  role: string;
  can_view_provvigioni: boolean;
}

interface UserAgent {
  id: string;
  user_id: string;
  agente: string;
}

export default function GestioneUtenti() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [userAgents, setUserAgents] = useState<UserAgent[]>([]);
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch users + distinct agents via edge function
      const { data, error: usersError } = await supabase.functions.invoke("list-users");
      if (usersError) throw usersError;
      const usersData = data?.users || [];
      const agentsFromEdge: string[] = data?.agents || [];

      // Sort: admins first, then by email
      const sorted = usersData.sort((a: UserInfo, b: UserInfo) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (a.role !== "admin" && b.role === "admin") return 1;
        return (a.email || "").localeCompare(b.email || "");
      });
      setUsers(sorted);
      setAvailableAgents(agentsFromEdge);

      // Fetch all user_agents
      const { data: agentsData } = await supabase
        .from("user_agents")
        .select("*");
      setUserAgents(agentsData || []);
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") loadData();
  }, [role]);

  const addAgent = async (userId: string) => {
    const agente = selectedAgent[userId];
    if (!agente) return;

    const { error } = await supabase.from("user_agents").insert({ user_id: userId, agente });
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
      return;
    }

    setSelectedAgent((prev) => ({ ...prev, [userId]: "" }));
    loadData();
  };

  const removeAgent = async (assignmentId: string) => {
    const { error } = await supabase.from("user_agents").delete().eq("id", assignmentId);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
      return;
    }
    loadData();
  };

  if (role !== "admin") {
    return <p className="p-6 text-muted-foreground">Accesso riservato agli amministratori.</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 md:h-6 md:w-6" />
        <h1 className="text-xl md:text-2xl font-bold">Gestione Utenti</h1>
      </div>

      <div className="grid gap-4">
        {users.map((u) => {
          const assignments = userAgents.filter((ua) => ua.user_id === u.id);
          const assignedCodes = assignments.map((a) => a.agente);
          const unassigned = availableAgents.filter((a) => !assignedCodes.includes(a));

          return (
            <Card key={u.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-medium">{u.email}</CardTitle>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                    {u.role === "admin" ? "Admin" : "User"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Assigned agents */}
                <div className="flex flex-wrap gap-2">
                  {assignments.length === 0 && (
                    <span className="text-sm text-muted-foreground">Nessun agente assegnato</span>
                  )}
                  {assignments.map((a) => (
                    <Badge key={a.id} variant="secondary" className="gap-1 pr-1">
                      {a.agente}
                      <button
                        onClick={() => removeAgent(a.id)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Provvigioni permission */}
                {u.role !== "admin" && (
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id={`prov-${u.id}`}
                      checked={u.can_view_provvigioni}
                      onCheckedChange={async (checked) => {
                        const { error } = await supabase.functions.invoke("toggle-provvigioni", {
                          body: { user_id: u.id, enabled: !!checked },
                        });
                        if (error) {
                          toast({ title: "Errore", description: error.message, variant: "destructive" });
                          return;
                        }
                        loadData();
                      }}
                    />
                    <Label htmlFor={`prov-${u.id}`} className="text-sm cursor-pointer">
                      Può visualizzare provvigioni
                    </Label>
                  </div>
                )}

                {/* Add agent */}
                {unassigned.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Select
                      value={selectedAgent[u.id] || ""}
                      onValueChange={(v) => setSelectedAgent((prev) => ({ ...prev, [u.id]: v }))}
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Seleziona agente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unassigned.map((ag) => (
                          <SelectItem key={ag} value={ag}>
                            {ag}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => addAgent(u.id)} disabled={!selectedAgent[u.id]}>
                      <Plus className="h-4 w-4 mr-1" />
                      Aggiungi
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
