import * as XLSX from "xlsx";
import { z } from "zod";
import { SalesRecord, getAziendaNome } from "@/types/data";

const MAX_STRING_LENGTH = 500;
const REQUIRED_COLUMNS = ["Azienda", "Anno", "Mese", "Cliente", "Agente", "Articolo", "Imponibile"];

const AZIENDA_REVERSE: Record<string, string> = {
  fogliani: "FO",
  futurtec: "FU",
};

const MESE_TEXT_MAP: Record<string, number> = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
};

const salesRowSchema = z.object({
  azienda: z.string().max(MAX_STRING_LENGTH),
  anno: z.number().int().min(2000).max(2100),
  mese: z.number().int().min(1).max(12),
  codiceCliente: z.string().max(MAX_STRING_LENGTH),
  nomeCliente: z.string().max(MAX_STRING_LENGTH),
  agente: z.string().max(MAX_STRING_LENGTH),
  marchio: z.string().max(MAX_STRING_LENGTH),
  articolo: z.string().max(MAX_STRING_LENGTH),
  imponibile: z.number().finite(),
  provvigione: z.number().finite(),
  fatturaRiga: z.string().max(MAX_STRING_LENGTH),
});

function validateRequiredColumns(row: Record<string, unknown>): void {
  const missing = REQUIRED_COLUMNS.filter((col) => !(col in row));
  if (missing.length > 0) {
    throw new Error(`Colonne mancanti nel file Excel: ${missing.join(", ")}`);
  }
}

function isRiepilogoFormat(row: Record<string, unknown>): boolean {
  return "Linea" in row && "Agente (Anagrafico)" in row;
}

