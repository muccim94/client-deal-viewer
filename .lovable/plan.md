# Ottimizzazione Mobile

Rendere l'applicazione completamente utilizzabile da smartphone, adattando layout, dimensioni di testi/icone e interazioni touch su tutte le pagine.

## Modifiche previste

### 1. Header e Layout (`AppLayout.tsx`)

- Ridurre l'altezza dell'header su mobile (h-12 invece di h-14)
- Ridurre la dimensione del titolo "Trade Off snc" su mobile (text-base invece di text-lg)
- Ridurre il padding del main content su mobile (p-3 invece di p-6)

### 2. Sidebar (`AppSidebar.tsx`)

- Nessuna modifica necessaria: la sidebar ShadCN gestisce gia il collapse su mobile come sheet overlay

### 3. Dashboard (`Dashboard.tsx`)

- Filtri: rendere i Select a larghezza piena su mobile (w-full su schermi piccoli)
- KPI cards: grid a 2 colonne su mobile invece di 1 (gia 2 col su md)
- Grafici: ridurre l'altezza dei container grafici su mobile (h-60 invece di h-80)
- Pie chart: ridurre outerRadius e nascondere le label lunghe su mobile, mostrare solo la legenda
- Font dei tooltip e assi ridotti

### 4. Anagrafiche (`Anagrafiche.tsx`)

- Header card: impilare titolo e barra di ricerca verticalmente su mobile
- Barra di ricerca: larghezza piena su mobile
- Tabella:  riadattare la tabella adattandola al display, ridurre font-size delle celle
- Nascondere la colonna "Codice"  su mobile per risparmiare spazio, mostrando solo il nome cliente cliccabile

### 5. Provvigioni (`Provvigioni.tsx`)

- Filtri: Select a larghezza piena su mobile, impilati verticalmente
- Barra di ricerca: larghezza piena su mobile
- Tabella: nascondere colonna "Azienda" su mobile, scroll orizzontale

### 6. Upload Excel (`UploadExcel.tsx`)

- Ridurre il padding della drop zone (p-8 invece di p-12)
- Icona upload piu piccola su mobile
- Pulsanti azioni (backup/cancella): impilati verticalmente su mobile
- Anteprima tabella: nascondere colonne meno importanti su mobile

### 7. Cliente Dettaglio (`ClienteDettaglio.tsx`)

- Titolo cliente: text-xl invece di text-2xl su mobile
- KPI cards: grid a 2 colonne su mobile
- Badge marchi: testo piu piccolo su mobile
- Tabella mensile: font ridotto, scroll orizzontale

### 8. Gestione Utenti (`GestioneUtenti.tsx`)

- Titolo: text-xl su mobile
- Select agente + bottone: impilati verticalmente su mobile

### 9. Auth (`Auth.tsx`)

- Gia responsive, nessuna modifica significativa necessaria

---

## Dettagli tecnici

Tutte le modifiche useranno classi Tailwind responsive (prefissi `sm:`, `md:`, `lg:`). Non servono nuovi componenti o dipendenze. L'approccio e mobile-first: si definiscono le dimensioni per mobile come default e si aumentano per schermi piu grandi.

Esempi di pattern ricorrenti:

- `text-base md:text-lg` per testi
- `p-3 md:p-6` per padding
- `w-full sm:w-44` per filtri
- `hidden sm:table-cell` per nascondere colonne su mobile
- `flex-col sm:flex-row` per impilare elementi