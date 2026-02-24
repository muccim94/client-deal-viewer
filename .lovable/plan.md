

## Modifiche alla pagina Anagrafica Cliente

### 1. Inversione dell'ordine: Card Fatturato e Tabelle mensili

Attualmente l'ordine nella pagina e':
1. Card Riepilogo Fatturato + Scheda Anagrafica (griglia 2 colonne)
2. Grafico Fatturato per Marchio
3. Tabelle mensili (Fogliani 2026 vs 2025, ecc.)

La card "Riepilogo Fatturato" verra' spostata **sotto** le tabelle mensili, e le tabelle mensili saliranno al posto della card riepilogo fatturato (subito dopo la Scheda Anagrafica e il grafico).

Nuovo ordine:
1. Scheda Anagrafica (card singola, larghezza piena)
2. Tabelle mensili (2026 vs 2025) -- spostate in alto
3. Grafico Fatturato per Marchio
4. Card Riepilogo Fatturato -- spostata in basso

### 2. Tabelle mensili piu' leggibili

Le tabelle mensili verranno rese piu' grandi e leggibili:
- **Font size**: da `text-xs` a `text-sm` per il corpo e `text-sm` per l'header
- **Padding**: da `py-1 px-3` a `py-2 px-4` per dare piu' respiro alle righe
- **Header della card**: da `text-sm` a `text-base`
- **Footer totale**: da `text-xs` a `text-sm`

### Dettagli tecnici

| File | Modifica |
|---|---|
| `src/pages/ClienteDettaglio.tsx` | Riordinare le sezioni (tabelle su, card fatturato giu'); aumentare dimensioni font e padding nelle tabelle mensili |

