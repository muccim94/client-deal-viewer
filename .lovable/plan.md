

## Modifica card "Risorsa Utilizzata" — percentuale a destra in rosso

### Cosa cambia
- Il valore principale (es. `-23k`) resta allineato a sinistra come tutte le altre card
- La percentuale di incidenza (es. `0,89% del fatturato`) si sposta a **destra** nella stessa riga del valore, in **rosso grassetto**

### Dettaglio tecnico

**File: `src/pages/Marchi.tsx` (righe 389-393)**

Sostituire il layout attuale del `CardContent` con un layout flex che:
1. Mette il valore a sinistra e la percentuale a destra sulla stessa riga
2. Applica `text-red-500 font-bold` alla percentuale
3. Rimuove il `<p>` separato del subtitle attuale

```tsx
<CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 mt-auto">
  <div className="flex items-end justify-between">
    <span className="text-lg sm:text-2xl font-bold">{fmtCompact(kpi.value)}</span>
    {'subtitle' in kpi && kpi.subtitle && (
      <span className="text-[10px] sm:text-xs font-bold text-red-500">{kpi.subtitle}</span>
    )}
  </div>
</CardContent>
```

Nessuna modifica ad altri file.

