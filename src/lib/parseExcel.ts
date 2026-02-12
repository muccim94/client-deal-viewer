import * as XLSX from "xlsx";
import { SalesRecord, getAziendaNome } from "@/types/data";

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
          const azienda = String(row["Azienda"] ?? "").trim();
          const anno = Number(row["Anno"] ?? 0);
          const mese = Number(row["Mese"] ?? 0);

          // Cliente: "FO_076654 - NEW TRADE SRL"
          const clienteRaw = String(row["Cliente"] ?? "");
          const dashIdx = clienteRaw.indexOf(" - ");
          const codiceRaw = dashIdx >= 0 ? clienteRaw.substring(0, dashIdx).trim() : clienteRaw.trim();
          const nomeCliente = dashIdx >= 0 ? clienteRaw.substring(dashIdx + 3).trim() : "";
          // Rimuovi prefisso azienda (es. "FO_")
          const codiceCliente = codiceRaw.includes("_")
            ? codiceRaw.substring(codiceRaw.indexOf("_") + 1)
            : codiceRaw;

          const agente = String(row["Agente"] ?? "").trim();

          // Articolo: "FO_VIWAB1234" -> rimuovi primi 3 char ("FO_"), poi primi 3 = marchio
          const articoloRaw = String(row["Articolo"] ?? "").trim();
          const articoloSenzaPrefisso = articoloRaw.length > 3 ? articoloRaw.substring(3) : articoloRaw;
          const marchio = articoloSenzaPrefisso.substring(0, 3);

          const imponibile = Number(row["Imponibile"] ?? 0);
          const provvigione = Number(row["ProvvigioneValore"] ?? 0);
          const fatturaRiga = String(row["Fattura_Riga"] ?? "").trim();

          return {
            azienda,
            aziendaNome: getAziendaNome(azienda),
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
