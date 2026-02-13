

## Fix: Barra di caricamento che scompare prematuramente

### Causa del problema

In `DataContext.tsx` riga 135, `setLoading(false)` viene chiamato dentro il callback `onChunk`, cioe dopo il primo blocco di 1000 record. Poiche la condizione di visibilita della barra e `loading && totalCount > 0`, la barra scompare immediatamente dopo il primo batch.

Inoltre, alla riga 138-139, `setTotalCount(0)` e `setLoadedCount(0)` vengono resettati subito dopo il completamento di `fetchAllRecords`, e poi di nuovo nel blocco `finally` (righe 144-145), rendendo impossibile mostrare il progresso fino alla fine.

### Soluzione

Modificare `src/contexts/DataContext.tsx`:

1. **Rimuovere `setLoading(false)` dal callback `onChunk`** (riga 135) -- il caricamento e "in corso" finche tutti i record non sono arrivati.
2. **Spostare il reset di `totalCount` e `loadedCount`** solo nel blocco `finally`, dopo che `setLoading(false)` e stato chiamato e il rendering della barra al 100% ha avuto tempo di essere mostrato.
3. **Svuotare `records` prima di iniziare** il fetch per evitare duplicati causati dal callback `onChunk` che fa `setRecords(prev => [...prev, ...chunk])` seguito poi da `setRecords(data)` che sovrascrive tutto.

### Dettaglio tecnico

```text
refreshRecords():
  - Riga 112: aggiungere setRecords([]) all'inizio per pulire i dati precedenti
  - Riga 135: RIMUOVERE setLoading(false) dal callback onChunk
  - Righe 137-139: rimuovere setRecords(data), setTotalCount(0), setLoadedCount(0)
  - Blocco finally: mantenere setLoading(false), aggiungere un breve delay
    prima di resettare totalCount/loadedCount cosi l'utente vede il 100%
```

La barra di progresso restera visibile per tutta la durata del caricamento, mostrando il conteggio aggiornato fino al completamento.
