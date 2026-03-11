## Aggiunta % vs Budget e % YoY nella card Totale Fatturato

### Cosa cambia

Nella card "Totale Fatturato" della Dashboard, nell'angolo in alto a destra dove attualmente c'è la percentuale, mostrare due righe di confronto percentuale:

1. **% vs Budget** — somma del fatturato YTD diviso somma del budget YTD (solo mesi con dati), con badge colorato
2. **% vs Anno Prec.** — la variazione YoY già esistente, spostata sotto come seconda riga

### Modifiche a `src/pages/Dashboard.tsx`

1. **Calcolare il totale budget YTD**: dalla `budgetData` già fetchata, sommare i `budget` dei mesi fino a `lastMonthWithData` e calcolare `(fatturato / budgetYtd - 1) * 100`
2. **Riorganizzare il CardHeader**: mostrare l'importo grande, poi due righe con badge:
  - Riga 1: Badge con `% vs Budget` + testo "vs €X budget prog."
  - Riga 2: Badge con `% YoY` + testo "vs €X prog. anno prec." (quello attuale)

### Logica di calcolo

```tsx
const lastMonthWithData = Math.max(0, ...stats.monthlyTotals.filter(m => m.fatt_current > 0).map(m => m.mese));

const budgetYtd = budgetData
  ?.filter(b => b.mese <= lastMonthWithData)
  .reduce((sum, b) => sum + b.budget, 0) ?? 0;

const varBudgetPercent = budgetYtd > 0
  ? ((stats.totale - budgetYtd) / budgetYtd) * 100
  : 0;
```

### File coinvolti

- `src/pages/Dashboard.tsx` — unico file, solo modifica al blocco CardHeader della card fatturato