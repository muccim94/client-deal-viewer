import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { SalesRecord } from "@/types/data";
import { loadData, saveData, clearData } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";

interface DataContextType {
  records: SalesRecord[];
  loading: boolean;
  addRecords: (records: SalesRecord[]) => Promise<number>;
  deleteAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setRecords([]); return; }
    setLoading(true);
    try {
      const data = await loadData();
      setRecords(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addRecords = async (newRecords: SalesRecord[]): Promise<number> => {
    if (!user) throw new Error("Non autenticato");
    const count = await saveData(newRecords, user.id);
    await refresh();
    return count;
  };

  const deleteAll = async () => {
    if (!user) throw new Error("Non autenticato");
    await clearData();
    setRecords([]);
  };

  return (
    <DataContext.Provider value={{ records, loading, addRecords, deleteAll, refresh }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
