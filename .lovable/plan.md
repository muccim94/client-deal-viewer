

## Raggruppamento marchi per famiglia (primi 3 caratteri)

### Problema
Nel dettaglio mese espanso, i marchi come LEG40, LEG71, CV.48 vengono mostrati singolarmente invece di essere raggruppati per famiglia (LEG, CV., ecc.).

### Soluzione
Applicare la stessa logica di raggruppamento per famiglia usata in `ClienteMarchi.tsx` (`getFamiglia`) a **tre punti** in `ClienteDettaglio.tsx`:

1. **Dettaglio marchi nel mese espanso** — nel calcolo `marchiDetail`, raggruppare per `getFamiglia(rec.marchio)` invece che per `rec.marchio`
2. **Grafico pie/bar "Fatturato per Marchio"** — nel `useMemo` che calcola `pieData` e `barData`, raggruppare per famiglia
3. **Aggiungere la funzione `getFamiglia`** — usare la versione con regex dal file `ClienteMarchi.tsx`: `marchio.match(/^[A-Za-z.*]+/)?.[0] ?? marchio` che estrae il prefisso alfabetico (es. LEG da LEG40, CV. da CV.48)

### File coinvolti
- `src/pages/ClienteDettaglio.tsx` — aggiungere `getFamiglia` e applicarla nei 2 punti di aggregazione (marchiDetail + pieData/barData)

### Nessuna modifica al database

