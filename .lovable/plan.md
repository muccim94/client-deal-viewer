## Card Riepilogativa Unica per Anagrafica Cliente

### Obiettivo

Sostituire le 4 card KPI separate (una per azienda per anno) con un'unica card riepilogativa che mostra:

- **Dato principale**: Fatturato 2026 (anno corrente) in grande
- **Comparazione**: Fatturato 2025 YTD affiancato, con freccia verde (TrendingUp) se il 2026 e' superiore, rossa (TrendingDown) se inferiore
- **Dato secondario**: Fatturato 2025 totale in dimensione piu' piccola

### Modifiche su `src/pages/ClienteDettaglio.tsx`

**Sostituzione della sezione KPI Cards (righe 130-155)**

Rimuovere il blocco attuale con la griglia `grid-cols-2 lg:grid-cols-4` contenente le 4 card separate e sostituirlo con una singola `<Card>` strutturata cosi':

```text
+--------------------------------------------------+
|  Fatturato 2026                                   |
|  EUR 125.430,00                    (grande, bold) |
|                                                   |
|  vs 2025 YTD: EUR 110.200,00   [freccia su/giu]  |
|  Fatt. 2025: EUR 180.500,00       (piccolo, gray) |
+--------------------------------------------------+
```

**Logica di calcolo:**

- `fattCorrente`: somma imponibile di tutti i record con `anno === annoCorrente`
- `fattPrecYTD`: somma imponibile dei record con `anno === annoPrecedente` e `mese <= meseCorrente` (dove meseCorrente = mese attuale del calendario)
- `fattPrecTotale`: somma imponibile di tutti i record con `anno === annoPrecedente`
- La freccia si basa sul confronto `fattCorrente` vs `fattPrecYTD`

**Struttura della card:**

- CardHeader: titolo "Riepilogo Fatturato"
- CardContent:
  - Riga 1: label "Fatturato {annoCorrente}" + valore grande (`text-2xl md:text-3xl font-bold`)
  - Riga 2: "vs {annoPrecedente} YTD: {valore}" + icona TrendingUp/TrendingDown + percentuale delta
  - Riga 3: "Fatt. {annoPrecedente}: {valore}" in `text-sm text-muted-foreground`

### Dettagli tecnici

Il calcolo dei totali viene fatto con un `useMemo` che aggrega tutti i record indipendentemente dall'azienda:

```tsx
const { fattCorrente, fattPrecYTD, fattPrecTotale } = useMemo(() => {
  const meseCorrente = new Date().getMonth() + 1;
  let fattCorrente = 0, fattPrecYTD = 0, fattPrecTotale = 0;
  clientRecords.forEach((r) => {
    if (r.anno === annoCorrente) fattCorrente += r.imponibile;
    if (r.anno === annoPrecedente) {
      fattPrecTotale += r.imponibile;
      if (r.mese <= meseCorrente) fattPrecYTD += r.imponibile;
    }
  });
  return { fattCorrente, fattPrecYTD, fattPrecTotale };
}, [clientRecords, annoCorrente, annoPrecedente]);
```

La card unica:

```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-base">Riepilogo Fatturato</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    <div>
      <p className="text-xs text-muted-foreground">Fatturato {annoCorrente}</p>
      <p className="text-2xl md:text-3xl font-bold">{fmt(fattCorrente)}</p>
    </div>
    <div className="flex items-center gap-2">
      {fattCorrente >= fattPrecYTD
        ? <TrendingUp className="h-4 w-4 text-emerald-500" />
        : <TrendingDown className="h-4 w-4 text-red-500" />}
      <span className="text-sm">
        vs {annoPrecedente} YTD: {fmt(fattPrecYTD)}
      </span>
      <span className={`text-sm font-medium ${
        fattCorrente >= fattPrecYTD ? 'text-emerald-600' : 'text-red-600'
      }`}>
        ({pct(fattCorrente, fattPrecYTD).toFixed(1)}%)
      </span>
    </div>
    <p className="text-sm text-muted-foreground">
      Fatt. {annoPrecedente}: {fmt(fattPrecTotale)}
    </p>
  </CardContent>
</Card>
```

**File modificato:** solo `src/pages/ClienteDettaglio.tsx`
**Nessuna migrazione SQL necessaria.**