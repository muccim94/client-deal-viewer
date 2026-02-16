
## Ottimizzazione Mobile Tabella Anagrafiche

### Obiettivo
Ridurre la larghezza complessiva su mobile (~15%) nascondendo la colonna freccia e compattando i controlli in alto.

### Modifiche su `src/pages/Anagrafiche.tsx`

**1. Nascondere la colonna ChevronRight su mobile**
- TableHead (riga 169): da `w-8 px-0 sm:px-2` a `hidden sm:table-cell w-8 px-0 sm:px-2`
- TableCell (riga 197-201): da `px-0 sm:px-2 md:px-4 w-8` a `hidden sm:table-cell px-0 sm:px-2 md:px-4 w-8`
- Rendere l'intera riga cliccabile su mobile tramite un wrapper o usando `onClick` + `useNavigate` sulla TableRow

**2. Compattare i controlli di ricerca su mobile**
- Select agente (riga 112): ridurre altezza con `h-8 text-xs` su mobile -> `h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-44`
- Input cerca (riga 122-124): ridurre altezza `h-8 sm:h-10 text-xs sm:text-sm` e icona piu piccola `h-3 w-3 sm:h-4 sm:w-4`
- Mettere Select e Input affiancati su mobile: cambiare il wrapper (riga 110) in `flex flex-row items-center gap-1.5 sm:gap-2` con larghezze `w-1/2` ciascuno su mobile
- Ridurre padding filtri rapidi (riga 129): `px-2 sm:px-6 py-2 sm:py-3` e bottoni `px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm`

**3. Ridurre padding celle su mobile**
- Celle nome e fatturato: da `px-2 md:px-4` a `px-1 sm:px-2 md:px-4`

### Dettagli tecnici

**Riga cliccabile su mobile (sostituzione freccia):**
Aggiungere `useNavigate` da react-router-dom e un `onClick` sulla TableRow:
```tsx
const navigate = useNavigate();
// ...
<TableRow 
  key={r.codiceCliente} 
  className="group cursor-pointer sm:cursor-default"
  onClick={() => navigate(`/anagrafiche/${r.codiceCliente}`)}
>
```

**Controlli affiancati su mobile:**
```tsx
<div className="flex flex-row items-center gap-1.5 sm:flex-row sm:items-center sm:gap-2">
  <Select ...>
    <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-44">
  </Select>
  <div className="relative w-full sm:w-64">
    <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 ..." />
    <Input ... className="pl-7 sm:pl-9 h-8 sm:h-10 text-xs sm:text-sm" />
  </div>
</div>
```

**File modificato:** solo `src/pages/Anagrafiche.tsx`
**Nessuna migrazione SQL necessaria.**
