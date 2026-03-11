

## Modifiche alla Dashboard Marchi

### 1. Grafico area — linea anno corrente termina all'ultimo mese con dati

Nel `chartData`, filtrare i punti dell'anno corrente (`current`) impostando a `null` i mesi senza dati caricati. Recharts non disegna la linea oltre i punti `null`. Si usa il `v_max_month` già calcolato dall'RPC: i `monthly_totals` restituiti contengono solo mesi con dati per l'anno corrente, quindi basta impostare `current: null` per i mesi dove `fatt_current === 0` e il mese è > ultimo mese con dati. In alternativa, usare `connectNulls={false}` sulla serie `current`.

Approccio concreto: nel `useMemo` di `chartData`, per ogni mese controllare se `fatt_current > 0`; se no, impostare `current` a `undefined` (recharts non disegnerà quel punto). La serie `prev` resta completa per tutti i 12 mesi.

### 2. Aggiunta 4 KPI Cards sotto il grafico fatturato

Dopo la card "Totale Fatturato", aggiungere una griglia `grid-cols-2 md:grid-cols-4` con 4 card KPI nell'ordine richiesto:

1. **Fatturato Materiale Elettrico** — `kpi.mat_elettrico`
2. **Fatturato Cavo** — `kpi.cavo`
3. **Fatturato Fotovoltaico** — `kpi.fotovoltaico`
4. **Ricambi** — `kpi.ricambi`

Ogni card mostra il valore formattato con `fmtCompact` e un'icona appropriata (Zap, Cable, Sun, Wrench da lucide-react).

### File coinvolti
- `src/pages/Marchi.tsx` — modifica chartData + aggiunta sezione KPI

### Nessuna modifica al database

