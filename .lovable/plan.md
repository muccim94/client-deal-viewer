

## Persistenza dati nel cloud con autenticazione e ruoli

### Panoramica

L'applicazione verra' migrata dal salvataggio locale (localStorage) a un database cloud, con un sistema di autenticazione e ruoli utente. Solo l'amministratore potra' caricare e cancellare dati, mentre gli utenti normali potranno solo visualizzarli.

### Cosa verra' fatto

1. **Creazione tabella ruoli utente** (database)
   - Tipo enum `app_role` con valori `admin` e `user`
   - Tabella `user_roles` con relazione all'utente autenticato
   - Funzione `has_role()` per verificare i ruoli senza ricorsione RLS
   - Policy RLS sulla tabella `user_roles` (ogni utente puo' leggere solo il proprio ruolo)

2. **Aggiornamento policy sulla tabella `sales_records`**
   - Le policy esistenti gia' filtrano per `user_id`, ma verranno aggiornate per supportare il modello admin:
     - **SELECT**: tutti gli utenti autenticati possono leggere tutti i record (i dati sono condivisi)
     - **INSERT/DELETE**: solo gli utenti con ruolo `admin` possono inserire e cancellare

3. **Pagina di Login** (`src/pages/Auth.tsx`)
   - Form con email e password per login e registrazione
   - Conferma automatica dell'email per accesso immediato
   - Redirect alla dashboard dopo il login

4. **Contesto di autenticazione** (`src/contexts/AuthContext.tsx`)
   - Gestione della sessione utente con `onAuthStateChange`
   - Caricamento del ruolo utente dalla tabella `user_roles`
   - Esposizione di `user`, `role`, `signOut` a tutta l'app

5. **Migrazione DataContext al database** (`src/contexts/DataContext.tsx`)
   - Sostituzione di `localStorage` con query al database cloud
   - `loadData`: fetch da `sales_records` tramite SDK
   - `saveData`: insert batch nella tabella `sales_records`
   - `clearData`: delete dei record dell'utente
   - Gestione del caricamento con stato di loading

6. **Protezione delle rotte**
   - Rotte protette: redirect al login se non autenticato
   - Pagina Upload visibile solo agli admin (nascosta dal menu per utenti normali)

7. **Aggiornamento UI**
   - Pulsante di logout nell'header accanto al tema toggle
   - Indicazione del ruolo utente (es. badge "Admin")
   - Nascondere i pulsanti "Cancella storico" e "Importa" per utenti non admin

### Dettagli tecnici

- La tabella `sales_records` esiste gia' nel database con le colonne corrette
- Le policy RLS esistenti (RESTRICTIVE con `auth.uid() = user_id`) verranno sostituite con policy che permettono a tutti gli utenti autenticati di leggere, e solo agli admin di scrivere/cancellare
- Il primo utente registrato dovra' essere promosso ad admin manualmente (tramite query SQL) o tramite un meccanismo di setup iniziale
- I dati attualmente in localStorage andranno reimportati dopo la migrazione
- Il file `src/lib/store.ts` verra' rimosso in quanto non piu' necessario

### Flusso utente

```text
Utente non autenticato
    |
    v
Pagina Login (email + password)
    |
    v
Utente autenticato
    |
    +---> Ruolo "admin": vede tutto, puo' caricare e cancellare dati
    |
    +---> Ruolo "user": vede dashboard, anagrafiche, provvigioni (sola lettura)
```

### Ordine di implementazione

1. Migrazione database (enum, tabella ruoli, funzione has_role, aggiornamento policy)
2. Abilitare auto-confirm email
3. Pagina Auth e contesto autenticazione
4. Migrazione DataContext da localStorage a database
5. Protezione rotte e aggiornamento sidebar/header
6. Rimozione codice localStorage non piu' necessario

