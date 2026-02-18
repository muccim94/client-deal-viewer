import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SalesRecord } from "@/types/data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DbRecord {
  id: string;
  azienda: string;
  azienda_nome: string;
  anno: number;
  mese: number;
  codice_cliente: string;
  nome_cliente: string;
  agente: string;
  marchio: string;
  articolo: string;
  imponibile: number;
  provvigione: number;
  fattura_riga: string | null;
  user_id: string;
  created_at: string;
}

export interface FetchFilters {
  anno?: number;
  mese?: number;
  cliente?: string;
  agente?: string;
}

const PAGE_SIZE = 50;

interface DataContextType {
  addRecords: (records: SalesRecord[]) => Promise<{ added: number; duplicates: number }>;
  clearRecords: () => Promise<void>;
  recordCount: number | null;
  refreshRecordCount: () => Promise<void>;
  fetchRecords: (filters: FetchFilters, page: number) => Promise<{ data: DbRecord[]; total: number }>;
  updateRecord: (id: string, data: Partial<DbRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

function toDB(r: SalesRecord, userId: string) {
  return {
    user_id: userId,
    azienda: r.azienda,
    azienda_nome: r.aziendaNome,
    anno: r.anno,
    mese: r.mese,
    codice_cliente: r.codiceCliente,
    nome_cliente: r.nomeCliente,
    agente: r.agente,
    marchio: r.marchio,
    articolo: r.articolo,
    imponibile: r.imponibile,
    provvigione: r.provvigione,
    fattura_riga: r.fatturaRiga,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [recordCount, setRecordCount] = useState<number | null>(null);

  const refreshRecordCount = useCallback(async () => {
    if (!user) { setRecordCount(null); return; }
    const { data, error } = await supabase.rpc("get_record_count");
    if (!error) setRecordCount(data as number);
  }, [user]);

  const addRecords = useCallback(async (newRecords: SalesRecord[]) => {
    if (!user) throw new Error("Not authenticated");

    const CHUNK_SIZE = 500;
    let added = 0;
    for (let i = 0; i < newRecords.length; i += CHUNK_SIZE) {
      const chunk = newRecords.slice(i, i + CHUNK_SIZE).map((r) => toDB(r, user.id));
      const { error, count } = await supabase
        .from("sales_records")
        .upsert(chunk, { onConflict: "user_id,azienda,anno,mese,codice_cliente,articolo,fattura_riga", ignoreDuplicates: true, count: "exact" });
      if (error) throw error;
      added += count ?? chunk.length;
    }

    const duplicates = newRecords.length - added;
    await refreshRecordCount();
    return { added, duplicates };
  }, [user, refreshRecordCount]);

  const clearRecords = useCallback(async () => {
    const { error } = await supabase.from("sales_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
    setRecordCount(0);
  }, []);

  const fetchRecords = useCallback(async (filters: FetchFilters, page: number) => {
    let query = supabase
      .from("sales_records")
      .select("*", { count: "exact" })
      .order("anno", { ascending: false })
      .order("mese", { ascending: false })
      .order("nome_cliente", { ascending: true });

    if (filters.anno) query = query.eq("anno", filters.anno);
    if (filters.mese) query = query.eq("mese", filters.mese);
    if (filters.cliente) query = query.ilike("nome_cliente", `%${filters.cliente}%`);
    if (filters.agente) query = query.ilike("agente", `%${filters.agente}%`);

    const from = page * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as DbRecord[], total: count ?? 0 };
  }, []);

  const updateRecord = useCallback(async (id: string, data: Partial<DbRecord>) => {
    const { error } = await supabase.from("sales_records").update(data).eq("id", id);
    if (error) throw error;
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    const { error } = await supabase.from("sales_records").delete().eq("id", id);
    if (error) throw error;
    await refreshRecordCount();
  }, [refreshRecordCount]);

  return (
    <DataContext.Provider value={{ addRecords, clearRecords, recordCount, refreshRecordCount, fetchRecords, updateRecord, deleteRecord }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
