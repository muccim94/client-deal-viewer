

## Piano: Widget grafico provvigioni con filtri stile Marchi

### Cosa faremo

Aggiungere alla pagina Provvigioni un widget identico a quello della pagina Marchi: una card con **Totale Provvigioni**, variazione % anno precedente, e un **AreaChart** che mostra l'andamento mensile (anno corrente vs anno precedente). I filtri verranno sostituiti con lo stesso layout della pagina Marchi: toggle azienda, selettori periodo Da/A, toggle agenti.

### Modifiche

#### 1. Nuova RPC `get_provvigioni_chart`
Creare una funzione database che restituisce:
- **totale anno corrente** (nel range mesi selezionato)
- **totale progressivo anno precedente** (stesso range)
- **monthly_totals**: array con `mese`, `provv_current`, `provv_prev` per tutti i 12 mesi
- Filtri: `p_azienda`, `p_mese_da`, `p_mese_a`, `p_agente`
- Stessa logica di sicurezza (admin vede tutto, agenti solo i propri)

#### 2. Riscrittura filtri in `Provvigioni.tsx`
Sostituire i 3 Select attuali con il layout identico a Marchi:
- **Sinistra**: toggle Fogliani / Futurtec
- **Centro**: selettori "Da" / "A" mese
- **Destra**: toggle agenti (o Select se >5)
- Rimuovere il filtro anno (si usa anno corrente come default, anno precedente per confronto)

#### 3. Widget grafico in `Provvigioni.tsx`
Card con:
- Titolo "Totale Provvigioni", valore formattato, sottotitolo "vs X prog. {anno-1}"
- Badge variazione % (verde/rosso)
- AreaChart con linea verde (anno corrente) e linea tratteggiata (anno precedente)
- Stessi stili, gradients e tooltip della pagina Marchi

#### 4. Tabella esistente
Rimane invariata sotto il widget, alimentata dalla RPC `get_provvigioni_grouped` esistente (aggiornata con i nuovi parametri `p_mese_da`/`p_mese_a` al posto di `p_mese`).

### Dettagli tecnici

- La RPC `get_provvigioni_grouped` verrà aggiornata per accettare `p_mese_da` e `p_mese_a` invece di `p_mese`, e un parametro `p_agente`
- Riuso dei componenti Recharts già importati nel progetto (`AreaChart`, `Area`, `ResponsiveContainer`, etc.)
- Il `filterAnno` viene rimosso dall'UI — si usa `EXTRACT(YEAR FROM CURRENT_DATE)` lato server
- Il mese "A" di default viene calcolato come il mese massimo con dati disponibili

