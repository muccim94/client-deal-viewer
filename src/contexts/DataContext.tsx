import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SalesRecord } from "@/types/data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DataContextType {
  addRecords: (records: SalesRecord[]) => Promise<{ added: number; duplicates: number }>;
  clearRecords: () => Promise<void>;
  recordCount: number | null;
  refreshRecordCount: () => Promise<void>;
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

  return (
    <DataContext.Provider value={{ addRecords, clearRecords, recordCount, refreshRecordCount }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
