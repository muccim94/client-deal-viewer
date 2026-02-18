
## Editor Dati nella Pagina Upload Excel

### Obiettivo
Aggiungere una sezione "Storico Dati" nella pagina `/upload` che permette di visualizzare, filtrare, modificare ed eliminare singoli record gia' importati nel database.

### Struttura della nuova sezione

La nuova sezione apparira' sotto il blocco dello storico attuale (il contatore dei record), e sara' composta da:

1. **Barra filtri**: campi di ricerca rapida per Anno, Mese, Cliente, Agente
2. **Tabella editabile**: mostra i record con paginazione (50 per pagina), con un pulsante "Modifica" per riga
3. **Dialog di modifica**: form inline per modificare i campi del record selezionato
4. **Pulsante elimina singolo record**: per ogni riga, icona cestino con conferma

### Modifiche tecniche

#### 1. `src/contexts/DataContext.tsx`
Aggiungere due nuove funzioni al context:
- `updateRecord(id: string, data: Partial<SalesRecord>): Promise<void>` — esegue `supabase.from("sales_records").update(...).eq("id", id)`
- `deleteRecord(id: string): Promise<void>` — esegue `supabase.from("sales_records").delete().eq("id", id)`
- `fetchRecords(filters): Promise<{data: DbRecord[], total: number}>` — query paginata con filtri opzionali

#### 2. `src/pages/UploadExcel.tsx`
Aggiungere sotto la card dello storico una nuova `<Card>` con titolo "Modifica Storico" che contiene:

**Filtri**:
```text
[ Anno ▼ ] [ Mese ▼ ] [ 🔍 Cerca cliente... ] [ Cerca agente... ]
```

**Tabella** con colonne:
```text
| Anno | Mese | Cliente | Agente | Marchio | Imponibile | Provvigione | ✏️ | 🗑️ |
```

**Dialog di modifica** (Radix Dialog gia' presente nel progetto) con i campi:
- Anno, Mese (number input)
- Azienda (select: FO/FU)
- Nome Cliente, Codice Cliente (text)
- Agente, Marchio, Articolo (text)
- Imponibile, Provvigione (number)

**Paginazione**: bottoni "Precedente / Pagina X di Y / Successivo"

### Flusso dati

```text
DB (sales_records)
      |
      | supabase query con filtri + range paginazione
      ▼
fetchRecords() nel DataContext
      |
      ▼
Tabella nella pagina UploadExcel
      |
   [Modifica] → Dialog con form → updateRecord() → refresh tabella
   [Elimina]  → AlertDialog conferma → deleteRecord() → refresh tabella + refreshRecordCount()
```

### Dettagli tecnici

**Query paginata con filtri**:
```ts
let query = supabase
  .from("sales_records")
  .select("*", { count: "exact" })
  .order("anno", { ascending: false })
  .order("mese", { ascending: false });

if (filterAnno) query = query.eq("anno", filterAnno);
if (filterMese) query = query.eq("mese", filterMese);
if (filterCliente) query = query.ilike("nome_cliente", `%${filterCliente}%`);
if (filterAgente) query = query.ilike("agente", `%${filterAgente}%`);

const from = page * PAGE_SIZE;
query = query.range(from, from + PAGE_SIZE - 1);
```

**RLS**: Le policy esistenti permettono gia' agli admin di UPDATE e DELETE su `sales_records`. La funzionalita' di modifica sara' visibile solo agli admin (come gia' avviene per "Cancella storico").

**Nessuna migrazione SQL necessaria** — le tabelle e le policy RLS esistenti coprono gia' tutti i casi.

### File modificati
- `src/contexts/DataContext.tsx` — aggiunta `updateRecord`, `deleteRecord`, `fetchRecords`
- `src/pages/UploadExcel.tsx` — aggiunta sezione editor con tabella, filtri, dialog e paginazione
