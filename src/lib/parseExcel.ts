import * as XLSX from "xlsx";
import { SalesRecord } from "@/types/data";

export function parseExcelFile(file: File): Promise<SalesRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const records: SalesRecord[] = json.map((row) => {
          const keys = Object.keys(row);
          return {
            cliente: String(row[keys[0]] ?? ""),
            prodotto: String(row[keys[1]] ?? ""),
            importo: Number(row[keys[2]] ?? 0),
          };
        });

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Errore nella lettura del file"));
    reader.readAsArrayBuffer(file);
  });
}
