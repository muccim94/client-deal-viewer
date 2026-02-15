## Modifica Tabella Anagrafiche con Fatturato Progressivo e Icone Trend

### Obiettivo

Aggiungere alla tabella anagrafiche:

1. Una colonna "Fatt. 2025 YTD" con il fatturato progressivo dell'anno precedente (calcolato fino al mese corrente) che andra inserita tra il fatturato 2026 e la colonna fatturato 2025 per un totale di 3 valori 
2. Un'icona freccia verde (crescita) o rossa (calo) tra il codice cliente e il nome, basata sul confronto YTD 2026 vs YTD 2025 
3. togliere dalle cifre della tabella i numeri dopo "," esempio 3.358,57 sarà arrotondato a 3.358

### Layout tabella risultante (ispirato all'immagine di riferimento)

```text
Codice | Trend | Nome Cliente | Fatt. 2026 | Fatt. 2025 (YTD) | Fatt. 2025 |  >
035826   ↗       A.I.M.E. SRL   0,00 EUR         3.358 EUR       3.358 EUR    >
029831   ↘       A.P.S. DUE SRL 33.582 EUR      38.995 EUR      38.995 EUR    >
```

### 1. Migrazione SQL -- aggiornare `get_clienti_list`

La funzione attualmente restituisce `fattCurrentYear` (totale anno corrente) e `fattPrevYear` (totale anno precedente), entrambi sull'intero anno. Verra modificata per:

- Calcolare `v_current_month` dal mese corrente
- `fattCurrentYear` = somma imponibile anno corrente per mesi 1..mese_corrente (YTD corrente)
- `fattPrevYear` = somma imponibile anno precedente per mesi 1..mese_corrente (YTD precedente)

In questo modo entrambi i valori saranno progressivi e confrontabili (es. gen-feb 2026 vs gen-feb 2025), oltre ad avere un paragone su tutto il 2025

### 2. Aggiornamento UI -- `src/pages/Anagrafiche.tsx`

- Aggiungere import di `TrendingUp` e `TrendingDown` da lucide-react
- Inserire una nuova colonna tra "Codice" e "Nome Cliente" con l'icona trend:
  - `TrendingUp` verde se `fattCurrentYear >= fattPrevYear`
  - `TrendingDown` rossa se `fattCurrentYear < fattPrevYear`
- Le colonne "Fatt. 2026" e "Fatt. 2025" mostreranno i dati YTD progressivi
- Aggiornare le intestazioni per indicare che sono dati progressivi

### Dettagli tecnici

**SQL -- CTE aggiornata:**

```text
v_current_month := EXTRACT(MONTH FROM current_date)::integer;

grouped AS (
  SELECT
    codice_cliente,
    MAX(nome_cliente) as nome_cliente,
    SUM(CASE WHEN anno = v_current_year AND mese <= v_current_month THEN imponibile ELSE 0 END) as fatt_current,
    SUM(CASE WHEN anno = v_prev_year AND mese <= v_current_month THEN imponibile ELSE 0 END) as fatt_prev
  FROM filtered
  GROUP BY codice_cliente
)
```

**File modificati:**

- Migrazione SQL per `get_clienti_list`
- `src/pages/Anagrafiche.tsx` -- aggiunta colonna icona trend, dati YTD