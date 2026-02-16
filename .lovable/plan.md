## Ottimizzazione Responsiva Tabella Anagrafiche

### Obiettivo

Rendere la tabella perfettamente adattiva su 3 breakpoint: desktop, tablet e mobile, senza sbordare mai dallo schermo.

### Modifiche previste su `src/pages/Anagrafiche.tsx`

**Breakpoint Tablet (sm: 640px - md: 768px):**

- Ridurre il font del nome cliente: `text-xs sm:text-sm md:text-lg`
- Nascondere la colonna "Fatt. 2025 YTD" su tablet: cambiare da `hidden sm:table-cell` a `hidden md:table-cell`
- Mantenere visibili: Codice, Trend, Nome, Fatt. anno corrente, Fatt. anno prec., freccia

**Breakpoint Mobile (sotto sm: 640px):**

- Nascondere:  Fatt. YTD, Fatt. anno prec. (gia fatto)
- Colorare l'importo del fatturato anno corrente in base al confronto YTD:
  - Verde (`text-green-600`) se `fattCurrentYear >= fattPrevYearYTD`
  - Rosso (`text-red-600`) se `fattCurrentYear < fattPrevYearYTD`
- Su desktop/tablet l'importo rimane con il colore standard (il colore e gia indicato dal trend icon)
- Ridurre padding celle: `px-1 sm:px-2 md:px-4`
- Nome cliente: `max-w-[120px] sm:max-w-[150px] md:max-w-none`

### Dettagli tecnici

**Colonna Fatt. anno corrente -- colore condizionale su mobile:**

```tsx
<TableCell className="font-medium text-right tabular-nums text-xs sm:text-sm md:text-base px-1 sm:px-2 md:px-4">
  <span className={`sm:text-foreground ${
    r.fattCurrentYear >= r.fattPrevYearYTD ? 'text-green-600' : 'text-red-600'
  }`}>
    {fmt(r.fattCurrentYear)}
  </span>
</TableCell>
```

**Colonna Fatt. prevYear YTD -- visibile solo da md in su:**

- TableHead e TableCell: da `hidden sm:table-cell` a `hidden md:table-cell`

**Nome cliente -- font progressivo:**

- Link class: `text-xs sm:text-sm md:text-lg max-w-[120px] sm:max-w-[150px] md:max-w-none truncate`

**Padding celle generali:**

- Tutte le TableCell visibili su mobile: `px-1 sm:px-2 md:px-4`

**File modificato:** solo `src/pages/Anagrafiche.tsx`
**Nessuna migrazione SQL necessaria.**