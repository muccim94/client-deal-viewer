## Problema

Il file Excel generato dalla funzione **Backup** (pulsante nella card "Storico attuale") non può essere ri-caricato tramite la sezione "Carica File Excel". Il parser fallisce immediatamente con l'errore *"Colonne mancanti nel file Excel: Cliente"*, perché il backup ha uno schema di colonne diverso da quelli supportati.

### Confronto schemi

| Esportato dal Backup | Atteso dal parser "Standard" |
|---|---|
| `Codice Cliente` + `Nome Cliente` (separati) | `Cliente` (formato `codice - nome`) |
| `Marchio` (colonna dedicata) | derivato da `Articolo` (substring) |
| `Provvigione` | `ProvvigioneValore` |
| (nessuna `Fattura_Riga`) | `Fattura_Riga` richiesta per univocità |
| `Articolo` già pulito | `Articolo` con prefisso di 3 char |

Il parser oggi gestisce solo due formati: "Standard" (export gestionale originale) e "Riepilogo". Il formato "Backup" non è riconosciuto.

## Soluzione

Aggiungere nel parser un **terzo formato "Backup"** rilevato automaticamente dalla presenza simultanea delle colonne `Codice Cliente`, `Nome Cliente` e `Marchio` (combinazione che identifica univocamente il backup ed è assente negli altri due formati).

### Cosa cambierà nel codice

**File: `src/lib/parseExcel.ts`**

1. **Nuova funzione `isBackupFormat(row)`** che ritorna `true` se la prima riga contiene le colonne tipiche del backup (`Codice Cliente`, `Nome Cliente`, `Marchio`).

2. **Nuova funzione `parseAsBackup(json)`** che:
   - legge `Azienda`, `Anno`, `Mese` direttamente dalle colonne dedicate;
   - usa `Codice Cliente` e `Nome Cliente` separatamente (no parsing del campo "Cliente");
   - prende `Marchio` dalla colonna omonima (no derivazione dall'articolo);
   - prende `Imponibile` e `Provvigione` direttamente;
   - ricostruisce un `fatturaRiga` deterministico nel formato `BKP_<azienda>_<anno>_<mese>_<codice>_<articolo>` per garantire l'idempotenza dell'upsert (ricaricando lo stesso backup non si creano duplicati grazie al constraint `user_id,azienda,anno,mese,codice_cliente,articolo,fattura_riga`);
   - applica la stessa validazione Zod (`salesRowSchema`) già usata dagli altri formati.

3. **Aggiornamento del dispatcher in `parseExcelFile`**: l'ordine di rilevamento diventa `Backup → Riepilogo → Standard`. Il formato Backup viene controllato per primo perché è il più specifico.

### Effetti collaterali / sicurezza

- Nessuna modifica al database, alle RLS o alle edge function.
- Nessuna modifica alla UI: il drag&drop e il pulsante di importazione continuano a funzionare come oggi; l'utente non si accorge della logica aggiuntiva.
- Il flusso di deduplica esistente (`upsert` con `ignoreDuplicates: true`) garantisce che ricaricare un backup su uno storico parzialmente esistente aggiunga solo i record mancanti.
- Gli altri due formati continuano a funzionare invariati.

### Test manuali consigliati dopo la modifica

1. Generare un backup dalla pagina "Modifica Storico" con dati presenti.
2. Cancellare lo storico (o spostare il file su un ambiente vuoto).
3. Trascinare il file di backup nella zona di upload → l'anteprima deve mostrare correttamente i record.
4. Confermare l'import → il numero record deve coincidere con quello esportato.
5. Ri-caricare lo stesso backup → tutti i record devono risultare "duplicati ignorati" (0 nuovi).