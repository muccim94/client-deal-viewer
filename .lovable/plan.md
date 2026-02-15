

## Riprogettazione Top 10 Clienti per Fatturato

### Obiettivo
Trasformare la lista Top 10 in una tabella accattivante ispirata all'immagine di riferimento, con:
- Icona freccia verde (su) o rossa (giu) al posto del numero progressivo
- Fatturato anno corrente (evidenziato, colorato)
- Fatturato anno precedente (secondario, grigio)
- Confronto visivo immediato tra i due anni

### 1. Migrazione SQL -- aggiornare `get_dashboard_stats`

Modificare la CTE `top_clienti` per includere anche il fatturato dell'anno precedente. La funzione calcolera l'anno corrente e il precedente internamente, e per ogni cliente nella Top 10 restituira sia `value` (anno corrente/selezionato) che `valuePrev` (anno precedente).

La logica:
- Se l'utente filtra per un anno specifico, `value` = fatturato di quell'anno, `valuePrev` = fatturato anno-1
- La Top 10 resta ordinata per `value` (anno selezionato)

### 2. Aggiornamento UI -- `src/pages/Dashboard.tsx`

Sostituire la lista `<ol>` con una tabella strutturata:

- **Header**: "Cliente" | "Fatturato" | colonna anno precedente (importo grigio)
- **Per ogni riga**:
  - A sinistra: icona `TrendingUp` verde se `value >= valuePrev`, `TrendingDown` rossa se `value < valuePrev`
  - Nome cliente (troncato, cliccabile)
  - Importo anno corrente in grassetto, colorato (verde se in crescita, rosso se in calo)
  - Importo anno precedente in grigio piu piccolo
- Righe con sfondo alternato per leggibilita
- Bordo sinistro colorato (verde/rosso) come accento visivo

### Dettagli tecnici

**Nuova migrazione SQL:**
Aggiornamento della funzione `get_dashboard_stats` per aggiungere `valuePrev` ai dati `topClienti`. La CTE verra modificata per calcolare separatamente il fatturato dell'anno filtrato e dell'anno precedente, mantenendo il ranking sul fatturato corrente.

**File da modificare:**
- `src/pages/Dashboard.tsx` -- nuova sezione Top 10 con layout tabellare, icone trend, doppia colonna importi

**Tipo dati aggiornato:**
```text
topClienti: { name, codice, value, valuePrev }[]
```

**Componenti Lucide utilizzati:**
- `TrendingUp` (freccia verde per crescita)
- `TrendingDown` (freccia rossa per calo)
