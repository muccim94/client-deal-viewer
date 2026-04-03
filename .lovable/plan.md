

## Piano: Ottimizzazione mobile pagina Budget

### Problema
A 390px la tabella ha 6 colonne con testo grande (`text-[1.21rem]`), causando overflow orizzontale o colonne troppo compresse.

### Modifiche: `src/pages/Budget.tsx`

1. **Ridurre font-size su mobile**: `text-xs md:text-[1.21rem]` sul container tabella
2. **Nascondere "Delta €" su mobile**: la colonna è ridondante avendo già "Delta %". Usare `hidden md:table-cell`
3. **Abbreviare nomi mesi su mobile**: usare abbreviazione 3 lettere (Gen, Feb, Mar...) sotto md
4. **Ridurre larghezza barra progresso su mobile**: `w-[80px] md:w-[160px]`
5. **Header e filtri compatti**: titolo più piccolo su mobile (`text-xl md:text-2xl`), select a larghezza piena in riga

Colonne visibili su mobile: **Mese | Budget | Fatt. | Δ% | Progresso** (5 colonne compatte)

