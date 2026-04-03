

## Fix: Confronto anno precedente non si aggiorna con il range mesi selezionato

### Problema
Nella RPC `get_provvigioni_chart`, la variabile `v_max_month` viene calcolata come l'ultimo mese con dati nell'anno corrente (es. Marzo = 3). Quando l'utente seleziona un range più ampio (es. Gennaio-Ottobre), la riga:
```sql
IF p_mese_a IS NOT NULL AND p_mese_a < v_max_month THEN
    v_max_month := p_mese_a;
END IF;
```
riduce `v_max_month` ma non lo aumenta mai oltre il mese massimo con dati. Quindi il totale dell'anno precedente resta sempre limitato a Marzo.

### Soluzione
Modificare la logica: quando l'utente specifica `p_mese_a`, usare quel valore direttamente come limite superiore per **entrambi** gli anni. Il `v_max_month` (ultimo mese con dati) diventa solo il fallback quando nessun "mese A" è selezionato.

### Modifica: migration SQL per aggiornare `get_provvigioni_chart`
- Sostituire il blocco IF con: `IF p_mese_a IS NOT NULL THEN v_max_month := p_mese_a; END IF;`
- Questo fa sì che selezionando Gen-Ott, i totali di entrambi gli anni vengano calcolati su Gen-Ott (dati mancanti = 0)

Una sola modifica, una riga nella RPC.

