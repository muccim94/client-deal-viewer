
# Fix: Importazione dati incompleta (195 record persi)

## Problema
Su 3027 record nel file Excel, solo 2832 vengono importati. I 195 record mancanti vengono erroneamente scartati come "duplicati" perche la chiave di deduplicazione attuale (`azienda|anno|mese|codiceCliente|articolo|imponibile`) non e sufficientemente specifica: quando lo stesso cliente acquista lo stesso articolo allo stesso prezzo piu volte nello stesso mese (fatture diverse), i record vengono considerati uguali.

## Soluzione
Aggiungere il campo `Fattura_Riga` dal file Excel come identificatore univoco di ogni riga, e usarlo nella chiave di deduplicazione sia lato client che lato database.

## Modifiche previste

### 1. Tipo dati (`src/types/data.ts`)
- Aggiungere il campo `fatturaRiga: string` all'interfaccia `SalesRecord`

### 2. Parsing Excel (`src/lib/parseExcel.ts`)
- Estrarre la colonna `Fattura_Riga` dal file Excel (es. `FO_6500017_1`)
- Mappare il valore nel nuovo campo `fatturaRiga`

### 3. Migrazione database
- Aggiungere la colonna `fattura_riga` (tipo `text`) alla tabella `sales_records`
- Ricreare il vincolo di unicita includendo `fattura_riga` al posto di `imponibile`
- Il nuovo vincolo sara: `user_id, azienda, anno, mese, codice_cliente, articolo, fattura_riga`

### 4. DataContext (`src/contexts/DataContext.tsx`)
- Aggiornare `fromDB()` e `toDB()` per mappare il campo `fattura_riga`
- Aggiornare la `recordKey` per usare `fatturaRiga` invece di `imponibile`
- Aggiornare il parametro `onConflict` nell'upsert con il nuovo vincolo

### 5. Impatto sulle altre pagine
- Nessun impatto: le pagine Dashboard, Anagrafiche, Provvigioni e ClienteDettaglio non usano il campo `fatturaRiga` nei calcoli o nella visualizzazione. Il campo serve solo per la deduplicazione.

---

## Dettagli tecnici

**Migrazione SQL:**
```sql
ALTER TABLE sales_records ADD COLUMN fattura_riga text;
ALTER TABLE sales_records DROP CONSTRAINT IF EXISTS sales_records_unique_record;
ALTER TABLE sales_records ADD CONSTRAINT sales_records_unique_record 
  UNIQUE (user_id, azienda, anno, mese, codice_cliente, articolo, fattura_riga);
```

**Nuova recordKey:**
```typescript
const recordKey = (r: SalesRecord) =>
  `${r.azienda}|${r.anno}|${r.mese}|${r.codiceCliente}|${r.articolo}|${r.fatturaRiga}`;
```

**Nota importante:** Dopo l'aggiornamento, sara necessario cancellare lo storico attuale e reimportare il file Excel per avere tutti i 3027 record correttamente salvati.
