

## Piano: Fix ricerca nella sezione Modifica Storico

### Problema
La sezione "Modifica Storico" non carica i dati perché `recordCount` resta `null` al mount della pagina. L'effect che carica i record (riga 94) richiede `recordCount != null && recordCount > 0`, ma `refreshRecordCount()` non viene mai chiamato all'avvio della pagina `/upload`. Di conseguenza, i filtri di ricerca non producono risultati.

### Modifica: `src/pages/UploadExcel.tsx`

Aggiungere un `useEffect` che chiama `refreshRecordCount()` al mount della pagina:

```tsx
useEffect(() => {
  if (isAdmin) {
    refreshRecordCount();
  }
}, [isAdmin, refreshRecordCount]);
```

Questo va inserito prima dell'effect esistente (prima di riga 94). Una volta che `recordCount` viene caricato, l'effect successivo caricherà i dati e i filtri funzioneranno correttamente.

### Nessun'altra modifica necessaria
La logica di ricerca `.or(nome_cliente.ilike..., codice_cliente.ilike...)` nel `DataContext.tsx` è già corretta.

