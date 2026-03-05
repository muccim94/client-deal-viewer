

## Correzione dialogo ricerca: posizione e layout

### Problemi dallo screenshot
1. Su mobile la tastiera copre l'input di testo, rendendo invisibile ciò che si digita
2. Il FAB deve tornare centrato in basso su mobile (era stato spostato a destra per tutte le piattaforme)

### Modifiche in `src/pages/Dashboard.tsx`

1. **FAB responsive**: su mobile centrato in basso (`left-1/2 -translate-x-1/2`), su tablet/desktop in basso a destra (`sm:left-auto sm:translate-x-0 sm:right-6`)

2. **Dialog posizionato in alto su mobile**: aggiungere classi al `DialogContent` per posizionarlo nella metà superiore dello schermo su mobile, così la tastiera non copre l'input. Usare `top-[25%]` su mobile invece del default `top-[50%]`, e rimuovere la trasformazione verticale centrata. Su desktop mantenere il comportamento attuale.

3. **Nessuna modifica al database**

### File coinvolti
- `src/pages/Dashboard.tsx` — FAB positioning + DialogContent className

