
## Aggiunta Inserimento Manuale Record + Verifica Funzionalità

### Stato attuale (verificato dal testing)
- Eliminazione: funziona correttamente — il dialog di conferma appare, mostra il nome del cliente e il mese/anno
- Modifica: funziona correttamente — il dialog si popola con tutti i campi del record selezionato
- Nessun bug riscontrato nelle funzionalità esistenti

### Obiettivo
Aggiungere un pulsante "+ Nuovo Record" nella sezione "Modifica Storico" che apre un form per inserire manualmente un nuovo record nel database.

### Approccio tecnico

Il `RecordEditDialog` esistente gestisce già tutti i campi necessari. L'approccio più pulito è:

1. **Estendere `RecordEditDialog`** per supportare sia la modalità "modifica" (record esistente) che la modalità "nuovo" (record vuoto), discriminando tramite la prop `record: DbRecord | null`
2. **Aggiungere `addRecord`** nel `DataContext` — una funzione che inserisce un singolo record via `supabase.from("sales_records").insert(...)`
3. **Aggiungere il pulsante** "+ Nuovo Record" nell'header della card "Modifica Storico"

### Modifiche tecniche

#### 1. `src/contexts/DataContext.tsx`
Aggiungere la funzione `addRecord` all'interfaccia e all'implementazione:

```ts
addRecord: (data: Omit<DbRecord, "id" | "created_at">) => Promise<void>
```

L'implementazione esegue un insert diretto (senza upsert, poiché è un record manuale senza `fattura_riga` univoco):

```ts
const addRecord = useCallback(async (data: Omit<DbRecord, "id" | "created_at">) => {
  const { error } = await supabase.from("sales_records").insert({
    ...data,
    user_id: user!.id,
    fattura_riga: null,
  });
  if (error) throw error;
  await refreshRecordCount();
}, [user, refreshRecordCount]);
```

#### 2. `src/components/upload/RecordEditDialog.tsx`
Estendere il componente per gestire la modalità "nuovo record":
- Quando `record` è `null` e `open` è `true` → form vuoto con valori di default (anno corrente, mese corrente, azienda "FO")
- Il titolo del dialog diventa "Nuovo Record" invece di "Modifica Record"
- Il bottone "Salva" chiama `onSave(null, form)` anziché `onSave(record.id, form)`

Nuova firma delle props:
```ts
interface Props {
  record: DbRecord | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string | null, data: Partial<DbRecord>) => Promise<void>;
}
```

La logica nel `handleSave`:
```ts
const handleSave = async () => {
  setSaving(true);
  try {
    await onSave(record?.id ?? null, { ...form });
    onClose();
  } finally {
    setSaving(false);
  }
};
```

#### 3. `src/pages/UploadExcel.tsx`
- Aggiungere stato `addingNew: boolean` per aprire il dialog in modalità "nuovo"
- Aggiungere un pulsante `+ Nuovo Record` (con icona `Plus`) nell'header della card "Modifica Storico"
- Aggiornare `handleSaveRecord` per discriminare tra update e insert:

```ts
const handleSaveRecord = async (id: string | null, data: Partial<DbRecord>) => {
  if (id) {
    await updateRecord(id, data);
    toast.success("Record aggiornato");
  } else {
    await addRecord(data as Omit<DbRecord, "id" | "created_at">);
    toast.success("Record aggiunto");
  }
  loadEditor(filters, editorPage);
  queryClient.invalidateQueries();
};
```

- Il `RecordEditDialog` viene aperto in modalità "nuovo" quando `editTarget` è `null` e `addingNew` è `true`:

```tsx
<RecordEditDialog
  record={addingNew ? null : editTarget}
  open={!!editTarget || addingNew}
  onClose={() => { setEditTarget(null); setAddingNew(false); }}
  onSave={handleSaveRecord}
/>
```

### File modificati
- `src/contexts/DataContext.tsx` — aggiunta funzione `addRecord`
- `src/components/upload/RecordEditDialog.tsx` — supporto modalità "nuovo record" (form vuoto + titolo dinamico)
- `src/pages/UploadExcel.tsx` — pulsante "+ Nuovo Record" + logica insert vs update

### Nessuna migrazione SQL necessaria
La tabella `sales_records` e le policy RLS esistenti (INSERT solo per admin) coprono già il caso.
