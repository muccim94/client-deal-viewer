

## Ottimizzazione Mobile + Permesso Provvigioni + Email in Sidebar

### 1. Anagrafiche -- Ottimizzazione larghezza mobile

**File:** `src/pages/Anagrafiche.tsx`

- Il contenitore principale `space-y-4` non ha limiti di overflow. Aggiungere `overflow-hidden` al wrapper e `overflow-x-auto` alla Card.
- Ridurre il padding dei filtri rapidi su mobile: `px-4 sm:px-6`
- Ridurre il font del nome cliente su mobile: da `text-base md:text-lg` a `text-sm md:text-lg`
- Aggiungere `min-w-0` al wrapper della tabella per evitare overflow
- Nascondere la colonna "Codice" su mobile con `hidden sm:table-cell` (gia fatto) -- verificato OK
- Ridurre padding delle celle su mobile: aggiungere `px-2 sm:px-4` alle TableCell visibili

### 2. Provvigioni -- Ottimizzazione larghezza mobile

**File:** `src/pages/Provvigioni.tsx`

- Nascondere la colonna "Codice" su mobile: aggiungere `hidden sm:table-cell` alla TableHead e TableCell del codice
- Ridurre il padding delle celle: `px-2 sm:px-4`
- Aggiungere `overflow-hidden` al wrapper principale
- Font della provvigione: `text-xs sm:text-sm`
- Nome cliente: aggiungere `max-w-[150px] truncate` su mobile per evitare che nomi lunghi allarghino la tabella

### 3. Permesso visualizzazione Provvigioni per utente

Questa funzionalita richiede:

**Migrazione SQL:**
- Aggiungere colonna `can_view_provvigioni` (boolean, default `false`) alla tabella `user_agents` -- No, meglio una tabella/colonna dedicata per utente, non per agente.
- Aggiungere colonna `can_view_provvigioni` (boolean, default `false`) alla tabella `user_roles`.
- Policy RLS: gli utenti possono leggere il proprio record, gli admin possono aggiornare qualsiasi record.

**File:** `src/pages/GestioneUtenti.tsx`
- Per ogni utente non-admin, mostrare un Checkbox con label "Visualizza Provvigioni"
- Al cambio della spunta, aggiornare il campo `can_view_provvigioni` nella tabella `user_roles` tramite una edge function (dato che le RLS sulla tabella `user_roles` bloccano update diretti)

**File:** `supabase/functions/toggle-provvigioni/index.ts` (nuovo)
- Edge function che riceve `{ user_id, enabled }` e aggiorna `user_roles.can_view_provvigioni` usando il service role key
- Verifica che chi chiama sia admin

**File:** `src/contexts/AuthContext.tsx`
- Caricare anche `can_view_provvigioni` dal record `user_roles` dell'utente corrente
- Esporre `canViewProvvigioni` nel contesto

**File:** `src/components/AppSidebar.tsx`
- Condizionare la voce "Provvigioni" nel menu: visibile solo se `role === 'admin'` oppure `canViewProvvigioni === true`

**File:** `src/pages/Provvigioni.tsx`
- Aggiungere un controllo: se l'utente non ha il permesso, mostrare un messaggio "Accesso non consentito"

**File:** `src/App.tsx`
- Nessuna modifica necessaria alla route, il controllo avviene dentro il componente

### 4. Email utente nella sidebar

**File:** `src/components/AppSidebar.tsx`
- Sopra il pulsante "Esci" nel `SidebarFooter`, mostrare l'email dell'utente loggato
- Usare `useAuth()` per accedere a `user.email`
- Stile: testo piccolo `text-xs text-muted-foreground truncate` con `px-3 py-1`

### Dettagli tecnici

**Migrazione SQL:**
```sql
ALTER TABLE public.user_roles 
ADD COLUMN can_view_provvigioni boolean NOT NULL DEFAULT false;
```

**Edge function `toggle-provvigioni`:**
- Metodo POST, body: `{ user_id: string, enabled: boolean }`
- Verifica che il chiamante sia admin tramite `has_role`
- Aggiorna `user_roles SET can_view_provvigioni = enabled WHERE user_id = user_id`
- Usa il service role key per bypassare le RLS

**AuthContext:**
- Nella query di `loadRole`, selezionare anche `can_view_provvigioni`
- Aggiungere `canViewProvvigioni: boolean` all'interfaccia `AuthContextType`
- Default `false`, impostato a `true` solo se il campo lo indica oppure se l'utente e admin

**GestioneUtenti -- Checkbox:**
- Per ogni utente con ruolo diverso da "admin", mostrare sotto gli agenti assegnati un `Checkbox` con label "Può visualizzare provvigioni"
- Lo stato iniziale viene caricato dalla edge function `list-users` (che dovra essere aggiornata per restituire anche `can_view_provvigioni`)
- Al toggle, chiamare `toggle-provvigioni`

**Edge function `list-users` -- Aggiornamento:**
- Aggiungere il campo `can_view_provvigioni` ai dati restituiti per ogni utente, leggendo dalla tabella `user_roles`

**Riepilogo file modificati:**
1. `src/pages/Anagrafiche.tsx` -- fix larghezza mobile
2. `src/pages/Provvigioni.tsx` -- fix larghezza mobile + controllo accesso
3. `src/pages/GestioneUtenti.tsx` -- checkbox permesso provvigioni
4. `src/components/AppSidebar.tsx` -- email utente + condizione menu provvigioni
5. `src/contexts/AuthContext.tsx` -- esporre `canViewProvvigioni`
6. `supabase/functions/toggle-provvigioni/index.ts` -- nuova edge function
7. `supabase/functions/list-users/index.ts` -- aggiungere campo `can_view_provvigioni`
8. Migrazione SQL: aggiungere colonna `can_view_provvigioni` a `user_roles`

