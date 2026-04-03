

## Fix: Stesso bug `v_max_month` su `get_marchi_stats`

### Problema
La funzione `get_marchi_stats` ha la stessa logica restrittiva:
```sql
IF p_mese_a IS NOT NULL AND p_mese_a < v_max_month THEN
    v_max_month := p_mese_a;
END IF;
```
Quando l'utente seleziona un range più ampio (es. Gen-Ott), il progressivo anno precedente nella tabella marchi resta limitato al mese massimo con dati dell'anno corrente.

### Soluzione
Una migration SQL che ricrea `get_marchi_stats` con la stessa fix applicata a `get_provvigioni_chart`:

```sql
IF p_mese_a IS NOT NULL THEN
    v_max_month := p_mese_a;
END IF;
```

Questo aggiorna sia il widget/KPI sia la tabella marchi, poiché entrambi derivano dalla stessa RPC. La colonna `fatt_prev_ytd` (Progressivo anno precedente) nella CTE `brands` usa già `v_max_month` come limite, quindi si aggiornerà automaticamente.

### Impatto
- **Widget grafico**: i totali di confronto si allineano al range selezionato
- **Tabella marchi**: la colonna "Progr." riflette lo stesso range di mesi
- **Nessuna modifica frontend**: la pagina Marchi già passa `p_mese_a` correttamente

