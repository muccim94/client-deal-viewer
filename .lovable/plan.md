## Miglioramenti alla pagina Anagrafiche

### 1. Spostare i filtri rapidi dentro la barra di ricerca

Attualmente i filtri rapidi ("Clienti in perdita", "Sotto i 5k", "Top 10 clienti") sono in una riga separata sotto l'header. Verranno spostati nella stessa riga del selettore agente e della barra di ricerca, integrandoli visivamente come parte dell'area filtri

### 2. Riferimento corretto nelle intestazioni colonne

Le intestazioni della tabella mostreranno sempre gli anni esplicitamente:

- `Fatt. 2026` (anno corrente YTD)
- `Fatt. 2025 YTD` (anno precedente, stesso periodo)
- `Fatt. 2025` (anno precedente, totale annuo) -- colonna nascondibile

I filtri rapidi continueranno a confrontare il fatturato 2026 con il fatturato 2025 YTD, come gia' implementato.

### 3. Toggle per mostrare/nascondere la colonna "Fatt. 2025" (totale annuo)

Verra' aggiunto uno switch (toggle) nell'area filtri che permette di nascondere/mostrare l'ultima colonna (`fattPrevYear`). Questo rende la tabella piu' compatta e leggibile quando non serve il dato annuale completo.

### Dettagli tecnici

#### File: `src/pages/Anagrafiche.tsx`

**Nuovo stato:**

- `showFullYear` (boolean, default `true`): controlla la visibilita' della colonna "Fatt. 2025"

**Layout modificato nel CardHeader:**

- Prima riga: titolo conteggio clienti + selettore agente + barra di ricerca (invariato)
- Seconda riga (dentro CardHeader, prima della tabella): filtri rapidi (pill buttons) + toggle "Fatt. 2025" con label e componente Switch

**Rimozione:** la `<div>` separata con `border-b` che contiene i filtri viene eliminata; i filtri si spostano nel CardHeader.

**Colonna "Fatt. 2025":**

- Il `<TableHead>` e il `<TableCell>` corrispondenti verranno condizionati a `showFullYear`, mostrandosi solo quando il toggle e' attivo.


| File                        | Modifica                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `src/pages/Anagrafiche.tsx` | Spostare filtri nel header, aggiungere toggle per colonna Fatt. anno precedente totale |
