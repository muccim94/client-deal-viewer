

## Aggiunta filtro Agente e link Top 10 Clienti

### Cosa cambia

1. **Nuovo filtro "Agente"** accanto al filtro mesi -- un dropdown che elenca tutti i codici agente presenti nei dati, permettendo di filtrare la dashboard per un agente specifico.

2. **Top 10 Clienti cliccabili** -- ogni riga della Top 10 diventa un link che porta alla scheda anagrafica del cliente (`/anagrafiche/{codiceCliente}`).

### Dettagli tecnici

File: `src/pages/Dashboard.tsx`

- Aggiungere import di `Link` da `react-router-dom`
- Aggiungere stato `filterAgente` con valore iniziale `"__all__"`
- Creare un `useMemo` per estrarre la lista degli agenti unici dai record (ordinati alfabeticamente)
- Aggiornare il `useMemo` di `filtered` per applicare anche il filtro agente
- Aggiungere un quarto `Select` nel blocco filtri per selezionare l'agente
- Modificare `topClienti` per includere anche il `codiceCliente` (necessario per il link): dal `Map` si salveranno sia `value` (fatturato) che `codiceCliente`
- Wrappare il nome del cliente in un `Link` verso `/anagrafiche/{codiceCliente}` con stile hover (underline, colore primary)

