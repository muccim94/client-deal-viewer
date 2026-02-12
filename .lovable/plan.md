

## Aggiunta filtro Agente nella pagina Anagrafiche

### Cosa cambia

Un nuovo dropdown "Agente" viene aggiunto accanto alla barra di ricerca nell'header della card, permettendo di filtrare l'elenco clienti per codice agente.

### Dettagli tecnici

File: `src/pages/Anagrafiche.tsx`

- Importare `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` da `@/components/ui/select`
- Aggiungere stato `filterAgente` con valore iniziale `"__all__"`
- Creare un `useMemo` per estrarre i codici agente univoci dai `records`
- Aggiornare il `useMemo` di `clienti` per applicare il filtro agente prima dell'aggregazione (filtrando `records` per `r.agente === filterAgente` quando diverso da `"__all__"`)
- Inserire il componente `Select` nell'header della card, tra il titolo e la barra di ricerca, con larghezza fissa (`w-44`)

