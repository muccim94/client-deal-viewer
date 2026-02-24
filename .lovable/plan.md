## Modifiche alla pagina Anagrafica Cliente

### 1. Riportare la card "Riepilogo Fatturato" nella posizione originale

La card "Riepilogo Fatturato" verra' spostata di nuovo **subito dopo la Scheda Anagrafica**, prima delle tabelle mensili.

Nuovo ordine delle sezioni:

1. Header (nome cliente + codice)
2. Scheda Anagrafica (diviso a metà affiancato alla card riepilogo fatturato )
3. **Card Riepilogo Fatturato** -- (la prima card subito sotto al nome del cliente e relativo codice )
4. Tabelle mensili (2026 vs 2025)
5. Grafico Fatturato per Marchio
6. Incentivazioni

### 2. Tabelle mensili: colonne piu' vicine e font piu' grande

- **Padding orizzontale ridotto**: da `px-4` a `px-2` per avvicinare le colonne
- **Font size aumentato del 10%**: applico `text-[0.96rem]` (circa 15.4px, +10% rispetto ai 14px di `text-sm`) al corpo della tabella, e proporzionalmente all'header e al footer

### Dettagli tecnici


| File                             | Modifica                                                                                                                                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/ClienteDettaglio.tsx` | Spostare il blocco "Card Riepilogo Fatturato" (righe 283-310) subito dopo la Scheda Anagrafica (dopo riga 192). Ridurre il padding orizzontale delle celle da `px-4` a `px-2`. Aumentare il font della tabella da `text-sm` a `text-[0.96rem]`. |
