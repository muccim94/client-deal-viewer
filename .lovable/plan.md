

## Modifiche alla pagina Marchi del Cliente

### 1. Raggruppamento marchi per famiglia

Attualmente ogni marchio (es. `LEG`, `LEG40`, `LEG50`) viene mostrato come riga separata. Con questa modifica, i marchi verranno raggruppati per **famiglia** estraendo solo le lettere iniziali (la parte alfabetica del codice marchio). Ad esempio:
- `LEG`, `LEG40`, `LEG50` -> famiglia **LEG**
- `BEG`, `BEG10` -> famiglia **BEG**
- `CV.` rimane **CV.**

I fatturati di tutti i marchi della stessa famiglia verranno sommati in un'unica riga.

**Logica di estrazione famiglia**: si prende la parte iniziale del codice marchio composta solo da lettere e punti (regex: `/^[A-Za-z.*]+/`), rimuovendo eventuali suffissi numerici.

### 2. Font piu' grande (+25%)

Il font della tabella passera' da `text-xs` (12px) a `text-[0.9375rem]` (~15px, +25%). Lo stesso aumento si applica a header, corpo e footer.

### 3. Colonne piu' vicine (-20%)

Il padding orizzontale delle celle passera' da `px-3` (12px) a `px-2` (8px), una riduzione di circa il 33% che avvicina sensibilmente le colonne.

### Dettagli tecnici

| File | Modifica |
|---|---|
| `src/pages/ClienteMarchi.tsx` | Aggiungere funzione di estrazione famiglia dal codice marchio; modificare il `useMemo` dei marchi (righe 44-58) per raggruppare per famiglia invece che per marchio singolo; cambiare font tabella da `text-xs` a `text-[0.9375rem]`; ridurre padding da `px-3` a `px-2` |

### Esempio di raggruppamento

```text
Prima:                          Dopo:
LEG    -> € 1.000              LEG    -> € 2.500 (somma LEG + LEG40 + LEG50)
LEG40  -> € 800
LEG50  -> € 700
BEG    -> € 500                BEG    -> € 900 (somma BEG + BEG10)
BEG10  -> € 400
```

