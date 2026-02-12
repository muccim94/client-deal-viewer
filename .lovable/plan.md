

## Velocizzare il caricamento dati dopo il login

### Il problema attuale

Dopo il login, l'app scarica **tutti i 51.000+ record** dal database in blocchi da 1.000 alla volta (circa 50+ richieste sequenziali). L'utente vede "Caricamento..." finche' tutto non e' pronto.

### Strategia proposta: Caricamento progressivo + Selezione colonne

L'approccio combina piu' ottimizzazioni per un miglioramento significativo senza stravolgere l'architettura.

---

**1. Selezionare solo le colonne necessarie (riduzione dimensione risposta)**

Attualmente la query usa `select("*")` che scarica tutte le colonne inclusi `id`, `created_at`, `user_id` che non vengono usati nel frontend. Rimuovendoli si riduce la dimensione di ogni risposta di circa il 30%.

**2. Aumentare la dimensione della pagina**

Passare da 1.000 a 5.000 record per pagina riduce drasticamente il numero di richieste HTTP (da ~50 a ~10), eliminando la latenza di rete ripetuta.

**3. Caricare le pagine in parallelo**

Invece di scaricare le pagine una alla volta in sequenza, fare prima una query `count` per sapere quanti record ci sono, poi lanciare tutte le richieste in parallelo.

**4. Mostrare i dati progressivamente**

Mostrare i record man mano che arrivano invece di aspettare che siano tutti pronti. L'utente vedra' la dashboard popolarsi in tempo reale.

---

### Dettagli tecnici

**File: `src/contexts/DataContext.tsx`**

1. Cambiare `select("*")` in `select("azienda,azienda_nome,anno,mese,codice_cliente,nome_cliente,agente,marchio,articolo,imponibile,provvigione,fattura_riga")`

2. Aumentare `PAGE_SIZE` da 1.000 a 5.000

3. Riscrivere `fetchAllRecords` con approccio parallelo:
   - Prima query: `select("*", { count: "exact", head: true })` per ottenere il conteggio totale
   - Calcolare il numero di pagine necessarie
   - Lanciare tutte le richieste con `Promise.all()`

4. Aggiornare `refreshRecords` per mostrare i dati progressivamente:
   - Usare uno stato intermedio che si aggiorna man mano che le pagine arrivano
   - Togliere `setLoading(true)` se ci sono gia' dati in memoria (refresh silenzioso)

### Impatto stimato

- Da ~50 richieste sequenziali a ~10 richieste parallele
- Tempo di caricamento ridotto da diversi secondi a circa 1-2 secondi
- L'utente vede i primi dati quasi subito

