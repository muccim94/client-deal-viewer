

## Aggiungere pulsante Backup accanto a Cancella Storico

### Cosa cambia

Nella card che mostra il conteggio dei record ("Storico attuale: X record"), verra' aggiunto un pulsante "Backup" accanto al pulsante rosso "Cancella storico". Cliccandolo, il sistema scarichera' tutti i record attualmente visibili nello storico in un file Excel (.xlsx).

### Dettagli tecnici

#### File: `src/pages/UploadExcel.tsx`

1. **Import**: aggiungere l'icona `Download` da `lucide-react` e la libreria `xlsx` (gia' installata nel progetto).

2. **Funzione `handleBackup`**: 
   - Recupera tutti i record dal database (usando `supabase.from("sales_records").select("*")` con paginazione per superare il limite di 1000 righe)
   - Converte i dati in un foglio Excel con le colonne originali (Azienda, Anno, Mese, Codice Cliente, Nome Cliente, Agente, Marchio, Articolo, Imponibile, Provvigione)
   - Scarica il file come `backup_storico_YYYY-MM-DD.xlsx`

3. **UI**: inserire il pulsante subito prima del `<AlertDialog>` di cancellazione, dentro un `<div className="flex gap-2">`:

```
<Button variant="outline" size="sm" onClick={handleBackup}>
  <Download className="h-4 w-4 mr-1" /> Backup
</Button>
```

| File | Modifica |
|---|---|
| `src/pages/UploadExcel.tsx` | Aggiungere funzione backup e pulsante Download accanto a Cancella storico |

Nessuna modifica al database.

