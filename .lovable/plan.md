

## Indicatore di progresso caricamento dati

### Cosa cambia

Dopo il login, durante il caricamento dei record dal database, comparira' una barra di progresso nell'header dell'app che mostra quanti record sono stati caricati rispetto al totale (es. "Caricamento... 15.000 / 51.234"). La barra scompare automaticamente al completamento.

### Dettagli tecnici

**File: `src/contexts/DataContext.tsx`**

1. Aggiungere due nuovi stati al context: `totalCount` (numero totale di record) e `loadedCount` (record caricati finora)
2. Esporre `totalCount` e `loadedCount` nell'interfaccia `DataContextType`
3. In `fetchAllRecords`, passare il `count` totale come valore di ritorno insieme ai dati, oppure accettare un callback `onCount` per comunicare il totale
4. In `refreshRecords`:
   - Settare `totalCount` dopo la query di conteggio
   - Aggiornare `loadedCount` ad ogni chunk ricevuto
   - Resettare entrambi a 0 al completamento

**File: `src/components/AppLayout.tsx`**

1. Importare `useData` e il componente `Progress` da UI
2. Sotto l'header, mostrare condizionalmente (quando `loading` e' true e `totalCount > 0`) una barra di progresso con:
   - Componente `Progress` con valore percentuale `(loadedCount / totalCount) * 100`
   - Testo "Caricamento... X / Y record" centrato sotto la barra
3. La barra scompare quando `loading` diventa false

