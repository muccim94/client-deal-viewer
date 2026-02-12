## Miglioramenti pagina Marchi

### Cosa cambia

1. **Filtro Agente** sopra le card KPI -- un dropdown per filtrare tutti i dati della pagina (KPI e tabella) per un agente specifico.
2. **Colonna Variazione %** nella tabella -- una nuova colonna che mostra la variazione percentuale tra fatturato anno corrente e anno precedente, con colore verde (positivo) o rosso (negativo).
3. **Nuova card KPI "Risorsa spesa"** -- quarta card che somma gli importi dei prodotti con precodice `"RI."`, affiancata alle altre tre (griglia da 3 a 4 colonne).

### Dettagli tecnici

**File modificato: `src/pages/Marchi.tsx**`

- Importare `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` da `@/components/ui/select` e icona `Wrench` da lucide-react
- Aggiungere stato `filterAgente` con valore iniziale `"__all__"`
- Creare `useMemo` per estrarre agenti univoci dai record
- Creare `useMemo` `filteredRecords` che filtra i `records` per agente selezionato; tutti i calcoli successivi (KPI, brands) useranno `filteredRecords` invece di `records`
- Aggiornare il calcolo KPI per includere `ricambi` (somma di `r.marchio === "RI."`) e escludere `"RI."` dal totale "Materiale Elettrico"
- Aggiungere `var` (variazione %) al tipo `BrandRow` e calcolarlo: `fatt2025 > 0 ? ((fatt2026 - fatt2025) / fatt2025) * 100 : null`
- Aggiungere `"var"` come chiave di ordinamento
- Griglia KPI: da `sm:grid-cols-3` a `sm:grid-cols-4`, con quarta card "Ricambi" (icona `Wrench`)
- Tabella: nuova colonna "Var. %" con badge colorato (verde se positivo, rosso se negativo, grigio se non calcolabile)
- Il dropdown agente viene posizionato sopra le card KPI, allineato a destra