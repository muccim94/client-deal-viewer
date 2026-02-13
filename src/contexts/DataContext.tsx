import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { SalesRecord } from "@/types/data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DataContextType {
  records: SalesRecord[];
  loading: boolean;
  totalCount: number;
  loadedCount: number;
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
    fatturaRiga: row.fattura_riga ?? "",
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
    fattura_riga: r.fatturaRiga,
  };
}

const COLUMNS = "azienda,azienda_nome,anno,mese,codice_cliente,nome_cliente,agente,marchio,articolo,imponibile,provvigione,fattura_riga";
const PAGE_SIZE = 1000;

// Fetch all records with controlled concurrency
const CONCURRENCY = 5;

async function fetchAllRecords(onChunk?: (records: SalesRecord[]) => void): Promise<SalesRecord[]> {
  // First get total count
  const { count, error: countError } = await supabase
    .from("sales_records")
    .select("*", { count: "exact", head: true });

  if (countError) throw countError;
  if (!count || count === 0) return [];

  const totalPages = Math.ceil(count / PAGE_SIZE);
  const all: SalesRecord[] = [];

  // Fetch pages in batches of CONCURRENCY to avoid DB timeout
  for (let batch = 0; batch < totalPages; batch += CONCURRENCY) {
    const batchEnd = Math.min(batch + CONCURRENCY, totalPages);
    const promises = Array.from({ length: batchEnd - batch }, (_, j) => {
      const i = batch + j;
      const from = i * PAGE_SIZE;
      return supabase
        .from("sales_records")
        .select(COLUMNS)
        .range(from, from + PAGE_SIZE - 1)
        .then(({ data, error }) => {
          if (error) throw error;
          const mapped = (data ?? []).map(fromDB);
          if (onChunk) onChunk(mapped);
          return mapped;
        });
    });

    const results = await Promise.all(promises);
    for (const chunk of results) all.push(...chunk);
  }

  return all;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);

  const refreshRecords = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setRecords([]);
      setLoadedCount(0);
      setTotalCount(0);

      // Get count first
      const { count, error: countError } = await supabase
        .from("sales_records")
        .select("*", { count: "exact", head: true });
      if (countError) throw countError;
      const total = count ?? 0;
      setTotalCount(total);

      if (total === 0) {
        return;
      }

      let loaded = 0;
      await fetchAllRecords((chunk) => {
        loaded += chunk.length;
        setLoadedCount(loaded);
        setRecords((prev) => [...prev, ...chunk]);
      });
    } catch (err) {
      console.error("Error loading records:", err);
    } finally {
      setLoading(false);
      // Brief delay so user sees 100% before hiding
      setTimeout(() => {
        setTotalCount(0);
        setLoadedCount(0);
      }, 500);
    }
  }, [user]);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  const addRecords = useCallback(async (newRecords: SalesRecord[]) => {
    if (!user) throw new Error("Not authenticated");

    // Deduplicate against existing records
    const recordKey = (r: SalesRecord) =>
      `${r.azienda}|${r.anno}|${r.mese}|${r.codiceCliente}|${r.articolo}|${r.fatturaRiga}`;
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
      const { error } = await supabase.from("sales_records").upsert(chunk, { onConflict: "user_id,azienda,anno,mese,codice_cliente,articolo,fattura_riga", ignoreDuplicates: true });
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
    <DataContext.Provider value={{ records, loading, totalCount, loadedCount, addRecords, clearRecords, refreshRecords }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
