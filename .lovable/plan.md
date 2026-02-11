

## Filtro dati per agente e gestione assegnazioni admin

### Panoramica
Ogni utente autenticato vedra' solo i record corrispondenti agli agenti che gli sono stati assegnati dall'amministratore. L'admin vedra' tutti i dati e avra' una sezione dedicata per gestire le assegnazioni utente-agente.

Dal file Excel caricato, il campo "Agente" ha il formato `FO_FO77`. Ogni utente potra' avere uno o piu' agenti assegnati.

### Passaggi

1. **Creare tabella `user_agents`** (migrazione database)
   - Colonne: `id` (uuid), `user_id` (uuid, not null), `agente` (text, not null), `created_at`
   - Vincolo UNIQUE su `(user_id, agente)` per evitare duplicati
   - RLS abilitata:
     - SELECT: ogni utente puo' leggere le proprie assegnazioni, admin puo' leggere tutte
     - INSERT/DELETE: solo admin

2. **Creare funzione helper `get_user_agents`**
   - Funzione `security definer` che restituisce l'array di agenti assegnati a un utente
   - Utilizzata nelle policy RLS per evitare ricorsione

3. **Aggiornare policy RLS su `sales_records`**
   - La policy SELECT attuale (`true` per tutti) verra' sostituita con:
     - Admin: vede tutti i record
     - Utente normale: vede solo i record il cui campo `agente` corrisponde a uno dei suoi agenti assegnati nella tabella `user_agents`

4. **Creare pagina "Gestione Utenti"** (`src/pages/GestioneUtenti.tsx`)
   - Accessibile solo dall'admin
   - Lista degli utenti registrati (dalla tabella `user_roles`)
   - Per ogni utente: lista degli agenti assegnati con possibilita' di aggiungere/rimuovere
   - Selezione degli agenti disponibili estratti dai record esistenti nel database

5. **Aggiornare la sidebar** (`src/components/AppSidebar.tsx`)
   - Aggiungere voce "Gestione Utenti" visibile solo per admin (icona Users)

6. **Aggiornare il routing** (`src/App.tsx`)
   - Aggiungere rotta `/gestione-utenti`

7. **Nessuna modifica a DataContext/pagine dati**
   - Il filtraggio avviene a livello RLS nel database: le query esistenti restituiranno automaticamente solo i dati visibili all'utente

### Dettagli tecnici

**Tabella `user_agents`:**
```text
user_agents
  id          uuid  PK  default gen_random_uuid()
  user_id     uuid  NOT NULL
  agente      text  NOT NULL
  created_at  timestamptz  default now()
  UNIQUE(user_id, agente)
```

**Funzione `get_user_agents`:**
```text
get_user_agents(user_id uuid) -> text[]
  SECURITY DEFINER
  Restituisce array di codici agente assegnati all'utente
```

**Policy RLS aggiornata su `sales_records` (SELECT):**
```text
SE has_role(auth.uid(), 'admin') -> vede tutto
ALTRIMENTI -> vede solo record con agente IN get_user_agents(auth.uid())
```

**Pagina Gestione Utenti:**
- Recupera lista utenti da `user_roles` (con email da un join o vista)
- Per accedere alle email degli utenti servira' una vista o edge function (le email sono in `auth.users` che non e' accessibile dal client)
- Opzione: creare un'edge function `list-users` che restituisce id + email degli utenti registrati (usando service role key)
- Per ogni utente mostra chip con gli agenti assegnati
- Pulsante per aggiungere un agente (select/combobox con agenti disponibili nel database)
- Pulsante per rimuovere un agente

**Edge function `list-users`:**
- Richiede ruolo admin (verifica tramite JWT)
- Usa service role per leggere `auth.users` e restituire id + email
- Necessaria perche' il client non puo' accedere direttamente a `auth.users`

**File coinvolti:**
- Nuovi: `src/pages/GestioneUtenti.tsx`, `supabase/functions/list-users/index.ts`
- Modificati: `src/App.tsx`, `src/components/AppSidebar.tsx`
- Migrazioni DB: creazione tabella `user_agents`, funzione `get_user_agents`, aggiornamento policy SELECT su `sales_records`, policy su `user_agents`

