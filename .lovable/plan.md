

## Piano: Sistema di Reportistica Cliente

### Obiettivo
Aggiungere nella scheda cliente (ClienteDettaglio) due nuove sezioni:
1. **Referenti** — persone di riferimento del cliente (nome, ruolo, telefono, email)
2. **Report Visite/Chiamate** — registro degli incontri con data, tipo (visita/chiamata), argomenti trattati

### Database — 2 nuove tabelle

**`cliente_referenti`**
| Colonna | Tipo | Note |
|---------|------|-------|
| id | uuid PK | gen_random_uuid() |
| codice_cliente | text NOT NULL | codice del cliente |
| nome | text NOT NULL | nome del referente |
| ruolo | text | es. "Titolare", "Responsabile acquisti" |
| telefono | text | |
| email | text | |
| created_at | timestamptz | now() |
| created_by | uuid NOT NULL | auth.uid() |

**`cliente_report`**
| Colonna | Tipo | Note |
|---------|------|-------|
| id | uuid PK | gen_random_uuid() |
| codice_cliente | text NOT NULL | codice del cliente |
| data_report | date NOT NULL | data dell'incontro/chiamata |
| tipo | text NOT NULL | "visita" o "chiamata" |
| oggetto | text | titolo/argomento principale |
| note | text | dettagli dell'incontro |
| created_at | timestamptz | now() |
| created_by | uuid NOT NULL | auth.uid() |

RLS su entrambe: admin accesso completo, utenti standard vedono solo i clienti associati ai propri agenti.

### Frontend — Nuovi componenti

1. **`ClienteReferenti.tsx`** — Card con lista referenti, pulsante "Aggiungi referente", dialog per inserimento/modifica. Ogni referente mostra nome, ruolo, telefono (link tel:) e email (link mailto:). Admin può aggiungere/modificare/eliminare.

2. **`ClienteReport.tsx`** — Card con lista report ordinati per data (più recenti prima). Ogni report mostra data, tipo (badge colorato visita/chiamata), oggetto e note. Pulsante "Nuovo report" apre un dialog con campi: data, tipo (select visita/chiamata), oggetto, note (textarea). Admin può aggiungere/modificare/eliminare.

3. **Integrazione in `ClienteDettaglio.tsx`** — Le due nuove card vengono inserite dopo la Scheda Anagrafica, prima delle tabelle mensili.

### Dettagli tecnici
- Query dirette con Supabase client (no RPC necessaria per queste tabelle semplici)
- `useQuery` + `useMutation` con react-query per cache e invalidazione
- Dialog di inserimento/modifica con form validati
- Responsive: su mobile le card occupano tutta la larghezza

