

## Ricerca ignorando punteggiatura

### Problema
Cercando "tema" non si trova "T.E.M.A." perché i punti nel nome impediscono il match con `includes()`.

### Soluzione
Nel filtro `filteredClienti` in `src/pages/Dashboard.tsx`, rimuovere tutti i caratteri non alfanumerici (punti, virgole, trattini, ecc.) sia dalla query che dal nome cliente prima del confronto, usando una regex `/[^a-z0-9\s]/g`.

```ts
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "");
const q = normalize(searchQuery);
return clientiList.filter((c) => normalize(c.nomeCliente).includes(q)).slice(0, 20);
```

### File coinvolti
- `src/pages/Dashboard.tsx` — modifica al `useMemo` di `filteredClienti` (righe 84-88)

### Nessuna modifica al database

