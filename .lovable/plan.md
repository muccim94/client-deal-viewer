

## Ottimizzazione pagina Marchi per smartphone (2262x1206)

La risoluzione 2262x1206 corrisponde a uno smartphone ad alta densità (es. Samsung Galaxy) con viewport logico ~380-412px. I problemi principali sono: filtri troppo larghi, tabella con colonne che non entrano, KPI cards con testo troncato, grafico area troppo alto, e le 3 card in fondo impilate senza ottimizzazione.

### Modifiche a `src/pages/Marchi.tsx`

1. **Filtri compatti su mobile**: ridurre altezza dei SelectTrigger a `h-8 text-xs` su mobile, toggle azienda con `px-2.5 py-1.5 text-xs`, disporre i 3 select su una riga con `grid grid-cols-3` su mobile

2. **Grafico area ridotto**: altezza da `h-[200px]` a `h-[140px] sm:h-[200px]`, font asse X/Y a 9px su mobile, nascondere asse Y su mobile per risparmiare spazio

3. **KPI cards compatte**: ridurre font importo a `text-lg sm:text-2xl`, label a `text-xs`, padding più stretto

4. **Tabella marchi responsive**:
   - Nascondere colonna "Progr. anno prec." su mobile (classe `hidden sm:table-cell`)
   - Ridurre font tabella a `text-sm` su mobile vs `text-[1.05rem]` su desktop
   - Padding celle ridotto a `px-1.5 py-1.5`
   - Nascondere sparkline su mobile per risparmiare spazio orizzontale

5. **Card fatturato header compatto**: font importo `text-2xl sm:text-3xl`

6. **Bottom 3 cards**: già `grid-cols-1` su mobile, ok — ridurre solo padding interno e font

### File coinvolti
- `src/pages/Marchi.tsx` — unico file

