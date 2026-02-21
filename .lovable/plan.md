## Supporto Nuovo Formato Excel (Riepilogo Fatturato per Linea)

### Problema

I dati di fatturato per gennaio-giugno 2025 sono in un formato Excel diverso da quello attuale. Le differenze principali sono:


| Campo          | Formato attuale                        | Nuovo formato                                   |
| -------------- | -------------------------------------- | ----------------------------------------------- |
| Azienda        | "FO" / "FU"                            | "fogliani" / "futurtec" (testo esteso)          |
| Mese           | numero (1-12)                          | testo ("gennaio", "febbraio"...)                |
| Agente         | "FO_FO77"                              | "FO_FO77 Michelangelo Mucci" (con nome)         |
| Cliente        | "FO_035826 - NOME"                     | Stesso formato                                  |
| Articolo/Linea | Colonna "Articolo" con codice completo | Colonna "Linea" (es. "FO_FV.")                  |
| Fatturato      | Colonna "Imponibile" (numero)          | Colonna "Fatturato + Bollettato 2025" (con "€") |
| Provvigione    | Presente                               | Assente (default 0)                             |
| Fattura_Riga   | Presente                               | Assente (va generata per dedup)                 |


### Soluzione

Creare una seconda funzione di parsing `parseRiepilogoExcel` che trasforma il nuovo formato nello stesso tipo `SalesRecord[]` gia' usato dal sistema. Il sistema di upload rileva automaticamente il formato del file in base alle colonne presenti.

### Mappatura campi

- **AZIENDA**: "fogliani" -> "FO", "futurtec" -> "FU"
- **MESE**: "gennaio" -> 1, "febbraio" -> 2, ecc.
- **Agente**: "FO_FO77 Michelangelo Mucci" -> prende solo "FO_FO77" (prima dello spazio)
- **Cliente**: "FO_C007918 - ELETTRICA 77..." -> codice "C007918", nome "ELETTRICA 77..."
- **Linea**: "FO_FV." -> marchio "FV." (rimuove prefisso "FO_")
- **Fatturato**: parsato come numero (rimuovendo "€" e gestendo separatori migliaia)
- **Articolo**: uguale al marchio (non c'e' dettaglio articolo in questo formato)
- **Provvigione**: si calcola un 3,5% sull'importo (esclusi tutti i dati negativi)
- **Fattura_Riga**: generata come `RIEP_{azienda}_{anno}_{mese}_{codice}_{marchio}` per deduplicazione

### Modifiche tecniche

#### 1. `src/lib/parseExcel.ts`

Aggiungere:

- Mappa `AZIENDA_REVERSE`: `{ "fogliani": "FO", "futurtec": "FU" }`
- Mappa `MESE_TEXT_MAP`: `{ "gennaio": 1, "febbraio": 2, ... "dicembre": 12 }`
- Costante `RIEPILOGO_COLUMNS` con le colonne attese: `["AZIENDA", "ANNO", "MESE", "Agente (Anagrafico)", "Cliente", "Linea", "Fatturato + Bollettato 2025"]`
- Funzione `detectFileFormat(row)`: controlla se la prima riga ha le colonne del formato riepilogo o del formato standard
- Funzione `parseRiepilogoRow(row)` -> `SalesRecord`: trasforma una riga del nuovo formato
- Funzione `parseRiepilogoExcel(file)` -> `Promise<SalesRecord[]>`: logica completa con validazione Zod

La funzione `parseExcelFile` esistente viene rinominata internamente ma l'export rimane compatibile. Si aggiunge un nuovo export `parseExcelFileAuto(file)` che rileva automaticamente il formato e chiama il parser corretto.

Oppure, piu' semplice: modificare `parseExcelFile` per fare auto-detect:

```ts
export function parseExcelFile(file: File): Promise<SalesRecord[]> {
  // ... legge il workbook come prima ...
  // Controlla le colonne della prima riga
  if ("Linea" in json[0] && "Agente (Anagrafico)" in json[0]) {
    return parseAsRiepilogo(json);
  } else {
    return parseAsStandard(json);
  }
}
```

Logica di parsing per ogni riga del riepilogo:

```ts
// Azienda
const aziendaRaw = String(row["AZIENDA"]).toLowerCase().trim();
const azienda = AZIENDA_REVERSE[aziendaRaw] ?? aziendaRaw.substring(0,2).toUpperCase();

// Mese
const meseRaw = String(row["MESE"]).toLowerCase().trim();
const mese = MESE_TEXT_MAP[meseRaw] ?? 0;

// Agente: "FO_FO77 Michelangelo Mucci" -> "FO_FO77"
const agenteRaw = String(row["Agente (Anagrafico)"]).trim();
const agente = agenteRaw.split(" ")[0]; // "FO_FO77"

// Cliente: "FO_C007918 - NOME CLIENTE" -> codice + nome
// Stesso parsing del formato standard

// Linea: "FO_FV." -> "FV."
const lineaRaw = String(row["Linea"]).trim();
const marchio = lineaRaw.includes("_") 
  ? lineaRaw.substring(lineaRaw.indexOf("_") + 1) 
  : lineaRaw;

// Fatturato: "1,108 €" o numero puro
// XLSX potrebbe gia' restituire un numero; se stringa, rimuovere € e parsare

// Fattura_Riga per dedup
const fatturaRiga = `RIEP_${azienda}_${anno}_${mese}_${codiceCliente}_${marchio}`;
```

#### 2. `src/pages/UploadExcel.tsx`

Nessuna modifica necessaria: il componente chiama gia' `parseExcelFile(file)` e riceve `SalesRecord[]`. Il rilevamento automatico del formato e' trasparente.

### File modificati


| File                    | Operazione                                        |
| ----------------------- | ------------------------------------------------- |
| `src/lib/parseExcel.ts` | Aggiungere auto-detect formato + parser riepilogo |


Nessuna modifica al database, nessuna migrazione SQL. I record vengono inseriti nella stessa tabella `sales_records` con lo stesso upsert basato su `fattura_riga`.