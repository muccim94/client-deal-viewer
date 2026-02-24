

## Modifiche alla pagina Dettaglio Cliente

### 1. Invertire le due card nella griglia

Attualmente nella griglia a 2 colonne l'ordine e':
- Sinistra: **Scheda Anagrafica**
- Destra: **Riepilogo Fatturato**

Verranno invertite:
- Sinistra: **Riepilogo Fatturato**
- Destra: **Scheda Anagrafica**

### 2. Avvicinare le colonne della tabella del 15%

Il padding orizzontale delle celle passera' da `px-2` (8px) a `px-1.5` (6px), una riduzione di circa il 25% che avvicina sensibilmente le colonne.

### 3. Aumentare il font della tabella del 10%

Il font della tabella passera' da `text-[0.96rem]` (~15.4px) a `text-[1.056rem]` (~16.9px, +10%). Lo stesso aumento sara' applicato al footer.

### Dettagli tecnici

| File | Modifica |
|---|---|
| `src/pages/ClienteDettaglio.tsx` | Scambiare le due Card nella griglia (righe 163-221); ridurre padding celle da `px-2` a `px-1.5`; aumentare font tabella da `text-[0.96rem]` a `text-[1.056rem]` |

