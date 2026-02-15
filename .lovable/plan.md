
## Ricerca Rapida Cliente nella Dashboard (solo mobile)

### Obiettivo
Aggiungere un pulsante rotondo con icona lente di ingrandimento, visibile solo su mobile, posizionato centralmente in basso nella Dashboard. Premendolo si apre un pannello di ricerca dove digitare il nome di un cliente; selezionando un risultato si viene portati direttamente alla pagina anagrafica del cliente.

### Comportamento
- Il pulsante e visibile solo su mobile (hidden su desktop tramite `md:hidden`)
- Posizionato in basso al centro con `fixed bottom-6 left-1/2 -translate-x-1/2`
- Stile: cerchio con sfondo primary, icona `Search` bianca, ombra elevata
- Al click apre un Dialog/Sheet dal basso con un campo di ricerca
- Digitando il nome, viene eseguita una query sulla lista clienti (riutilizzando l'RPC `get_clienti_list` gia esistente) filtrando per nome
- I risultati appaiono come lista cliccabile sotto il campo di ricerca
- Selezionando un cliente si naviga a `/anagrafiche/{codiceCliente}`

### Layout visivo

```text
+----------------------------------+
|         Dashboard                |
|  [Filtri]                        |
|  [KPI cards]                     |
|  [Top 10 / Pie chart]           |
|                                  |
|                                  |
|           ( 🔍 )   <-- FAB      |
+----------------------------------+
```

Al click del FAB:

```text
+----------------------------------+
|  Cerca cliente          [X]      |
|  [🔍 Digita nome cliente... ]   |
|                                  |
|  A.I.M.E. SRL                   |
|  A.P.S. DUE SRL                 |
|  ALFA COSTRUZIONI SRL           |
|  ...                             |
+----------------------------------+
```

### Dettagli tecnici

**File da modificare:** `src/pages/Dashboard.tsx`

**Componenti utilizzati:**
- `Dialog` (da `@/components/ui/dialog`) per il pannello di ricerca
- `Input` per il campo di ricerca
- `Search`, `X` da `lucide-react` per le icone
- `useIsMobile` (gia importato) per condizionare la visibilita
- `useNavigate` (gia importato) per la navigazione

**Stato nuovo:**
- `searchOpen`: `useState<boolean>(false)` per aprire/chiudere il dialog
- `searchQuery`: `useState<string>("")` per il testo di ricerca

**Query clienti per la ricerca:**
- Nuova `useQuery` che chiama `get_clienti_list` senza filtro agente (passa `null`)
- Filtro lato client sul `nomeCliente` in base a `searchQuery`
- La query viene caricata solo quando il dialog e aperto (`enabled: searchOpen`)

**FAB (Floating Action Button):**
- Visibile solo su mobile: `className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden"`
- Cerchio: `rounded-full w-12 h-12 bg-primary text-primary-foreground shadow-lg`
- Icona `Search` centrata

**Dialog di ricerca:**
- Si apre dal FAB
- Contiene un `Input` con placeholder "Cerca cliente..."
- Lista risultati filtrati (max 20) con nome cliente cliccabile
- Al click su un risultato: `navigate(/anagrafiche/${codice})` e chiusura del dialog

**Nessuna migrazione SQL necessaria** -- riutilizza l'RPC `get_clienti_list` esistente.
