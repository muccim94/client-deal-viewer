

## Filtri Rapidi Scorrevoli per la Tabella Anagrafiche

### Obiettivo
Aggiungere una barra di filtri rapidi cliccabili, con bordi arrotondati e scorrimento orizzontale (slider), posizionata tra l'intestazione della Card (con la barra di ricerca) e la tabella. Ogni filtro, quando attivo, filtra automaticamente i clienti in base a criteri specifici.

### Filtri previsti

| Filtro | Logica |
|---|---|
| **Clienti in perdita** | Mostra solo i clienti dove `fattCurrentYear < fattPrevYearYTD` (YTD corrente inferiore al YTD anno precedente) |
| **Sotto i 5k** | Mostra solo i clienti con `fattCurrentYear < 5000` nel 2026 |
| **Top 10 clienti** | Mostra i 10 clienti con il `fattCurrentYear` piu alto nel 2026 |

### Comportamento
- I filtri sono pulsanti con bordi arrotondati (pill/chip) disposti in una riga scorrevole orizzontalmente
- Cliccando un filtro si attiva; cliccando di nuovo si disattiva (toggle)
- Un solo filtro attivo alla volta (o nessuno)
- Il filtro attivo avra uno stile evidenziato (sfondo primary, testo bianco)
- Il contatore in alto ("X clienti") si aggiornera in base al filtro attivo
- I filtri si combinano con la ricerca testuale e il filtro agente gia esistenti

### Posizionamento visivo

```text
+--------------------------------------------------+
| 42 clienti          [Agente ▼]  [🔍 Cerca...]    |  <-- CardHeader
+--------------------------------------------------+
| ◀ [Clienti in perdita] [Sotto i 5k] [Top 10] ▶  |  <-- Slider filtri (nuovo)
+--------------------------------------------------+
| Codice | Trend | Nome | Fatt.2026 | ... | >      |  <-- Tabella
+--------------------------------------------------+
```

### Dettagli tecnici

**File da modificare:** `src/pages/Anagrafiche.tsx`

**Stato nuovo:**
- `activeFilter`: stato `useState<string | null>(null)` per tracciare il filtro attivo ("perdita" | "sotto5k" | "top10" | null)

**Slider orizzontale:**
- Un `div` con `overflow-x-auto` e `scrollbar-hide` (CSS) per lo scorrimento touch/mouse
- Stile `flex gap-2 whitespace-nowrap` per i pulsanti in riga
- Pulsanti con classi Tailwind: `rounded-full px-4 py-1.5 text-sm border transition-colors`
- Stile attivo: `bg-primary text-primary-foreground border-primary`
- Stile inattivo: `bg-background text-foreground border-input hover:bg-accent`

**Logica di filtraggio nel `useMemo`:**
- Dopo il filtro di ricerca testuale, applicare il filtro rapido attivo:
  - `"perdita"`: `data.filter(r => r.fattCurrentYear < r.fattPrevYearYTD)`
  - `"sotto5k"`: `data.filter(r => r.fattCurrentYear < 5000)`
  - `"top10"`: ordinare per `fattCurrentYear` DESC, prendere i primi 10

**CSS per nascondere la scrollbar:**
- Aggiungere una classe utility in `src/index.css` (`.scrollbar-hide`) oppure usare `[&::-webkit-scrollbar]:hidden` inline

**Nessuna migrazione SQL necessaria** -- tutti i filtri sono applicati lato frontend sui dati gia disponibili.

