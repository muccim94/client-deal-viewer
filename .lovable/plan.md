## Modifiche alla pagina Dettaglio Cliente

### 1. Grafico a torta interattivo per "Fatturato per Marchio"

La sezione attuale con i badge viene sostituita da un grafico a torta (Recharts, gia installato) che mostra la distribuzione del fatturato per marchio del cliente.

- Cliccando su una fetta del grafico (o sulla legenda), si naviga a una nuova pagina dedicata `/anagrafiche/:codice/marchi` che mostra tutti i marchi del cliente con il confronto anno corrente vs anno precedente.

### 2. Nuova pagina: Marchi per Cliente (`/anagrafiche/:codice/marchi`)

Una pagina dedicata accessibile dal grafico a torta che mostra:

- Intestazione con nome cliente e pulsante "Torna al dettaglio"
- Tabella completa di tutti i marchi del cliente con colonne: Marchio, Fatturato anno corrente, Fatturato anno precedente, Variazione %,
- Ordinamento e ricerca come nella pagina Marchi globale
- I dati vengono calcolati dai record gia disponibili tramite la RPC `get_cliente_detail`

### 3. Tabella fatturato annuale compatta (stile immagine allegata)

La tabella mensile di confronto viene ridisegnata per essere piu compatta:

- Righe piu strette con padding ridotto
- Stile pulito con bordi sottili e sfondo alternato
- Colonne: Mese | Anno precedente | Anno corrente | Delta %
- Delta % con colore verde per positivo, rosso per negativo, trattino per invariato
- Riga totale in fondo con riepilogo (differenza assoluta, variazione %)
- Font piu piccolo e layout condensato

### Dettagli tecnici

**File da creare:**

- `src/pages/ClienteMarchi.tsx` -- nuova pagina con tabella marchi per cliente

**File da modificare:**

- `src/pages/ClienteDettaglio.tsx` -- sostituire badge con PieChart Recharts, rendere tabella compatta
- `src/App.tsx` -- aggiungere route `/anagrafiche/:codice/marchi`

**Nessuna modifica al database** -- i dati vengono gia forniti dalla RPC `get_cliente_detail` esistente.