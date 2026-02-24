

## Modifiche alla tabella Marchi

### 1. Riordino colonne

L'ordine attuale: Marchio | 2026 | Progr. 2025 | Totale 2025 | Var. %

Nuovo ordine: **Marchio | 2026 | Progr. 2025 | Var. % | Totale 2025**

La colonna "Totale 2025" viene spostata all'ultimo posto.

### 2. Calcolo Var. % basato sul progressivo

Attualmente il delta viene calcolato come differenza percentuale tra fatturato corrente e **totale** anno precedente. Verra' modificato per confrontare il fatturato corrente con il **progressivo** dell'anno precedente (stesso periodo YTD), per un confronto piu' equo.

Formula: `((corrente - progressivo) / |progressivo|) * 100`

### Dettagli tecnici

| File | Modifica |
|---|---|
| `src/pages/ClienteMarchi.tsx` | Riga 69: cambiare `delta: pct(v.corrente, v.precedente)` in `delta: pct(v.corrente, v.progressivo)`; righe 127-161: riordinare colonne spostando "Totale anno prec." dopo "Var. %" sia in thead, tbody che tfoot; aggiornare anche il totale footer da `pct(totCorr, totPrec)` a `pct(totCorr, totProg)` |

### Layout finale

```text
Marchio | 2026      | Progr. 2025 | Var. %  | Totale 2025
LEG     | € 2.500   | € 1.800    | +38.9%  | € 3.200
BEG     | € 900     | € 600      | +50.0%  | € 1.100
```

