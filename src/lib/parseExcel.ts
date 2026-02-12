import * as XLSX from "xlsx";
import { z } from "zod";
import { SalesRecord, getAziendaNome } from "@/types/data";

const MAX_STRING_LENGTH = 500;
const REQUIRED_COLUMNS = ["Azienda", "Anno", "Mese", "Cliente", "Agente", "Articolo", "Imponibile"];

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

        // Validate required columns on first row
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
            azienda,
            anno,
            mese,
            codiceCliente,
            nomeCliente,
            agente,
            marchio,
            articolo: articoloSenzaPrefisso,
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

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Errore nella lettura del file"));
    reader.readAsArrayBuffer(file);
  });
}
