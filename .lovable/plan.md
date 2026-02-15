

## Modifiche richieste

### 1. Top 10 Clienti con fatturato progressivo reale (YTD)

Attualmente i valori "Anno Prec." sono simulati con numeri casuali. Verranno sostituiti con dati reali calcolando il fatturato progressivo (YTD - Year To Date):

- Se oggi siamo a febbraio 2026, il fatturato corrente include solo gennaio e febbraio 2026
- Il fatturato precedente include solo gennaio e febbraio 2025
- In questo modo il confronto e sempre equo e proporzionato al periodo trascorso

**Migrazione SQL:** Aggiornamento della funzione `get_dashboard_stats` per modificare la CTE `top_clienti`. Verra calcolato l'anno corrente e il mese corrente automaticamente. Per ogni cliente nella Top 10:
- `value` = somma imponibile per i mesi da 1 a mese_corrente dell'anno filtrato (o anno corrente se non filtrato)
- `valuePrev` = somma imponibile per gli stessi mesi dell'anno precedente

La Top 10 resta ordinata per `value`.

**Frontend (`src/pages/Dashboard.tsx`):** Rimozione della simulazione `useMemo` con `Math.random()`. I dati `valuePrev` arriveranno direttamente dalla funzione RPC, quindi la tabella li utilizzera senza manipolazioni.

### 2. Titolo "Trade Off snc" cliccabile

**File da modificare:** `src/components/AppLayout.tsx`

Il titolo "Trade Off snc" nell'header verra avvolto in un `Link` di react-router-dom che punta a `/`. Funzionera da qualsiasi pagina dell'applicazione per tornare alla dashboard.

### Dettagli tecnici

**SQL -- nuova CTE `top_clienti`:**
```text
v_current_month = EXTRACT(MONTH FROM current_date)

top_clienti:
  - Filtra i record con mese <= v_current_month
  - value = SUM(imponibile) WHERE anno = anno_filtrato AND mese <= v_current_month
  - valuePrev = SUM(imponibile) WHERE anno = anno_filtrato - 1 AND mese <= v_current_month
  - ORDER BY value DESC, LIMIT 10
```

**Risultato JSON aggiornato:**
```text
topClienti: [{ name, codice, value, valuePrev }, ...]
```

**File modificati:**
- Migrazione SQL per `get_dashboard_stats`
- `src/pages/Dashboard.tsx` -- rimozione simulazione, uso dati reali
- `src/components/AppLayout.tsx` -- Link sul titolo

