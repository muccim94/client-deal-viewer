## Semplificazione Dashboard

### Cosa cambia

1. **Top 10 Clienti per Fatturato** -- Il grafico a barre orizzontale viene sostituito con un elenco testuale numerato: nome cliente e fatturato sotto (o a fianco), semplice e leggibile.
2. **Fatturato per Azienda** -- Il grafico viene rimosso

### Dettagli tecnici

File modificato: `src/pages/Dashboard.tsx`

- Rimuovere il `BarChart` (recharts) dalla sezione "Top 10 Clienti per Fatturato" e sostituirlo con una lista ordinata che mostra posizione, nome cliente e importo formattato sotto.
- Rimuovere il `BarChart` dalla sezione "Fatturato per Azienda" 
- Gli import inutilizzati di recharts (`BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`) verranno rimossi se non piu necessari dopo le modifiche.