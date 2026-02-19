
## Pagina "Incentivazioni" nella sezione Anagrafiche

### Obiettivo
Creare una nuova pagina `/anagrafiche/incentivazioni` accessibile come sotto-sezione della pagina Anagrafiche, con:
- Visualizzazione di tutte le incentivazioni salvate, filtrate per anno e raggruppate per cliente
- Esportazione PDF singola per ogni lettera (con anagrafica cliente + tabella scaglioni)
- Download massivo in PDF tramite selezione multipla con filtri (anno, codice cliente) e checkbox "Seleziona tutto"

---

### Architettura della soluzione

#### Navigazione
La pagina sara' raggiungibile tramite un tab/link nella pagina `/anagrafiche`. Viene aggiunta una route dedicata in `App.tsx`:

```
/anagrafiche                → Anagrafiche (lista clienti)
/anagrafiche/incentivazioni → Pagina Incentivazioni globale  ← NUOVA
/anagrafiche/:codice        → ClienteDettaglio
/anagrafiche/:codice/marchi → ClienteMarchi
```

ATTENZIONE: la route `/anagrafiche/incentivazioni` deve essere definita PRIMA di `/anagrafiche/:codice` in `App.tsx` per evitare conflitti di routing (altrimenti "incentivazioni" verrebbe interpretato come un codice cliente).

#### Navigazione dalla pagina lista
Nella pagina `Anagrafiche.tsx` viene aggiunto un tab-bar in cima alla card, con due voci:
- **Clienti** (lista attuale)
- **Incentivazioni** (link alla nuova pagina)

---

### File da creare/modificare

| File | Operazione |
|---|---|
| `src/pages/IncentivazioniBrowser.tsx` | NUOVO - pagina principale con tabella, filtri, selezione e PDF |
| `src/App.tsx` | Aggiungere route `/anagrafiche/incentivazioni` prima di `/:codice` |
| `src/pages/Anagrafiche.tsx` | Aggiungere tab-bar "Clienti / Incentivazioni" in cima |

**Nessuna modifica al database** — la tabella `cliente_incentivazioni` e le RLS policy esistono gia'.

---

### Dettaglio tecnico: `src/pages/IncentivazioniBrowser.tsx`

#### Struttura della pagina

