

## Aggiunta pallino endpoint e linea budget al grafico Dashboard

### Modifiche a `src/pages/Dashboard.tsx`

1. **Importare `ComposedChart`, `Line`** da recharts al posto di `AreaChart` (ComposedChart supporta Area + Line insieme)

2. **Aggiungere query budget**: Fetch `get_budget_data` con anno 2026 e agente filtrato, per ottenere i 12 importi mensili di budget

3. **Aggiornare `chartData`**: Aggiungere campo `budget` a ogni mese dal risultato di `get_budget_data`

4. **Sostituire `AreaChart` con `ComposedChart`**: Contiene le stesse 2 `Area` (current + prev) più una nuova `Line` per il budget con colore arancione (`hsl(35, 85%, 55%)`), tratteggio diverso

5. **Pallino endpoint**: Aggiungere `dot` custom alla serie `current` — un renderizzatore che mostra il pallino solo sull'ultimo punto con dati (il mese = `lastMonthWithData`)

```tsx
// Custom dot: only render on last data point
const renderEndDot = (props: any) => {
  const { cx, cy, index, payload } = props;
  if (payload.current !== undefined && chartData[index + 1]?.current === undefined) {
    return <circle cx={cx} cy={cy} r={5} fill="hsl(160, 60%, 45%)" stroke="white" strokeWidth={2} />;
  }
  return null;
};
```

6. **Legenda aggiornata**: 3 voci — "Anno Corrente", "Anno Prec.", "Budget"

### Nessuna modifica al database
I dati del budget sono già disponibili tramite la RPC `get_budget_data` esistente. La query verrà filtrata per l'agente selezionato e l'anno selezionato dal filtro.

### File coinvolti
- `src/pages/Dashboard.tsx` — unico file modificato

