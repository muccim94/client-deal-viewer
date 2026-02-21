

## Fix duplicati importazione Riepilogo: usare "Linea Fascia" come chiave

### Problema

Il file Excel contiene piu' righe per lo stesso cliente con la stessa "Linea" ma diversa "Linea Fascia". Esempio:

| Cliente | Linea | Linea Fascia | Fatturato |
|---|---|---|---|
| ELETTRO 2000 | FO_FV. | FO_FV.35 (ZCS) | 0 |
| ELETTRO 2000 | FO_FV. | FO_FV.24 (SUNBALLAST) | 0 |
| ELETTRO 2000 | FO_FV. | FO_FV.36 (TRINA) | 0 |

Attualmente il parser usa "Linea" come marchio, quindi tutte e tre le righe generano la stessa `fattura_riga` = `RIEP_FO_2025_1_0011501_FV.` e solo una viene salvata.

### Soluzione

Usare la colonna **"Linea Fascia"** al posto di "Linea" per estrarre il marchio e generare la chiave di deduplicazione univoca.

- `FO_FV.36` diventa marchio `FV.36`
- `FO_CV.47` diventa marchio `CV.47`
- `FO_CSM03` diventa marchio `CSM03`

Questo rende ogni riga univoca nella `fattura_riga`: `RIEP_FO_2025_1_0011501_FV.36`

### Modifica tecnica

#### File: `src/lib/parseExcel.ts` - funzione `parseAsRiepilogo`

Cambiare l'estrazione del marchio da "Linea" a "Linea Fascia":

```
// PRIMA (causa duplicati):
const lineaRaw = String(row["Linea"] ?? "").trim();

// DOPO (usa Linea Fascia per univocita'):
const lineaRaw = String(row["Linea Fascia"] ?? row["Linea"] ?? "").trim();
```

La logica di rimozione prefisso (`FO_`) rimane identica. Il fallback su "Linea" garantisce compatibilita' nel caso il campo "Linea Fascia" non sia presente.

Anche il campo `articolo` viene impostato uguale al nuovo marchio derivato da "Linea Fascia".

### Riepilogo

| File | Modifica |
|---|---|
| `src/lib/parseExcel.ts` | Usare "Linea Fascia" invece di "Linea" in `parseAsRiepilogo` |

Nessuna modifica al database. La chiave di deduplicazione `fattura_riga` diventa automaticamente piu' granulare.

