

## Backup persistente durante la navigazione

### Problema attuale
Lo stato del backup (progresso e blocco pulsante) vive dentro il componente `UploadExcel`. Quando si naviga su un'altra pagina, il componente viene smontato e lo stato si perde: il progresso scompare e il pulsante torna cliccabile anche se il backup e' ancora in corso.

### Soluzione
Spostare lo stato del backup nel **DataContext**, che e' gia' montato a livello globale (`App.tsx` riga 37) e non viene smontato durante la navigazione tra le pagine protette.

### Modifiche tecniche

#### 1. `src/contexts/DataContext.tsx`
- Aggiungere lo stato `backupProgress` (`{ loaded: number; total: number } | null`) e `isBackingUp` (boolean) al context
- Spostare la funzione `handleBackup` dal componente `UploadExcel` dentro il DataContext (rinominata `runBackup`)
- Esporre `backupProgress`, `isBackingUp` e `runBackup` tramite il Provider

#### 2. `src/pages/UploadExcel.tsx`
- Rimuovere lo stato locale `backupProgress` e la funzione `handleBackup`
- Importare `backupProgress`, `isBackingUp` e `runBackup` da `useData()`
- Il pulsante Backup usa `isBackingUp` per disabilitarsi e `backupProgress` per mostrare la percentuale

### Risultato
- Il backup continua in background anche navigando su altre pagine
- Tornando sulla pagina Upload, il progresso e' ancora visibile
- Il pulsante resta disabilitato finche' il backup non termina, impedendo richieste duplicate

| File | Modifica |
|---|---|
| `src/contexts/DataContext.tsx` | Aggiungere stato backup e funzione `runBackup` |
| `src/pages/UploadExcel.tsx` | Usare stato e funzione dal context invece che locali |

