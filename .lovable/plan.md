

## Gestione Utenti - Miglioramenti

### Problemi identificati

1. **Dropdown agenti incompleto**: Nel database esistono 2 agenti (`FO_FO75` e `FO_FO77`), ma il selettore ne mostra solo uno. Il problema potrebbe essere legato alla query che recupera gli agenti distinti dalla tabella `sales_records` -- verificheremo e correggeremo il fetch.

2. **Badge ruolo mancante**: Attualmente la card utente mostra solo l'email. Serve un badge che indichi se l'utente e "Admin" o "User".

3. **Ordinamento utenti**: Gli admin devono apparire per primi nella lista.

---

### Piano di implementazione

#### 1. Aggiungere il ruolo utente ai dati caricati

- Modificare `GestioneUtenti.tsx` per fare un fetch anche dalla tabella `user_roles` (gia accessibile tramite RLS).
- Associare ogni utente al suo ruolo (`admin` / `user`).

#### 2. Badge ruolo accanto all'email

- Nella `CardHeader` di ogni utente, aggiungere un `Badge` colorato:
  - **Admin**: badge con variante `default` (colore primario)
  - **User**: badge con variante `secondary`

#### 3. Ordinamento: admin per primi

- Dopo aver caricato utenti e ruoli, ordinare la lista mettendo gli admin in cima, poi gli utenti normali (ordinati per email).

#### 4. Verifica dropdown agenti

- Controllare che la query `SELECT agente FROM sales_records ORDER BY agente` restituisca tutti i valori distinti. Se il problema e nel codice che applica `new Set()`, correggerlo per assicurare che entrambi `FO_FO75` e `FO_FO77` vengano mostrati.

---

### Dettagli tecnici

**File modificato**: `src/pages/GestioneUtenti.tsx`

Modifiche principali:

```text
Interfacce:
  - UserInfo: aggiungere campo "role: string"

loadData():
  - Fetch user_roles dalla tabella per ottenere il ruolo di ogni utente
  - Merge ruoli con la lista utenti dal edge function
  - Ordinare: admin prima, poi user, poi per email

Rendering:
  - CardHeader: aggiungere Badge con il ruolo accanto all'email
  - Verificare che il dropdown agenti mostri correttamente tutti i valori
```

**Edge function `list-users`**: Alternativa -- includere il ruolo direttamente nella risposta dell'edge function (ha gia accesso admin al DB). Questo semplifica il frontend evitando una query aggiuntiva.

Approccio scelto: **modificare l'edge function** per restituire anche il ruolo, poi ordinare e visualizzare nel frontend.

