
## Nuova sezione "Provvigioni"

### Cosa verra' fatto

1. **Aggiornamento del modello dati** (`src/types/data.ts`)
   - Aggiunta del campo `provvigione: number` all'interfaccia `SalesRecord`

2. **Aggiornamento del parsing Excel** (`src/lib/parseExcel.ts`)
   - Lettura della colonna "Provvigione Valore" dal file Excel e mappatura nel nuovo campo `provvigione`

3. **Aggiunta voce menu** (`src/components/AppSidebar.tsx`)
   - Nuova voce "Provvigioni" nel menu laterale con icona appropriata (es. `Coins`) e rotta `/provvigioni`

4. **Nuova pagina Provvigioni** (`src/pages/Provvigioni.tsx`)
   - Filtri per anno, mese e azienda (simili alla Dashboard)
   - Tabella con i dati delle provvigioni raggruppati per cliente, con colonne: Codice Cliente, Nome Cliente, Azienda, Provvigione totale
   - Formattazione valuta EUR e ordinamento colonne
   - Ricerca per nome cliente
   - Stato vuoto se non ci sono dati

5. **Aggiornamento routing** (`src/App.tsx`)
   - Aggiunta della rotta `/provvigioni` che punta alla nuova pagina

### Dettagli tecnici

- Il campo `provvigione` viene letto come `Number(row["Provvigione Valore"] ?? 0)` durante il parsing
- I dati gia' salvati in localStorage senza il campo `provvigione` verranno trattati come `0` di default
- La pagina riutilizza gli stessi pattern di filtro e tabella gia' presenti nella Dashboard e nelle Anagrafiche
