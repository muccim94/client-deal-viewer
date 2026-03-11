## Riprogettazione Dashboard

### Layout a 2 colonne (desktop)

**Colonna sinistra (~50%)**:

1. **Card "Totale Fatturato"** — importo grande (€1.47M), badge var% YoY, sottotitolo "vs € X prog. anno prec.", grafico `AreaChart` con anno corrente (solido verde, termina all'ultimo mese con dati) e anno precedente (tratteggiato grigio)
2. **Card "Top 10 Clienti per Fatturato"** — tabella invariata con trend icons

**Colonna destra (~50%)**:

1. **3 KPI cards** in riga — Fatturato Totale (€), Clienti Unici, Marchi (rimossa "Media per Cliente")
2. **Card "Distribuzione Vendite per Marchio"** — PieChart (invariato)

Su mobile: layout single-column con ordine KPI → Fatturato chart → Clienti → Pie → Bar.

### Modifiche backend (RPC)

Aggiornare `get_dashboard_stats` per restituire `monthly_totals`:

```sql
monthly_totals AS (
  SELECT mese,
    SUM(CASE WHEN anno = v_anno THEN imponibile ELSE 0 END) as fatt_current,
    SUM(CASE WHEN anno = v_prev_anno THEN imponibile ELSE 0 END) as fatt_prev
  FROM sales_records
  WHERE ... filters ...
    AND anno IN (v_anno, v_prev_anno)
  GROUP BY mese ORDER BY mese
)
```

Aggiungere al JSON: `'monthly_totals', (SELECT json_agg(...) FROM monthly_totals)` e `'totale_prev_ytd'` per il sottotitolo "vs prog. anno prec."

### Modifiche frontend

**File: `src/pages/Dashboard.tsx**`:

- Import `AreaChart, Area, BarChart, Bar, LineChart, XAxis, YAxis, CartesianGrid` da recharts
- Layout: `lg:grid-cols-2` con colonna sinistra (Fatturato + Top10) e destra (KPI + Pie + Bar)
- `useMemo` per `chartData` con logica "current = undefined per mesi > ultimo con dati" (stessa di Marchi.tsx)
- Componente BarChart orizzontale per i dati `marchiPie`
- KPI ridotte a 3 cards in riga `grid-cols-3`

### File coinvolti

- `src/pages/Dashboard.tsx` — riscrittura layout
- Nuova migrazione SQL — aggiornamento `get_dashboard_stats`