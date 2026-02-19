## Sezione Incentivazioni nella Scheda Cliente

### Obiettivo

Aggiungere una card che porta ad una pagina interna all'anagrafica "Incentivazioni" in alto alla pagina `/anagrafiche/:codice`  alla destra della card overview cliente, allinterno della quale possiamo di:

1. Creare una nuova lettera di incentivazione con tabella di scaglioni editabile (calcolo in tempo reale)
2. Salvare le lettere approvate come storico persistente nel database
3. Consultare le lettere salvate in precedenza

---

### Struttura della tabella incentivazione (da CSV/immagine)

La tabella ha 10 righe di scaglioni, ciascuna con:

- **Scaglione di fatturato** (€, input numerico)
- **Premio % per step** (%, input numerico)
- **Importo premio x scaglione** (calcolato automaticamente: scaglione × percentuale)

In fondo alla tabella:

- **Totale fatturato** = somma di tutti gli scaglioni compilati
- **Tot premi liquidati** = somma di tutti gli importi premio
- **Incidenza** = tot premi / totale fatturato × 100

---

### Modifiche tecniche

#### 1. Nuova tabella database: `cliente_incentivazioni`

```sql
CREATE TABLE public.cliente_incentivazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codice_cliente text NOT NULL,
  nome_cliente  text NOT NULL,
  anno          integer NOT NULL,
  note          text,
  righe         jsonb NOT NULL,   -- array di 10 scaglioni [{fatturato, percentuale}]
  totale_fatturato  numeric NOT NULL,
  totale_premi      numeric NOT NULL,
  incidenza         numeric NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid NOT NULL
);
```

**RLS policies:**

- SELECT: autenticato (admin vede tutto, agente vede solo i clienti assegnati — ma in pratica le incentivazioni sono per admin, quindi solo admin)
- INSERT/UPDATE/DELETE: solo admin

#### 2. Nuovo componente: `src/components/cliente/Incentivazioni.tsx`

Componente autonomo che riceve `codice` e `nomeCliente` come props. Contiene:

**Stato locale:**

```ts
const [righe, setRighe] = useState<Array<{fatturato: number, percentuale: number}>>( Array(10).fill({fatturato: 0, percentuale: 0}) )
const [anno, setAnno] = useState(new Date().getFullYear())
const [note, setNote] = useState("")
const [saving, setSaving] = useState(false)
```

**Calcoli derivati (in tempo reale):**

```ts
const righeCalcolate = righe.map(r => ({
  ...r,
  premio: r.fatturato * (r.percentuale / 100)
}))
const totaleFatturato = righeCalcolate.reduce((s, r) => s + r.fatturato, 0)
const totalePremi = righeCalcolate.reduce((s, r) => s + r.premio, 0)
const incidenza = totaleFatturato > 0 ? (totalePremi / totaleFatturato) * 100 : 0
```

**Layout della tabella editabile:**

```text
┌──────┬─────────────────────────┬──────────────────┬──────────────────────────┐
│  #   │  SCAGLIONI DI FATTURATO │ PREMIO % PER STEP│ IMPORTO PREMIO X SCAGL.  │
├──────┼─────────────────────────┼──────────────────┼──────────────────────────┤
│  1   │  [ input €           ]  │  [ input %     ] │  € 0,00  (calcolato)     │
│  2   │  [ input €           ]  │  [ input %     ] │  € 0,00                  │
│ ...  │  ...                    │  ...             │  ...                     │
│ 10   │  [ input €           ]  │  [ input %     ] │  € 0,00                  │
├──────┴─────────────────────────┼──────────────────┼──────────────────────────┤
│  TOTALE FATT.: €200.000        │ TOT PREMI: €12k  │ INCIDENZA: 6,00%         │
└────────────────────────────────┴──────────────────┴──────────────────────────┘
```

**Storico lettere salvate:**
Sotto la tabella di inserimento, una lista collassabile delle lettere già salvate per quel cliente, con possibilità di espanderle per vedere i dettagli.

**Azioni:**

- Pulsante "Salva Lettera" → insert nel DB + refresh lista storico
- Ogni lettera salvata mostra: anno, data creazione, note, totale fatturato, tot premi, incidenza
- Pulsante "Elimina" su ogni lettera (solo admin)

#### 3. Integrazione in `src/pages/ClienteDettaglio.tsx`

Importare e aggiungere `<IncentivazionI codice={codice} nomeCliente={clientName} />` in fondo alla lista delle card, dopo le tabelle mensili.

Il componente gestisce autonomamente il fetch e il salvataggio tramite Supabase direttamente (senza passare per DataContext, che è orientato ai sales_records).

---

### Flusso dati

```text
ClienteDettaglio
    └── <Incentivazioni codice="035826" nomeCliente="..." />
            │
            ├─ fetch storico → supabase.from("cliente_incentivazioni")
            │                   .select("*").eq("codice_cliente", codice)
            │
            ├─ Tabella editabile (10 righe, calcolo live)
            │   └─ onChange → aggiorna stato locale → ricalcola totali
            │
            └─ "Salva Lettera" → insert → refresh storico
```

---

### File da creare/modificare


| File                                        | Operazione                                     |
| ------------------------------------------- | ---------------------------------------------- |
| `supabase/migrations/...sql`                | CREATE TABLE `cliente_incentivazioni` + RLS    |
| `src/components/cliente/Incentivazioni.tsx` | Nuovo componente (tabella editabile + storico) |
| `src/pages/ClienteDettaglio.tsx`            | Aggiungere `<Incentivazioni>` in fondo         |


**Nessuna modifica** a DataContext, AuthContext o tabelle esistenti.