

## Ricerca rapida clienti: estensione a tutte le piattaforme + risultati sopra la barra

### Cosa cambia

1. **FAB visibile su tutte le piattaforme** (non solo mobile): il pulsante con la lente viene mostrato sempre, posizionato in basso a destra (`fixed bottom-6 right-6`). Rimuovere il condizionale `{isMobile && ...}`.

2. **Risultati sopra la barra di testo**: nel dialog di ricerca, invertire l'ordine: prima la lista risultati (ScrollArea), poi l'input di testo in basso. I risultati appariranno visivamente sopra la barra di ricerca usando `flex flex-col-reverse` o riordinando i componenti nel JSX.

### File coinvolti

- **`src/pages/Dashboard.tsx`**:
  - Rimuovere il guard `{isMobile && ...}` dal FAB e dal Dialog
  - Spostare il FAB in basso a destra (`right-6` invece di `left-1/2 -translate-x-1/2`)
  - Riordinare il contenuto del DialogContent: ScrollArea prima, Input dopo, per far apparire i risultati sopra la barra di testo

### Nessuna modifica al database

