

## Dettaglio marchi per mese cliccabile

### Cosa cambia

Nella scheda cliente, ogni riga mese nella tabella mensile diventa cliccabile. Cliccando su un mese si espande una sezione sotto la riga che mostra il dettaglio del venduto quel mese, suddiviso per marchio, con importo anno corrente e precedente.

### Implementazione in `src/pages/ClienteDettaglio.tsx`

1. **Stato per riga espansa**: aggiungere uno stato `expandedRow` di tipo `{azienda: string, mese: number} | null` per tracciare quale riga e' espansa.

2. **Riga cliccabile**: ogni `<tr>` della tabella mensile diventa cliccabile (`cursor-pointer`, hover). Al click si toglie l'espansione (apri/chiudi).

3. **Riga di dettaglio espansa**: sotto la riga cliccata, inserire un `<tr>` con `<td colSpan={4}>` che contiene una mini-tabella con:
   - Colonne: Marchio | Importo anno corrente | Importo anno precedente
   - Dati filtrati da `clientRecords` per aziendaNome + mese + anno (corrente e precedente)
   - Ordinati per importo decrescente
   - Un indicatore visivo (chevron) sulla riga per indicare che e' espandibile

4. **Calcolo dati marchio per mese**: usare `useMemo` o calcolo inline filtrando `clientRecords` per `aziendaNome === name && mese === m.mese` raggruppando per marchio.

5. **Animazione**: la riga di dettaglio appare con transizione semplice (o senza, per semplicita').

### File coinvolti
- `src/pages/ClienteDettaglio.tsx`

### Nessuna modifica al database

