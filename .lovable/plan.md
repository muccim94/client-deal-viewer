

## Nuova Pagina "Budget" - Target Annuali vs Fatturato Effettivo

### Panoramica

Creazione di una nuova sezione "Budget" accessibile dalla sidebar, che mostra i target mensili di fatturato per agente confrontati con il fatturato effettivo caricato nel sistema. I dati di budget per FO75 e FO77 verranno salvati nel database e visualizzati sia separatamente (per agente) sia come totale combinato.

### Dati Budget dalle immagini

**FO75**: GEN 374.374, FEB 436.070, MAR 425.142, APR 478.601, MAG 481.141, GIU 443.277, LUG 635.743, AGO 342.263, SET 452.474, OTT 427.109, NOV 518.841, DIC 484.966 -- Totale 5.500.001

**FO77**: GEN 333.533, FEB 388.499, MAR 378.763, APR 426.390, MAG 428.653, GIU 394.919, LUG 566.389, AGO 304.925, SET 403.114, OTT 380.515, NOV 462.240, DIC 432.060 -- Totale 4.900.000

### Modifiche tecniche

#### 1. Database: Nuova tabella `budget_targets`

Creare una tabella per memorizzare i target mensili per agente:

```text
budget_targets
- id (uuid, PK)
- agente (text, NOT NULL) -- es. "FO_FO75", "FO_FO77"
- anno (integer, NOT NULL)
- mese (integer, NOT NULL, 1-12)
- importo (numeric, NOT NULL)
- created_at (timestamptz, DEFAULT now())
- UNIQUE(agente, anno, mese)
```

RLS: lettura per utenti autenticati (admin + agenti assegnati), scrittura solo admin.

Migrazione che inserisce i dati di FO75 e FO77 per il 2026.

#### 2. Database: Funzione RPC `get_budget_data`

Funzione che restituisce per ogni agente e mese: il budget target e il fatturato effettivo (da `sales_records`, filtrato per azienda FO). Accetta parametri `p_anno` e `p_agente` (opzionale). Rispetta la visibilita' degli agenti (admin vede tutto, utente vede solo i propri agenti).

#### 3. Nuova pagina `src/pages/Budget.tsx`

- Filtro anno (default 2026) e filtro agente (FO75, FO77, Tutti)
- Quando "Tutti" e' selezionato: mostra una tabella unica con la somma dei budget e dei fatturati
- Quando un agente specifico e' selezionato: mostra solo i dati di quell'agente
- Tabella con colonne: Mese | Budget | Fatturato Effettivo | Delta (EUR) | Delta %
- Riga di totale in fondo
- Colori: verde se il fatturato supera il budget, rosso se inferiore
- Barra di progresso visiva per ogni mese (percentuale fatturato/budget)

#### 4. Routing e Sidebar

- **`src/App.tsx`**: Aggiungere route `/budget` con il componente Budget
- **`src/components/AppSidebar.tsx`**: Aggiungere voce "Budget" nel menu con icona `Target` da lucide-react

