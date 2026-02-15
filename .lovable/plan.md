

## Modifiche al Dettaglio Cliente

### 1. Grafico a colonne su desktop, torta su mobile

Il grafico "Fatturato per Marchio" diventa responsive:

- **Mobile** (< 768px): resta il grafico a torta attuale (donut)
- **Desktop** (>= 768px): viene mostrato un grafico a colonne raggruppate (BarChart di Recharts) con due barre per ogni marchio -- una per l'anno precedente e una per l'anno corrente

Si usa l'hook `useIsMobile()` gia presente nel progetto per il rendering condizionale. I dati `pieData` vengono estesi per includere sia il valore anno corrente che anno precedente per ogni marchio (necessario per il BarChart).

### 2. Inversione ordine anni nelle tabelle

In tutte le tabelle mensili sottostanti, l'ordine delle colonne viene invertito:

- Prima colonna dati: **Anno corrente** (invece di anno precedente)
- Seconda colonna dati: **Anno precedente** (invece di anno corrente)
- Il titolo della card diventa "{annoCorrente} vs {annoPrecedente}"
- Il delta % continua a calcolare la variazione dell'anno corrente rispetto al precedente

### Dettagli tecnici

**File da modificare:** `src/pages/ClienteDettaglio.tsx`

- Importare `useIsMobile` da `@/hooks/use-mobile`
- Importare `BarChart, Bar, XAxis, YAxis, CartesianGrid` da Recharts
- Creare `barData` con struttura `{ name, corrente, precedente }` per ogni marchio (top 8 + Altri)
- Rendering condizionale: `isMobile ? <PieChart>` : `<BarChart>` dentro la stessa Card cliccabile
- Nelle tabelle: scambiare le colonne `{annoPrecedente}` e `{annoCorrente}` nell'header e nel body (corrente prima, precedente dopo)
