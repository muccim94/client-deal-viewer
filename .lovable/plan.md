## Modifiche alla pagina Marchi globale

### 1. Raggruppamento marchi per famiglia (prime 3 lettere)

I marchi verranno raggruppati per famiglia usando le **prime 3 lettere** del codice marchio (case-insensitive, convertito in uppercase). Esempi:

- `SNR`, `SNRAH`, `SNR50` -> famiglia **SNR**
- `*PR`, `*PR99` -> famiglia **PR**
- `CV.` rimane **CV.**
- `FV.` rimane **FV.**

Il raggruppamento avviene lato client dopo aver ricevuto i dati dal backend.

### 2. Nuova colonna "Progressivo Anno Precedente"

Il backend verra' aggiornato per calcolare anche il **fatturato progressivo** dell'anno precedente (YTD): somma dell'anno precedente limitata ai mesi disponibili nell'anno corrente.

### 3. Riordino colonne e calcolo Var. %

Nuovo ordine: **Marchio | Fatt. 2026 | Progr. 2025 | Var. % | Totale 2025**

La Var. % confrontera' il fatturato corrente con il **progressivo** dell'anno precedente.

4 AUMENTA IL FONT DEL 20% ED AVVICINA LE COLONNE DEL 15% 

&nbsp;

### Dettagli tecnici


| File                       | Modifica                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database migration**     | Aggiornare la funzione `get_marchi_stats` per calcolare il mese massimo dell'anno corrente e restituire anche `fattPrevYearYTD` (progressivo anno precedente limitato a quei mesi) per ogni marchio                                                                                                                       |
| `**src/pages/Marchi.tsx**` | Aggiungere funzione `getFamiglia` che estrae le prime 3 lettere (uppercase); nel `useMemo` dei brands, raggruppare per famiglia sommando `fattCurrentYear`, `fattPrevYear` e il nuovo `fattPrevYearYTD`; aggiungere campo `fattPrevYearYTD` all'interfaccia `BrandRow`; calcolare Var. % come `(corrente - progressivo) / |


### Layout finale tabella

```text
Marchio | Fatt. 2026 | Progr. 2025 | Var. %  | Totale 2025
SNR     | EUR 5.000  | EUR 3.200   | +56.3%  | EUR 7.800
*PR     | EUR 1.200  | EUR 900     | +33.3%  | EUR 2.100
CV.     | EUR 800    | EUR 600     | +33.3%  | EUR 1.000
```

### Esempio di raggruppamento

```text
Prima:                              Dopo:
SNR    -> EUR 2.000                SNR    -> EUR 5.000 (somma SNR + SNRAH + SNR50)
SNRAH  -> EUR 1.500
SNR50  -> EUR 1.500
*PR    -> EUR 800                  *PR    -> EUR 1.200 (somma *PR + *PR99)
*PR99  -> EUR 400
```