

## Selezione Periodo e Restyling Filtri nella pagina Marchi

### Cosa cambia

1. **Rimuovere il filtro Anno** (Select "Anno") — non serve più, si lavora sempre sull'anno corrente vs precedente
2. **Aggiungere selezione Periodo** con due select "Da" e "A" per i mesi (es. Gennaio → Giugno). Default: da Gennaio all'ultimo mese con dati. Il periodo filtra tutto: totale fatturato, KPI cards, tabella marchi, grafico.
3. **Filtro Agente** diventa un toggle button group con lo stesso stile di Fogliani/Futurtec (rounded-lg, border, bg-muted), allineato a destra sulla stessa riga del toggle azienda.

### Layout filtri (una riga)

```text
[Fogliani | Futurtec]   [Gen→Dic periodo]   [Tutti | Agente1 | Agente2 ...]
 ← sinistra                  centro              destra →
```

In pratica:
- Riga unica flex con `justify-between`
- Sinistra: toggle Fogliani/Futurtec
- Centro: due Select compatti "Da mese" e "A mese"  
- Destra: toggle agenti (stile identico al toggle azienda), con "Tutti" come prima opzione + lista agenti. Se troppi agenti, usare un Popover/Select con lo stesso stile visivo.

### Backend (RPC `get_marchi_stats`)

Sostituire `p_anno` e `p_mese` con `p_mese_da` e `p_mese_a` (integer). La funzione:
- Filtra `kpi_filtered` con `mese BETWEEN p_mese_da AND p_mese_a` (se non null)
- Brands: anno corrente filtra `mese BETWEEN p_mese_da AND p_mese_a`, anno precedente YTD idem
- Monthly totals: restituisce sempre tutti i 12 mesi (per il grafico) ma con nota visiva sul periodo selezionato
- Mantiene la logica `v_max_month` per il YTD dell'anno precedente, limitandola anche a `p_mese_a` se specificato

### Frontend (`src/pages/Marchi.tsx`)

- Rimuovere `filterAnno` e `filterMese`
- Aggiungere `filterMeseDa` (default "1") e `filterMeseA` (default: ultimo mese con dati o "12")
- Due Select compatti inline: "Da: Gennaio" "A: Giugno"
- Filtro agente: se pochi agenti (<=5), toggle button group. Se più di 5, Select dropdown con stile simile.
- Aggiornare la chiamata RPC con i nuovi parametri `p_mese_da`, `p_mese_a`
- Rimuovere il parametro `p_anno` dalla chiamata

### File coinvolti
- **Migration SQL** — `ALTER` della funzione `get_marchi_stats` con nuovi parametri `p_mese_da`/`p_mese_a` al posto di `p_anno`/`p_mese`
- **`src/pages/Marchi.tsx`** — nuovo layout filtri, nuovi state, aggiornamento chiamata RPC

