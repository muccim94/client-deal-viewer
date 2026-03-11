

## Filtro rapido TOP e badge "TOP" per marchi premianti

### Cosa cambia

1. **Nuovo stato `filterTop`** (boolean, default `false`) per filtrare solo i marchi premianti
2. **Bottone toggle "TOP"** accanto al titolo "{N} famiglie marchio" nel CardHeader della tabella — un badge/bottone cliccabile con sfondo giallo quando attivo
3. **Logica filtro**: nel `useMemo` di `filtered`, se `filterTop` è true, filtrare solo i marchi presenti in `MARCHI_PREMIANTI`
4. **Sostituire l'icona Trophy** nella tabella con un `<Badge>` giallo con testo "TOP"

### Modifiche a `src/pages/Marchi.tsx`

- Aggiungere `const [filterTop, setFilterTop] = useState(false)`
- Nel CardHeader della tabella, accanto a `<CardTitle>`, aggiungere un bottone toggle:
  ```tsx
  <button onClick={() => setFilterTop(v => !v)}
    className={cn("px-2 py-0.5 rounded-full text-xs font-bold border transition-all",
      filterTop ? "bg-yellow-500 text-white border-yellow-500" : "bg-transparent text-yellow-600 border-yellow-400 hover:bg-yellow-50"
    )}>TOP</button>
  ```
- Nel `useMemo` di `filtered`, aggiungere filtro: `if (filterTop) data = data.filter(r => MARCHI_PREMIANTI.includes(r.marchio))`
- Nella TableCell del marchio, sostituire `<Trophy>` con `<Badge className="bg-yellow-500 text-white text-[10px] px-1.5 py-0">TOP</Badge>`

### File coinvolti
- `src/pages/Marchi.tsx`

