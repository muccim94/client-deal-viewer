## Implementazione autenticazione e persistenza cloud

### Panoramica

Il database e' gia' configurato con la tabella `user_roles`, la funzione `has_role()`, il trigger per assegnare automaticamente il ruolo 'user' ai nuovi utenti e le policy RLS aggiornate. Ora implementeremo il codice dell'applicazione.

### Passaggi

1. **Abilitare la conferma automatica email**
  - Configurazione dell'autenticazione per permettere accesso immediato dopo la registrazione, senza dover verificare l'email
2. **Creare la pagina di Login** (`src/pages/Auth.tsx`)
  - Form con due modalita': Login e Registrazione
  - Campi: email e password
  - Redirect automatico alla dashboard dopo il login
  - Gestione errori con messaggi toast
3. **Creare il contesto di autenticazione** (`src/contexts/AuthContext.tsx`)
  - Listener `onAuthStateChange` per gestire la sessione
  - Caricamento del ruolo utente dalla tabella `user_roles`
  - Esposizione di `user`, `role`, `loading`, `signOut`
  - Il primo utente registrato viene promosso automaticamente ad admin (se la tabella `user_roles` e' vuota)
4. **Migrare DataContext al database** (`src/contexts/DataContext.tsx`)
  - `records`: caricati da `sales_records` via SDK (con supporto per piu' di 100000 record tramite paginazione)
  - `clearRecords`: delete di tutti i record (solo admin)
  - Stato `loading` per gestire il caricamento iniziale
  - Mapping bidirezionale tra i nomi camelCase del frontend e snake_case del database
5. **Aggiornare le rotte e la navigazione**
  - Aggiungere la rotta `/auth` in `App.tsx`
  - Creare un componente `ProtectedRoute` che redirige al login se non autenticato
  - Tutte le rotte esistenti saranno protette
6. **Aggiornare la sidebar** (`src/components/AppSidebar.tsx`)
  - Nascondere "Upload Excel" per utenti non admin
  - Aggiungere pulsante di logout nella parte bassa della sidebar
7. **Aggiornare l'header** (`src/components/AppLayout.tsx`)
  - Mostrare badge "Admin" accanto al nome se l'utente e' admin
  - Rimuovere il pulsante di logout dall'header (spostato nella sidebar come richiesto)
8. **Aggiornare la pagina Upload** (`src/pages/UploadExcel.tsx`)
  - Passare `user.id` come `user_id` nei record inseriti nel database
  - Aggiornare le funzioni `confirm` e `clearAll` per usare il DataContext aggiornato
9. **Rimuovere il codice localStorage**
  - Eliminare `src/lib/store.ts`
  - Rimuovere import e riferimenti dal DataContext

### Dettagli tecnici

**Mapping dati frontend/database:**

- Il frontend usa `camelCase` (es. `codiceCliente`, `aziendaNome`)
- Il database usa `snake_case` (es. `codice_cliente`, `azienda_nome`)
- Il DataContext si occupera' della conversione in entrambe le direzioni

**Gestione primo admin:**

- Quando un utente si registra, il trigger assegna il ruolo `user`
- Nel `AuthContext`, dopo il login, se non esistono altri utenti con ruolo `admin` nella tabella, il primo utente viene promosso ad admin tramite una edge function dedicata (poiche' la tabella `user_roles` non ha policy INSERT per utenti normali)

**Alternativa piu' semplice per il primo admin:**

- Poiche' il trigger assegna sempre `user`, il primo utente registrato potra' essere promosso ad admin tramite un UPDATE diretto eseguito manualmente dalla console database. Questo evita complessita' aggiuntiva.

**Paginazione dei dati:**

- La query di default di Supabase restituisce massimo 1000 righe
- Implementeremo un ciclo di fetch per caricare tutti i record disponibili

**File coinvolti:**

- Nuovi: `src/pages/Auth.tsx`, `src/contexts/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`
- Modificati: `src/App.tsx`, `src/contexts/DataContext.tsx`, `src/components/AppSidebar.tsx`, `src/components/AppLayout.tsx`, `src/pages/UploadExcel.tsx`
- Rimossi: `src/lib/store.ts`