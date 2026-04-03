

## Aggiunta percentuale nella card "Risorsa Utilizzata"

### Cosa cambia
Nella card "Risorsa Utilizzata" della pagina Marchi, sotto l'importo attuale verrà aggiunta una riga che mostra la percentuale rispetto al fatturato totale (es. "0,92% del fatturato").

### Dettaglio tecnico

**File: `src/pages/Marchi.tsx`**

1. Modificare la struttura dati dei KPI per includere un campo opzionale `subtitle` calcolato come `(ricambi / totalCurrent * 100)`.
2. Nella card "Risorsa Utilizzata", renderizzare sotto il valore principale una riga di testo piccolo con la percentuale formattata (es. `0,92% del fatturato`).
3. La percentuale verrà mostrata solo se `totalCurrent > 0` per evitare divisioni per zero.

Nessuna modifica al backend o ad altri file.

