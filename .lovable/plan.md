

## Scheda Anagrafica modificabile (solo admin)

Aggiungere la possibilita' per gli amministratori di modificare i dati anagrafici (indirizzo e provincia) direttamente dalla card "Scheda Anagrafica", tramite un dialog modale attivato da un'icona di modifica.

### Funzionamento

- Nella card "Scheda Anagrafica", in alto a destra, comparira' una piccola icona matita (Pencil) visibile **solo agli admin**
- Cliccando l'icona si apre un dialog modale con:
  - Campo "Indirizzo" (input testuale, modificabile a mano)
  - Campo "Provincia" (input testuale)
  - Un link/pulsante "Cerca su Google Maps" che apre Maps con l'indirizzo corrente per verificarlo
  - Pulsanti "Annulla" e "Salva"
- Al salvataggio, i dati vengono scritti/aggiornati nella tabella `clienti_anagrafica` (upsert per `nome_cliente`)
- Il dialog si chiude e i dati vengono ricaricati automaticamente

### Modifiche tecniche

**File: `src/pages/ClienteDettaglio.tsx`**

- Importare `useAuth` da `@/contexts/AuthContext`
- Importare `Pencil` da lucide-react e componenti Dialog
- Aggiungere stato locale per il dialog (open/close) e i campi editabili (indirizzo, provincia)
- Nella CardHeader della "Scheda Anagrafica", aggiungere l'icona Pencil condizionata a `role === "admin"`
- Creare il Dialog con form di modifica contenente:
  - Input per indirizzo
  - Input per provincia
  - Link esterno a Google Maps per verifica
  - Logica di upsert su `clienti_anagrafica` al salvataggio
  - Invalidazione della query `cliente-anagrafica` dopo il salvataggio per aggiornare i dati visualizzati
