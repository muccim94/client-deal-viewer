

## KPI cliccabili nella Dashboard + nuova pagina Fatturato

### 1. KPI "Clienti Unici" cliccabile

La card "Clienti Unici" nella dashboard diventa un link che naviga a `/anagrafiche`.

### 2. KPI "Marchi" cliccabile

La card "Marchi" diventa un link che naviga a `/marchi`.

### 3. KPI "Fatturato Totale" cliccabile + nuova pagina

La card "Fatturato Totale" naviga a una nuova pagina `/fatturato` che mostra una tabella riassuntiva con:
- Confronto mese su mese degli ultimi 2 anni (anno corrente vs anno precedente)
- Due sezioni affiancate: una per Fogliani e una per Futurtec
- Per ogni mese: fatturato anno corrente, fatturato anno precedente, variazione %
- Riga totale in fondo
- Stile compatto coerente con le tabelle del dettaglio cliente

I dati verranno recuperati tramite una nuova funzione RPC `get_fatturato_riepilogo` che aggrega i dati da `sales_records` raggruppando per azienda, anno e mese.

### Dettagli tecnici

**Nuova migrazione SQL:**
- Funzione RPC `get_fatturato_riepilogo` che restituisce il fatturato mensile per azienda per gli ultimi 2 anni, con supporto per filtro agente opzionale

**File da creare:**
- `src/pages/FatturatoRiepilogo.tsx` -- pagina con tabella riassuntiva mese su mese divisa per azienda

**File da modificare:**
- `src/pages/Dashboard.tsx` -- rendere le 3 card KPI cliccabili (wrapping con `Link` o `useNavigate`)
- `src/App.tsx` -- aggiungere route `/fatturato`

**Stile delle card cliccabili:**
- Aggiunta di `cursor-pointer`, effetto hover con ombra e transizione per indicare che sono cliccabili
- Le card non cliccabili ("Media per Cliente") restano invariate

