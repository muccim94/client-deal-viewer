import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SalesRecord } from "@/types/data";
import { loadData, saveData } from "@/lib/store";

interface DataContextType {
  records: SalesRecord[];
  setRecords: (records: SalesRecord[]) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [records, setRecordsState] = useState<SalesRecord[]>([]);

  useEffect(() => {
    setRecordsState(loadData());
  }, []);

  const setRecords = (newRecords: SalesRecord[]) => {
    setRecordsState(newRecords);
    saveData(newRecords);
  };

  return (
    <DataContext.Provider value={{ records, setRecords }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
