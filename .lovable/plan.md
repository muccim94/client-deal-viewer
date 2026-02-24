## Modifiche alla pagina Marchi del Cliente

### 1. Font piu' grande (+20%)

Il font della tabella passera' da `text-[0.9375rem]` (15px) a `text-[1.125rem]` (18px, +20%).

### 2. Colonne piu' vicine (-15%)

Il padding orizzontale delle celle passera' da `px-2` (8px) a `px-1.5` (6px), una riduzione del 25% che avvicina le colonne.

### 3. Riordino colonne

L'ordine attuale e': Marchio | Anno Precedente | Anno Corrente | Var. %

Il nuovo ordine sara': **Marchio | Anno Corrente | Progr. Anno Prec. (nuova) | Anno Precedente | Var. %**

La colonna del fatturato corrente (es. 2026) viene spostata subito dopo il marchio.

### 4. Nuova colonna "Progressivo Anno Precedente"

Tra le due colonne di fatturato viene aggiunta una colonna che mostra il **fatturato progressivo del 2025** calcolato fino allo stesso mese massimo disponibile nei dati dell'anno corrente. Ad esempio, se i dati 2026 arrivano fino a marzo, la colonna mostrera' il totale 2025 solo per gennaio-febbraio-marzo.

Questo permette un confronto piu' equo tra i due anni.

### Dettagli tecnici


| File                          | Modifica                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/ClienteMarchi.tsx` | Calcolare il mese massimo dell'anno corrente dai dati; nel `useMemo` dei marchi aggiungere il campo `progressivo` (somma anno precedente filtrata per mesi <= meseMax); aggiungere `"progressivo"` al tipo `SortKey`; riordinare le colonne nella tabella (header, body, footer); aumentare font a `text-[1.125rem]`; ridurre padding a `px-1.5` |


### Esempio layout tabella

```text
Marchio | 2026      | Progr. 2025 | totale 2025 | Var. %
LEG     | € 2.500   | € 1.800     | € 3.200     | +12.5%
BEG     | € 900     | € 600       | € 1.100     | -8.2%
```