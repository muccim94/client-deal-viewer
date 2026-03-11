

## Riprogettazione Dashboard Marchi

La pagina `/marchi` verrà completamente ridisegnata per replicare il layout del mockup allegato.

### Layout (dall'alto in basso)

1. **Barra filtri** — invariata (Fogliani/Futurtec, Anno, Mese, Agente)

2. **Card "Totale Fatturato"** — grande card con:
   - Titolo "Totale Fatturato"
   - Importo totale anno corrente formattato in K/M (es. € 1,47M)
   - Badge variazione % YoY in verde/rosso
   - Area chart (recharts `AreaChart`) con 2 serie sovrapposte: anno corrente (linea solida verde) e anno precedente (linea tratteggiata grigia), asse X = mesi

3. **Card tabella famiglie marchio** — stessa struttura attuale ma:
   - Aggiunta di mini sparkline (recharts `Sparkline` via `LineChart` tiny) accanto al fatturato corrente e al progressivo
   - Colonna Var.% mostra sia la var YTD (testo colorato) sia un Badge con la var sul totale anno precedente
   - Rimossa la colonna "Totale anno precedente" separata (integrata nel badge)

4. **3 Card in fondo** in griglia 3 colonne:
   - **Marchi in crescita** — top 3 brand per var% positiva, con mini sparkline e percentuale verde
   - **Marchi in calo** — top 3 brand per var% negativa, con mini sparkline e percentuale rossa
   - **Marchi TOP (Premianti)** — marchi dalla lista Excel (VIW, DIS, IBO, INS, BTI, GEW, LEG, PHL, LDV, SNR, FOS, SIE, ABB, HAG, PHA), mostra i top 3 per fatturato corrente con freccia e valore, sotto il valore anno precedente in colore dorato

### Modifiche al backend (RPC)

Aggiornare `get_marchi_stats` per restituire anche:
- `monthly_totals`: array di `{mese, fatt_current, fatt_prev}` per il grafico principale
- `brand_monthly`: array di `{marchio, mese, fatt_current, fatt_prev}` per le sparkline (solo top 20 brand per evitare troppi dati)

### Modifiche frontend

**File: `src/pages/Marchi.tsx`** — riscrittura completa:
- Import `AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer` da recharts
- Costante `MARCHI_PREMIANTI` con i 15 codici dal file Excel (primi 3 chars: VIW, DIS, IBO, INS, BTI, GEW, LEG, PHL, LDV, SNR, FOS, SIE, ABB, HAG, PHA)
- Componente `MiniSparkline` per le sparkline inline (30x16px `LineChart` senza assi)
- Sezione "Totale Fatturato" con `AreaChart` da `monthly_totals`
- Calcolo top 3 crescita, top 3 calo, top 3 premianti dai dati brand
- 3 card bottom con layout come nel mockup

### Struttura dati aggiuntiva dal RPC

```sql
-- Aggiungere al result JSON:
'monthly_totals', (SELECT json_agg(...) FROM monthly aggregation)
'brand_monthly', (SELECT json_agg(...) FROM per-brand monthly, limited to top 20)
```

### File coinvolti
- `src/pages/Marchi.tsx` — riscrittura completa
- Nuova migrazione SQL — aggiornamento `get_marchi_stats` per monthly data

