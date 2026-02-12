

## Nuova pagina "Marchi" con analisi fatturato per marchio

### Cosa viene creato

Una nuova pagina **Marchi** accessibile dalla sidebar, con:

1. **3 card KPI riassuntive** in alto:
   - **Materiale Elettrico**: somma degli importi di tutti i prodotti ESCLUSI quelli con marchio "CV." e "FV."
   - **Fotovoltaico**: somma degli importi dei prodotti con marchio "FV."
   - **Cavo**: somma degli importi dei prodotti con marchio "CV."

2. **Tabella elenco marchi** sotto le card:
   - Colonne: Nome Marchio, Fatturato anno corrente (2026), Fatturato anno precedente (2025)
   - Ordinabile per colonna
   - Barra di ricerca per filtrare i marchi

### Dettagli tecnici

**Nuovo file: `src/pages/Marchi.tsx`**
- Importa `useData` dal DataContext per accedere ai record
- Calcola i 3 KPI filtrando per `r.marchio`:
  - "Cavo" = record con `marchio === "CV."`
  - "Fotovoltaico" = record con `marchio === "FV."`
  - "Materiale Elettrico" = tutti gli altri record (esclusi CV. e FV.)
- Aggrega i dati per marchio in una tabella con fatturato suddiviso per anno corrente e precedente (stessa logica di Anagrafiche)
- Tabella ordinabile e filtrabile con barra di ricerca

**File modificato: `src/components/AppSidebar.tsx`**
- Aggiunta voce "Marchi" nell'array `allItems` con icona `Tag` (da lucide-react), posizionata dopo "Anagrafiche" e prima di "Provvigioni"
- URL: `/marchi`

**File modificato: `src/App.tsx`**
- Import del componente `Marchi`
- Nuova `Route` con path `/marchi` all'interno del layout protetto, dopo la route di `/anagrafiche/:codice`

