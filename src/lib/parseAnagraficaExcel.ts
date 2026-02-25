import * as XLSX from "xlsx";

export interface AnagraficaRecord {
  nome_cliente: string;
  partita_iva?: string;
  indirizzo?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
}

const COLUMN_ALIASES: Record<keyof Omit<AnagraficaRecord, "nome_cliente">, string[]> = {
  partita_iva: ["partita iva", "p.iva", "p. iva", "piva"],
  indirizzo: ["indirizzo", "sede"],
  provincia: ["provincia", "prov"],
  telefono: ["telefono", "tel", "phone"],
  email: ["email", "e-mail", "mail"],
};

const NAME_ALIASES = ["nome cliente", "ragione sociale", "cliente", "nome"];

function findColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseAnagraficaExcel(file: File): Promise<AnagraficaRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (rows.length < 2) {
          reject(new Error("Il file è vuoto o non contiene dati"));
          return;
        }

        const headers = rows[0].map(String);
        const nameCol = findColumn(headers, NAME_ALIASES);
        if (nameCol === -1) {
          reject(new Error('Colonna "Nome Cliente" non trovata. Controlla le intestazioni del file.'));
          return;
        }

        const colMap: Record<string, number> = {};
        for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
          const idx = findColumn(headers, aliases);
          if (idx !== -1) colMap[field] = idx;
        }

        const results: AnagraficaRecord[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const nome = String(row[nameCol] ?? "").trim();
          if (!nome) continue;

          const record: AnagraficaRecord = { nome_cliente: nome };
          for (const [field, idx] of Object.entries(colMap)) {
            const val = String(row[idx] ?? "").trim();
            if (val) (record as any)[field] = val;
          }
          results.push(record);
        }

        resolve(results);
      } catch {
        reject(new Error("Errore nella lettura del file Excel"));
      }
    };
    reader.onerror = () => reject(new Error("Errore nella lettura del file"));
    reader.readAsArrayBuffer(file);
  });
}