function parseFatturato(value: unknown): number {
  if (typeof value === "number") return value;
  const str = String(value).replace(/€/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function findFatturatoColumn(row: Record<string, unknown>): string | null {
  const keys = Object.keys(row);
  // Search for column starting with "Fatturato" (handles any year suffix)
  const match = keys.find((k) => k.toLowerCase().startsWith("fatturato"));
  return match ?? null;
}

function parseAsRiepilogo(json: Record<string, unknown>[]): SalesRecord[] {
  const errors: string[] = [];
  const records: SalesRecord[] = [];

  // Detect fatturato column name dynamically from the first row
  const fatturatoCol = findFatturatoColumn(json[0]);
  if (!fatturatoCol) {
    throw new Error("Colonna 'Fatturato' non trovata nel file Riepilogo");
  }

  for (let i = 0; i < json.length; i++) {
    const row = json[i];

    const aziendaRaw = String(row["AZIENDA"] ?? row["Azienda"] ?? row["azienda"] ?? "").toLowerCase().trim();
    const azienda = AZIENDA_REVERSE[aziendaRaw] ?? aziendaRaw.substring(0, 2).toUpperCase();

    const annoRaw = row["ANNO"] ?? row["Anno"] ?? row["anno"] ?? 0;
    const anno = Number(annoRaw);

    const meseRaw = String(row["MESE"] ?? row["Mese"] ?? row["mese"] ?? "").toLowerCase().trim();
    const mese = MESE_TEXT_MAP[meseRaw] ?? (Number(meseRaw) >= 1 && Number(meseRaw) <= 12 ? Number(meseRaw) : 0);

    const agenteRaw = String(row["Agente (Anagrafico)"] ?? row["Agente"] ?? "").trim();
    const agente = agenteRaw.split(" ")[0];

    const clienteRaw = String(row["Cliente"] ?? row["cliente"] ?? "");
    const dashIdx = clienteRaw.indexOf(" - ");
    const codiceRaw = dashIdx >= 0 ? clienteRaw.substring(0, dashIdx).trim() : clienteRaw.trim();
    const nomeCliente = dashIdx >= 0 ? clienteRaw.substring(dashIdx + 3).trim() : "";
    const codiceCliente = codiceRaw.includes("_")
      ? codiceRaw.substring(codiceRaw.indexOf("_") + 1)
      : codiceRaw;

    const lineaRaw = String(row["Linea"] ?? row["linea"] ?? "").trim();
    const marchio = lineaRaw.includes("_")
      ? lineaRaw.substring(lineaRaw.indexOf("_") + 1)
      : lineaRaw;

    const imponibile = parseFatturato(row[fatturatoCol]);
    const provvigione = imponibile > 0 ? Math.round(imponibile * 0.035 * 100) / 100 : 0;
    const fatturaRiga = `RIEP_${azienda}_${anno}_${mese}_${codiceCliente}_${marchio}_${agente}_${i}`;

    const parsed = {
      azienda,
      anno,
      mese,
      codiceCliente,
      nomeCliente,
      agente,
      marchio,
      articolo: marchio,
      imponibile,
      provvigione,
      fatturaRiga,
    };

    const result = salesRowSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      errors.push(`Riga ${i + 2}: ${issues}`);
      if (errors.length >= 10) {
        throw new Error(`Troppi errori di validazione:\n${errors.join("\n")}`);
      }
      continue;
    }

    const validated = result.data;
    records.push({
      azienda: validated.azienda,
      aziendaNome: getAziendaNome(validated.azienda),
      anno: validated.anno,
      mese: validated.mese,
      codiceCliente: validated.codiceCliente,
      nomeCliente: validated.nomeCliente,
      agente: validated.agente,
      marchio: validated.marchio,
      articolo: validated.articolo,
      imponibile: validated.imponibile,
      provvigione: validated.provvigione,
      fatturaRiga: validated.fatturaRiga,
    });
  }

  if (errors.length > 0 && records.length === 0) {
    throw new Error(`Nessun record valido trovato:\n${errors.join("\n")}`);
  }
  if (errors.length > 0) {
    console.warn(`${errors.length} righe ignorate per errori di validazione`);
  }

  return records;
}

function parseAsStandard(json: Record<string, unknown>[]): SalesRecord[] {
  validateRequiredColumns(json[0]);

  const errors: string[] = [];
  const records: SalesRecord[] = [];

  for (let i = 0; i < json.length; i++) {
    const row = json[i];
    const azienda = String(row["Azienda"] ?? "").trim();
    const anno = Number(row["Anno"] ?? 0);
    const mese = Number(row["Mese"] ?? 0);

    const clienteRaw = String(row["Cliente"] ?? "");
    const dashIdx = clienteRaw.indexOf(" - ");
    const codiceRaw = dashIdx >= 0 ? clienteRaw.substring(0, dashIdx).trim() : clienteRaw.trim();
    const nomeCliente = dashIdx >= 0 ? clienteRaw.substring(dashIdx + 3).trim() : "";
    const codiceCliente = codiceRaw.includes("_")
      ? codiceRaw.substring(codiceRaw.indexOf("_") + 1)
      : codiceRaw;

    const agente = String(row["Agente"] ?? "").trim();

    const articoloRaw = String(row["Articolo"] ?? "").trim();
    const articoloSenzaPrefisso = articoloRaw.length > 3 ? articoloRaw.substring(3) : articoloRaw;
    const marchio = articoloSenzaPrefisso.substring(0, 3);

    const imponibile = Number(row["Imponibile"] ?? 0);
    const provvigione = Number(row["ProvvigioneValore"] ?? 0);
    const fatturaRiga = String(row["Fattura_Riga"] ?? "").trim();

    const parsed = {
      azienda, anno, mese, codiceCliente, nomeCliente, agente, marchio,
      articolo: articoloSenzaPrefisso, imponibile, provvigione, fatturaRiga,
    };

    const result = salesRowSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      errors.push(`Riga ${i + 2}: ${issues}`);
      if (errors.length >= 10) {
        throw new Error(`Troppi errori di validazione:\n${errors.join("\n")}`);
      }
      continue;
    }

    const validated = result.data;
    records.push({
      azienda: validated.azienda,
      aziendaNome: getAziendaNome(validated.azienda),
      anno: validated.anno,
      mese: validated.mese,
      codiceCliente: validated.codiceCliente,
      nomeCliente: validated.nomeCliente,
      agente: validated.agente,
      marchio: validated.marchio,
      articolo: validated.articolo,
      imponibile: validated.imponibile,
      provvigione: validated.provvigione,
      fatturaRiga: validated.fatturaRiga,
    });
  }

  if (errors.length > 0 && records.length === 0) {
    throw new Error(`Nessun record valido trovato:\n${errors.join("\n")}`);
  }
  if (errors.length > 0) {
    console.warn(`${errors.length} righe ignorate per errori di validazione`);
  }

  return records;
}

export function parseExcelFile(file: File): Promise<SalesRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (json.length === 0) {
          throw new Error("Il file Excel è vuoto o non contiene dati validi");
        }

        if (isRiepilogoFormat(json[0])) {
          resolve(parseAsRiepilogo(json));
        } else {
          resolve(parseAsStandard(json));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Errore nella lettura del file"));
    reader.readAsArrayBuffer(file);
  });
}
