## Separazione filtri: KPI vs Tabella Marchi + Toggle Azienda

### Cosa cambia

1. **I filtri Anno, Mese e Agente** continueranno a influenzare solo le 4 card KPI in alto. La tabella dei marchi non sara' piu' influenzata da questi filtri.
2. **La tabella dei marchi** mostrera' sempre tutti i marchi con il confronto fatturato 2025 vs 2026 calcolato su tutti i record. L'unico filtro che agira' sulla tabella sara' un nuovo selettore per azienda (Fogliani / Futurtec).
3. **Nuovo toggle azienda**: un componente slide/toggle posizionato a sinistra sopra la tabella, grande e ben visibile. Mostra i due nomi "Fogliani" e "Futurtec" come bottoni affiancati; quello selezionato sara' evidenziato con sfondo colorato.  la selezione di default sarà fogliani

### Dettagli tecnici

**File: `src/pages/Marchi.tsx**`

1. **Nuovo stato** `filterAzienda` (default `"__all__"`) per il filtro della tabella
2. **Separare i dati della tabella dai filtri KPI**: il `useMemo` di `brands` (riga 81) usera' `records` filtrato solo per `filterAzienda`, non piu' `filteredRecords`. I filtri Anno/Mese/Agente resteranno applicati solo a `filteredRecords` (usato dai KPI).
3. **UI toggle azienda**: nell'header della Card tabella, a sinistra del conteggio marchi, inserire un gruppo di 2 bottoni affiancati con bordo arrotondato (stile segmented control):
  - "Fogliani" | "Futurtec"
  - Il bottone attivo avra' sfondo primary e testo bianco
  - I bottoni inattivi avranno sfondo trasparente
4. **Nessuna modifica** ai filtri in alto (Anno, Mese, Agente) ne' ai KPI.