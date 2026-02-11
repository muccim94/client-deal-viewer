
# Interfaccia Commerciale - Consultazione Anagrafiche

## Panoramica
Un'app web professionale e moderna dove il commerciale può caricare manualmente un file Excel (clienti, prodotti, importi) e consultare i dati tramite tabelle interattive e una dashboard con statistiche.

---

## Pagina 1: Dashboard principale
- **KPI in evidenza** in alto: totale fatturato, numero clienti, numero prodotti, importo medio per ordine
- **Grafico a barre**: top 10 clienti per fatturato
- **Grafico a torta**: distribuzione vendite per prodotto
- **Grafico a barre orizzontali**: prodotti più venduti per quantità
- Stile professionale con card, icone e colori sobri

## Pagina 2: Tabella Anagrafiche
- **Tabella interattiva** con tutti i dati (cliente, prodotto, importo)
- **Ricerca globale** per cercare per nome cliente o prodotto
- **Filtri** per cliente e per prodotto (dropdown)
- **Ordinamento** per colonna (cliccando sull'intestazione)
- **Totali** in fondo alla tabella o nella barra filtri

## Pagina 3: Upload Excel
- Area di **drag & drop** o pulsante per caricare il file Excel (.xlsx/.xls)
- **Anteprima** dei dati caricati prima di confermare
- Pulsante di conferma per importare i dati
- I dati vengono salvati nel browser (localStorage) così restano disponibili senza ricaricare ogni volta

## Navigazione
- **Sidebar** o **top navigation bar** con link a Dashboard, Anagrafiche e Upload
- Logo/titolo dell'app in alto
- Design responsive per funzionare anche su tablet

## Note tecniche
- Nessun login richiesto, accesso libero
- I dati vengono letti dal file Excel direttamente nel browser (libreria SheetJS)
- I dati rimangono salvati localmente nel browser tra una sessione e l'altra
- Nessun backend necessario per questa prima fase
