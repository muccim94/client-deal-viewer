import { SalesRecord } from "@/types/data";

const STORAGE_KEY = "sales_data";

export function saveData(records: SalesRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function loadData(): SalesRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SalesRecord[];
  } catch {
    return [];
  }
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY);
}
