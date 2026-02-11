
## Persistenza dati nel cloud con login personale

Attualmente i dati importati dai file Excel vengono salvati nel browser (localStorage) e si perdono cambiando dispositivo o cancellando i dati del browser. Questo piano migra lo storage nel database cloud e aggiunge un sistema di autenticazione con login.

---

### Cosa cambiera' per te

1. **Pagina di Login/Registrazione** -- Al primo accesso dovrai creare un account (email + password) e confermare l'email. Dopo il login, vedrai i tuoi dati da qualsiasi dispositivo.

2. **I dati restano salvati nel cloud** -- I record importati dai file Excel verranno salvati nel database e saranno sempre disponibili quando accedi con il tuo account.

3. **Privacy** -- Ogni utente vede solo i propri dati. Nessun altro puo' accedere ai tuoi record.

---

### Dettagli tecnici

#### 1. Creazione tabella `sales_records` nel database

Tabella con le seguenti colonne:
- `id` (uuid, chiave primaria)
- `created_at` (timestamp)
- `user_id` (uuid, riferimento all'utente autenticato, non nullable)
- `azienda`, `azienda_nome`, `anno`, `mese`, `codice_cliente`, `nome_cliente`, `agente`, `marchio`, `articolo` (testo)
- `imponibile`, `provvigione` (numeri decimali)

Chiave univoca su `(user_id, azienda, anno, mese, codice_cliente, articolo, imponibile)` per prevenire duplicati.

#### 2. Politiche di sicurezza (RLS)

- SELECT: l'utente vede solo i propri record (`user_id = auth.uid()`)
- INSERT: l'utente puo' inserire solo record con il proprio `user_id`
- DELETE: l'utente puo' cancellare solo i propri record

#### 3. Pagina di autenticazione (`src/pages/Auth.tsx`)

- Form di login (email + password)
- Form di registrazione
- Redirect automatico alla dashboard dopo il login
- Protezione delle rotte: se non autenticato, redirect alla pagina di login

#### 4. Aggiornamento del DataContext (`src/contexts/DataContext.tsx`)

- Sostituzione di localStorage con chiamate al database cloud
- Caricamento dei record dell'utente autenticato all'avvio
- Salvataggio dei nuovi record nel database dopo l'importazione
- Cancellazione dei record dal database (invece che da localStorage)

#### 5. Aggiornamento dello store (`src/lib/store.ts`)

- Le funzioni `saveData`, `loadData`, `clearData` verranno sostituite con operazioni sul database cloud

#### 6. Aggiornamento dell'upload (`src/pages/UploadExcel.tsx`)

- L'importazione inserira' i record nel database con il `user_id` dell'utente corrente
- Il controllo duplicati avverra' tramite la chiave univoca nel database

#### 7. Aggiornamento del routing (`src/App.tsx`)

- Aggiunta rotta `/auth` per la pagina di login
- Componente `ProtectedRoute` che verifica l'autenticazione
- Tutte le pagine esistenti protette dal login

#### 8. Aggiornamento della sidebar/header

- Aggiunta pulsante di logout nell'header o nella sidebar
