

## Importazione dati anagrafici da Excel

Aggiungere una funzionalita' per gli amministratori che permetta di importare in blocco i dati anagrafici dei clienti (telefono, email, partita IVA, indirizzo, provincia) da un file Excel.

### Dove si trova

Una nuova sezione nella pagina "Gestione Dati" (UploadExcel), visibile solo agli admin, con un'area di upload dedicata alle anagrafiche, separata dall'upload del fatturato.

### Funzionamento

1. L'admin carica un file Excel con colonne come: **Nome Cliente**, **Partita IVA**, **Indirizzo**, **Provincia**, **Telefono**, **Email**
2. Il sistema mostra un'anteprima dei dati trovati (nome, P.IVA, telefono, email, indirizzo)
3. L'admin conferma l'importazione
4. I dati vengono inseriti/aggiornati nella tabella `clienti_anagrafica` tramite upsert su `nome_cliente`
5. Toast di conferma con il numero di record aggiornati

### Formato Excel atteso

Il parser sara' flessibile e cerchera' colonne con nomi simili (case-insensitive):
- "Nome Cliente" / "Ragione Sociale" / "Cliente" -> `nome_cliente`
- "Partita IVA" / "P.IVA" / "P. IVA" -> `partita_iva`
- "Indirizzo" / "Sede" -> `indirizzo`
- "Provincia" / "Prov" -> `provincia`
- "Telefono" / "Tel" / "Phone" -> `telefono`
- "Email" / "E-mail" / "Mail" -> `email`

La colonna "Nome Cliente" e' obbligatoria. Le altre sono facoltative: verranno importate solo se presenti.

### Modifiche tecniche

**Nuovo file: `src/lib/parseAnagraficaExcel.ts`**
- Funzione `parseAnagraficaExcel(file: File)` che restituisce un array di oggetti con i campi anagrafici
- Mapping flessibile dei nomi colonna (case-insensitive, con alias)
- Validazione: almeno la colonna "Nome Cliente" deve essere presente, righe senza nome vengono ignorate

**File: `src/pages/UploadExcel.tsx`**
- Aggiungere una nuova Card "Importa Anagrafiche" sotto la card di upload fatturato, visibile solo agli admin
- Area drag-and-drop dedicata (stile coerente con l'upload esistente)
- Anteprima tabellare dei dati trovati con conteggio record
- Pulsanti Annulla/Importa
- Al conferma: upsert batch sulla tabella `clienti_anagrafica` e invalidazione delle query correlate