```
┌─────────────────────────────────────────────────────────────┐
│  🏆 Incentivazioni                            [↓ Scarica PDF]│
│                                                             │
│  Filtri:  [ Anno ▼ ]  [ 🔍 Codice/Nome cliente... ]        │
│           [☑ Seleziona tutto]  X lettere selezionate       │
│                                                             │
│  ┌───┬──────────────────┬──────┬───────────┬────────┬────┐  │
│  │ ☐ │ Cliente          │ Anno │ Fatt. Tot │ Premi  │PDF │  │
│  ├───┼──────────────────┼──────┼───────────┼────────┼────┤  │
│  │ ☑ │ Rossi Spa (0358) │ 2025 │ €120.000  │ €7.200 │ ↓  │  │
│  │ ☐ │ Bianchi Srl (02) │ 2025 │ €80.000   │ €4.000 │ ↓  │  │
│  └───┴──────────────────┴──────┴───────────┴────────┴────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Filtri e query

```ts
// Fetch tutte le incentivazioni con filtri opzionali
const { data } = useQuery({
  queryKey: ["all-incentivazioni", filterAnno, filterCliente],
  queryFn: async () => {
    let q = supabase
      .from("cliente_incentivazioni")
      .select("*")
      .order("anno", { ascending: false })
      .order("nome_cliente", { ascending: true });
    if (filterAnno) q = q.eq("anno", filterAnno);
    if (filterCliente) q = q.ilike("nome_cliente", `%${filterCliente}%`);
    // oppure codice cliente esatto
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  enabled: isAdmin,
});
```

Il filtro cliente supporta sia la ricerca per nome (ilike) sia per codice cliente (eq su `codice_cliente`).

#### Selezione multipla

```ts
const [selected, setSelected] = useState<Set<string>>(new Set());
const allIds = filtered.map(l => l.id);
const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

const toggleAll = () => {
  if (allSelected) setSelected(new Set());
  else setSelected(new Set(allIds));
};
```

#### Generazione PDF (senza librerie aggiuntive)

La generazione PDF viene realizzata tramite **stampa HTML** (`window.print()`) con CSS `@media print` dedicato. Questo approccio non richiede librerie esterne (jsPDF, pdfmake, ecc.) ed e' gia' supportato da tutti i browser moderni.

Il flusso e':
1. Si genera dinamicamente un `<div>` con il contenuto HTML della lettera
2. Si apre una nuova finestra (`window.open`)
3. Si scrive il contenuto HTML con stili di stampa inlined
4. Si chiama `window.print()` nella nuova finestra
5. La finestra si chiude automaticamente dopo la stampa

**Struttura HTML del PDF singolo**:
```
┌─────────────────────────────────────────────────┐
│              LETTERA DI INCENTIVAZIONE          │
│                                                 │
│  Cliente:  Rossi Spa                            │
│  Codice:   035826                               │
│  Anno:     2025                                 │
│  Data:     19/02/2026                           │
│                                                 │
│  ┌────────┬────────────────┬──────┬───────────┐ │
│  │   #    │ Scaglione €    │  %   │ Premio    │ │
│  ├────────┼────────────────┼──────┼───────────┤ │
│  │   1    │ €50.000        │ 2%   │ €1.000    │ │
│  │  ...   │  ...           │ ...  │  ...      │ │
│  ├────────┴────────────────┼──────┼───────────┤ │
│  │ TOTALE                  │ Inc% │ Tot.Premi │ │
│  └─────────────────────────┴──────┴───────────┘ │
│                                                 │
│  Note: ...                                      │
└─────────────────────────────────────────────────┘
```

**Download massivo**: itera su ogni lettera selezionata aprendo sequenzialmente finestre di stampa (con piccolo delay tra l'una e l'altra per non bloccare il browser), oppure — approccio alternativo piu' pulito — genera un unico documento HTML con tutte le lettere separate da `page-break-after: always` e lo stampa una sola volta.

L'approccio con un unico documento e' preferibile perche':
- L'utente apre UNA sola finestra di stampa
- Puo' salvare come PDF con tutte le lettere in un unico file
- Nessun popup blocker

```ts
const handleDownloadSelected = () => {
  const lettere = data.filter(l => selected.has(l.id));
  const html = lettere.map((l, idx) => generateLetteraHtml(l, idx < lettere.length - 1)).join('');
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>Incentivazioni</title>${styles}</head><body>${html}</body></html>`);
  win.document.close();
  win.print();
};
```

dove `generateLetteraHtml(lettera, addPageBreak)` restituisce l'HTML di una singola lettera con `page-break-after: always` se non e' l'ultima.

---

### Modifica `src/App.tsx`

```tsx
// IMPORTANTE: la route statica deve stare PRIMA di quella dinamica
<Route path="/anagrafiche/incentivazioni" element={<IncentivazioniBrowser />} />
<Route path="/anagrafiche/:codice" element={<ClienteDettaglio />} />
```

---

### Modifica `src/pages/Anagrafiche.tsx`

Aggiungere un tab-bar in cima, prima della card dei clienti:

```tsx
<div className="flex gap-2 border-b mb-4">
  <Link to="/anagrafiche">
    <button className={`px-4 py-2 text-sm font-medium border-b-2 ${
      !isIncentivazioni ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
    }`}>Clienti</button>
  </Link>
  <Link to="/anagrafiche/incentivazioni">
    <button className={`px-4 py-2 text-sm font-medium border-b-2 ...`}>Incentivazioni</button>
  </Link>
</div>
```

Poiche' le due pagine sono route separate, il tab attivo si determina con `useLocation()` o semplicemente lasciando che ogni pagina mostri il proprio tab-bar con lo stato corretto. Entrambe le pagine (`Anagrafiche` e `IncentivazioniBrowser`) mostreranno lo stesso tab-bar con il tab appropriato attivo.

---

### Riepilogo file modificati

- `src/App.tsx` — aggiunge route `/anagrafiche/incentivazioni`
- `src/pages/Anagrafiche.tsx` — aggiunge tab-bar in cima
- `src/pages/IncentivazioniBrowser.tsx` — NUOVO: tabella con filtri, selezione, export PDF
