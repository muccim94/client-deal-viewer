

## Ottimizzazione tabella Anagrafiche per mobile

### Problemi identificati
1. Nomi clienti troppo vicini al margine sinistro (padding insufficiente)
2. Cifre in formato pieno (es. "55.509 €") invece di compatto (es. "55k")
3. Cifre troppo vicine al margine destro

### Modifiche in `src/pages/Anagrafiche.tsx`

1. **Formato compatto per mobile**: Aggiungere una funzione `fmtCompact` che formatta i numeri in formato abbreviato (55k, 1.2M) e usarla al posto di `fmt` su mobile. Su desktop mantenere il formato attuale.

2. **Padding nome cliente**: Aumentare il padding sinistro della cella Nome Cliente su mobile da `px-1` a `px-3`

3. **Padding cifre**: Cambiare l'allineamento delle cifre da `text-right` a `text-center` su mobile, e aumentare il padding destro per allontanarle dal margine

### Dettaglio tecnico

```tsx
// Nuova funzione compatta
const fmtCompact = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n} €`;
};

// Mobile: usare fmtCompact, desktop: usare fmt
// Celle nome: px-3 sm:px-2 md:px-4
// Celle cifre: text-right pr-4 sm:pr-2 md:pr-4
```

