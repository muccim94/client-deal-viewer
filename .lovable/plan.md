

## Fix: Clienti duplicati nella card Top 10

### Problema
La query SQL che genera i Top 10 Clienti raggruppa per `(nome_cliente, codice_cliente)`. Tre clienti hanno lo stesso codice ma nomi leggermente diversi nei dati (es. "ARCHIMEDE PLUS S.N.C. DI" vs "ARCHIMEDE PLUS SRL"), causando righe duplicate.

### Soluzione
Modificare la CTE `top_clienti_base` nella funzione `get_dashboard_stats` per raggruppare solo per `codice_cliente` e prendere il nome più recente con `MAX(nome_cliente)`.

### Dettaglio tecnico

Migrazione SQL — aggiornamento della funzione `get_dashboard_stats`:

```sql
-- Nella CTE top_clienti_base, cambiare:
--   GROUP BY s.nome_cliente, s.codice_cliente
-- in:
--   GROUP BY s.codice_cliente
-- e usare MAX(s.nome_cliente) as name
```

Nessuna modifica al frontend necessaria.

