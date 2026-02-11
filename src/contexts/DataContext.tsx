import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { SalesRecord } from "@/types/data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DataContextType {
  records: SalesRecord[];
  loading: boolean;
  addRecords: (records: SalesRecord[]) => Promise<{ added: number; duplicates: number }>;
  clearRecords: () => Promise<void>;
  refreshRecords: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

// DB row → frontend record
function fromDB(row: any): SalesRecord {
  return {
    azienda: row.azienda,
    aziendaNome: row.azienda_nome,
    anno: row.anno,
    mese: row.mese,
    codiceCliente: row.codice_cliente,
    nomeCliente: row.nome_cliente,
    agente: row.agente,
    marchio: row.marchio,
    articolo: row.articolo,
    imponibile: Number(row.imponibile),
    provvigione: Number(row.provvigione),
  };
}

// Frontend record → DB insert
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
  };
}

// Fetch all records with pagination (Supabase max 1000 per query)
async function fetchAllRecords(): Promise<SalesRecord[]> {
  const PAGE_SIZE = 1000;
  const all: SalesRecord[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("sales_records")
      .select("*")
      .range(from, from + PAGE_SIZE - 1)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (data) {
      all.push(...data.map(fromDB));
      hasMore = data.length === PAGE_SIZE;
      from += PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }
  return all;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRecords = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchAllRecords();
      setRecords(data);
    } catch (err) {
      console.error("Error loading records:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  const addRecords = useCallback(async (newRecords: SalesRecord[]) => {
    if (!user) throw new Error("Not authenticated");

    // Deduplicate against existing records
    const recordKey = (r: SalesRecord) =>
      `${r.azienda}|${r.anno}|${r.mese}|${r.codiceCliente}|${r.articolo}|${r.imponibile}`;
    const existingKeys = new Set(records.map(recordKey));
    const unique = newRecords.filter((r) => !existingKeys.has(recordKey(r)));
    const duplicates = newRecords.length - unique.length;

    if (unique.length === 0) {
      return { added: 0, duplicates };
    }

    // Batch insert in chunks of 500
    const CHUNK_SIZE = 500;
    for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
      const chunk = unique.slice(i, i + CHUNK_SIZE).map((r) => toDB(r, user.id));
      const { error } = await supabase.from("sales_records").insert(chunk);
      if (error) throw error;
    }

    await refreshRecords();
    return { added: unique.length, duplicates };
  }, [user, records, refreshRecords]);

  const clearRecords = useCallback(async () => {
    const { error } = await supabase.from("sales_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
    setRecords([]);
  }, []);

  return (
    <DataContext.Provider value={{ records, loading, addRecords, clearRecords, refreshRecords }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
