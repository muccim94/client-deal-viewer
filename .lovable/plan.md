

## Correzione logica YTD: usare ultimo mese con dati invece del mese corrente

### Problema

Attualmente i confronti Year-over-Year usano il mese di calendario corrente (es. marzo 2026) per limitare il progressivo. Se pero' i dati caricati arrivano solo fino a febbraio 2026, il confronto deve essere fatto su gennaio-febbraio di entrambi gli anni, non gennaio-marzo.

### Punti da correggere

**Gia' corretto:**
- `get_marchi_stats` (RPC) — usa gia' `MAX(mese)` dai dati
- `ClienteMarchi.tsx` — calcola `meseMax` dai record

**Da correggere:**

1. **`get_dashboard_stats` (RPC)** — Sostituire `EXTRACT(MONTH FROM current_date)` con una subquery che calcola il mese massimo presente nell'anno corrente nei `sales_records` filtrati. Il confronto top clienti YTD usera' questo valore.

2. **`get_clienti_list` (RPC)** — Stessa correzione: derivare `v_current_month` dal massimo mese con dati nell'anno corrente invece che dalla data di sistema.

3. **`ClienteDettaglio.tsx` (client-side)** — Linea 98 usa `new Date().getMonth() + 1`. Sostituire con il calcolo del mese massimo presente nei record dell'anno corrente, come gia' fatto in `ClienteMarchi.tsx`.

### Dettaglio tecnico

Per le due funzioni RPC, la modifica e':

```sql
-- Prima (errato)
v_current_month := EXTRACT(MONTH FROM current_date)::integer;

-- Dopo (corretto)
SELECT COALESCE(MAX(mese), EXTRACT(MONTH FROM current_date)::integer)
INTO v_current_month
FROM sales_records s
WHERE s.anno = v_anno  -- o v_current_year
  AND (is_admin OR s.agente = ANY(user_agents))
  AND (p_azienda IS NULL OR s.azienda = p_azienda);  -- solo per dashboard_stats
```

Per `ClienteDettaglio.tsx`:
```typescript
// Prima
const meseCorrente = new Date().getMonth() + 1;

// Dopo
const mesiCorrente = clientRecords.filter(r => r.anno === annoCorrente).map(r => r.mese);
const meseCorrente = mesiCorrente.length ? Math.max(...mesiCorrente) : new Date().getMonth() + 1;
```

### Migrazione database

Una singola migrazione SQL che ricrea `get_dashboard_stats` e `get_clienti_list` con la logica corretta.

### File coinvolti

- Migrazione SQL (nuova) — aggiorna le due funzioni RPC
- `src/pages/ClienteDettaglio.tsx` — fix calcolo `meseCorrente` lato client

