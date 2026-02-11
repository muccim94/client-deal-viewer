export interface SalesRecord {
  azienda: string;       // "FO" o "FU"
  aziendaNome: string;   // "Fogliani" o "Futurtec"
  anno: number;
  mese: number;
  codiceCliente: string; // solo parte numerica es. "076654"
  nomeCliente: string;   // es. "NEW TRADE SRL"
  agente: string;        // es. "FO_FO77"
  marchio: string;       // primi 3 char dopo prefisso azienda es. "VIW", "BEG", "CV."
  articolo: string;      // codice articolo completo senza prefisso azienda
  imponibile: number;
}

const AZIENDA_MAP: Record<string, string> = {
  FO: "Fogliani",
  FU: "Futurtec",
};

export function getAziendaNome(codice: string): string {
  return AZIENDA_MAP[codice] ?? codice;
}

const MESI = [
  "", "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

export function getMeseNome(mese: number): string {
  return MESI[mese] ?? String(mese);
}
