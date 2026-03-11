

## Dettaglio Marchio — Analisi Clienti per Marchio

Cliccando su un marchio nella tabella della pagina `/marchi`, si apre una nuova pagina `/marchi/:famiglia` che mostra quali clienti acquistano quel marchio, ispirandosi al mockup fornito.

### Struttura della pagina

**Header**: `{MARCHIO} — Analisi Clienti` con bottone indietro

**3 KPI cards in riga**: Fatturato anno corrente, Crescita vs anno precedente (%), Clienti attivi (count)

**Distribuzione fatturato clienti**: barre orizzontali con i top 3 clienti + "Altri N" raggruppati, con percentuale

**Scatter chart "Crescita clienti"**: asse X = fatturato corrente, asse Y = var% vs anno precedente. Bolle dimensionate per fatturato. Colori: verde crescita, rosso calo. Label sui clienti principali.

**Tabella "Clienti che acquistano {MARCHIO}"**: Nome cliente, barra colorata proporzionale, Fatt. anno corrente, Fatt. anno precedente (YTD). Riga totale in fondo. Ordinabile e con ricerca.

**Card "Insight automatici"**: alert per clienti in forte calo e clienti in forte crescita (soglia ±20%)

### Backend

Nuova RPC `get_marchio_clienti_stats` con parametri `p_famiglia text, p_azienda_nome text, p_anno int, p_agente text`:
- Raggruppa `sales_records` per `codice_cliente`/`nome_cliente` dove `marchio` inizia con la famiglia (prime 3 lettere)
- Restituisce per ogni cliente: `codice_cliente`, `nome_cliente`, `fatt_current` (anno corrente), `fatt_prev_ytd` (anno precedente YTD, limitato al mese max dell'anno corrente), `fatt_prev_total`
- Rispetta gli stessi filtri di visibilità agente della pagina Marchi

### Frontend

1. **Nuova route** in `App.tsx`: `/marchi/:famiglia` → `MarchioDettaglio`
2. **Nuovo file** `src/pages/MarchioDettaglio.tsx` con tutti i componenti descritti
3. **Tabella in Marchi.tsx**: rendere le righe cliccabili con `useNavigate` → `/marchi/${r.marchio}`

### Componenti nella pagina MarchioDettaglio

- KPI cards (fatturato, crescita %, n. clienti)
- Distribuzione: barre orizzontali con Progress/div custom (top 2-3 clienti + "Altri")
- ScatterChart (recharts) con ZAxis per dimensione bolle, ReferenceLine a y=0
- Tabella clienti con barre proporzionali inline, ordinabile
- Card Insight: calcolo automatico clienti con var < -20% e var > +50%

### File coinvolti
- `src/pages/MarchioDettaglio.tsx` — nuovo
- `src/pages/Marchi.tsx` — righe tabella cliccabili
- `src/App.tsx` — nuova route
- Migration SQL — nuova RPC

