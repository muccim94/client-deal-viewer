&nbsp;

## Ottimizzazione Mobile Completa

Verifica e correzioni per rendere tutte le pagine responsive su mobile, incluso il menu sidebar.

### Pagine analizzate e problemi trovati


| Pagina                 | Stato attuale   | Problemi                                                                                                                             |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Dashboard**          | Buono           | Gia ottimizzata con griglia 2 colonne, FAB ricerca                                                                                   |
| **Anagrafiche**        | Buono           | Gia nasconde colonne non essenziali su mobile                                                                                        |
| **ClienteDettaglio**   | Buono           | Pie chart mobile gia implementato                                                                                                    |
| **ClienteMarchi**      | Problema        | Titolo troppo lungo su mobile, tabella con testo piccolo ma accettabile                                                              |
| **FatturatoRiepilogo** | Problema        | Header con filtro agente su una riga sola, il SelectTrigger ha larghezza fissa `w-44` che puo traboccare su schermi piccoli          |
| **Marchi**             | Problema        | Filtri con larghezze fisse (`w-40`, `w-48`, `w-56`) non si adattano a mobile; KPI cards con testo `text-2xl` troppo grande su mobile |
| **Provvigioni**        | Buono           | Filtri gia `w-full sm:w-*`, tabella nasconde colonna Azienda su mobile                                                               |
| **UploadExcel**        | Buono           | Layout gia responsive                                                                                                                |
| **GestioneUtenti**     | Buono           | Gia responsive                                                                                                                       |
| **Auth**               | Buono           | Centrato con `max-w-sm`                                                                                                              |
| **AppSidebar**         | Problema        | Il testo del menu non e ottimizzato per mobile; su mobile la sidebar si apre come Sheet ma i testi non sono adattati                 |
| **AppLayout**          | Problema minore | Il titolo "Trade Off snc" potrebbe essere abbreviato su mobile per dare piu spazio                                                   |


### Modifiche previste

**1. `src/pages/Marchi.tsx**`

- Rendere i filtri `w-full` su mobile (aggiungere `w-full sm:w-40` ecc.)
- Ridurre KPI da `text-2xl` a `text-lg md:text-2xl` su mobile
- Nascondere colonna "Fatt. anno precedente" su mobile nella tabella (`hidden sm:table-cell`)

**2. `src/pages/FatturatoRiepilogo.tsx**`

- Rendere l'header responsive: su mobile, titolo e filtro su righe separate (`flex-col sm:flex-row`)
- SelectTrigger da `w-44` a `w-full sm:w-44`

**3. `src/pages/ClienteMarchi.tsx**`

- Titolo su mobile: ridurre font e troncare il nome cliente se troppo lungo
- Aggiungere `text-base md:text-xl` al titolo

**4. `src/components/AppLayout.tsx**`

- Abbreviare il titolo header su mobile: mostrare "Trade Off" invece di "Trade Off snc" oppure ridurre ulteriormente il font

**5. `src/components/AppSidebar.tsx**`

- Aggiungere tooltip gia presenti (verificato: ci sono). Il menu su mobile si apre come Sheet tramite il componente Sidebar -- il comportamento e gia corretto. Verificare che il testo sia leggibile e i padding adeguati per touch target.
- Aumentare leggermente i padding delle voci del menu per facilitare il touch su mobile (min 44px height)

### Dettagli tecnici

`**src/pages/Marchi.tsx**` -- Filtri responsive:

- Cambiare i SelectTrigger da larghezze fisse a `w-full sm:w-40`, `w-full sm:w-48`, `w-full sm:w-56`
- Cambiare il wrapper dei filtri da `flex flex-wrap` a `flex flex-col sm:flex-row flex-wrap`
- KPI: `text-lg md:text-2xl` invece di `text-2xl`
- Tabella: aggiungere `hidden sm:table-cell` alla colonna "Fatt. anno precedente"

`**src/pages/FatturatoRiepilogo.tsx**` -- Header responsive:

- Cambiare `flex items-center justify-between` a `flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2`
- SelectTrigger: `w-full sm:w-44`

`**src/pages/ClienteMarchi.tsx**` -- Titolo adattivo:

- Titolo h1: `text-base md:text-xl` e aggiungere `truncate` o `line-clamp-1`
- Barra ricerca: `max-w-xs` diventa `w-full sm:max-w-xs`

`**src/components/AppLayout.tsx**` -- Header compatto mobile:

- Ridurre font titolo: `text-sm md:text-lg`

`**src/components/AppSidebar.tsx**` -- Touch target:

- Aggiungere `min-h-[44px]` alle voci del menu per rispettare le linee guida touch (gia gestito dal SidebarMenuButton, ma verificare che il padding sia sufficiente)
- Il pulsante "Esci" nel footer: aggiungere `min-h-[44px]`

**Nessuna migrazione SQL necessaria.**