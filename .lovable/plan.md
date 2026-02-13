

## Velocizzare il caricamento dei dati

### Problema attuale

Ogni volta che accedi all'app, vengono scaricati **tutti i 51.000+ record** dal database al browser, con circa 52 richieste HTTP sequenziali. Questo richiede diversi secondi e consuma banda e memoria.

### Strategia proposta: Aggregazione lato server

Invece di scaricare ogni singolo record e poi fare i calcoli nel browser, creiamo delle **funzioni database (RPC)** che calcolano direttamente i dati aggregati sul server e restituiscono solo i risultati. In questo modo il browser riceve poche centinaia di righe invece di 51.000+.

### Cosa cambia per ogni pagina

| Pagina | Oggi | Dopo |
|--------|------|------|
| **Dashboard** | 51k record scaricati, aggregati nel browser | 1 chiamata RPC che restituisce KPI + top clienti + distribuzione marchi |
| **Anagrafiche** | 51k record filtrati nel browser | 1 chiamata RPC che restituisce la lista clienti gia aggregata con fatturato per anno |
| **Provvigioni** | 51k record filtrati nel browser | 1 chiamata RPC che restituisce le provvigioni raggruppate per cliente |
| **Marchi** | 51k record filtrati nel browser | 1 chiamata RPC che restituisce i dati raggruppati per marchio |
| **Upload** | Conta dei record esistenti | Resta uguale (solo count) |
| **Dettaglio Cliente** | Filtra dai 51k in memoria | 1 chiamata RPC filtrata per codice cliente |

### Piano tecnico

**1. Creare 4 funzioni database RPC:**

- `get_dashboard_stats(p_azienda, p_anno, p_mese, p_agente)` -- restituisce fatturato totale, clienti unici, marchi, top 10 clienti, distribuzione marchi
- `get_clienti_list(p_agente)` -- restituisce lista clienti con fatturato anno corrente e precedente
- `get_provvigioni_grouped(p_azienda, p_anno, p_mese)` -- restituisce provvigioni raggruppate per cliente
- `get_cliente_detail(p_codice_cliente)` -- restituisce i record di un singolo cliente

**2. Modificare il DataContext:**

- Rimuovere il caricamento massivo di tutti i record all'avvio
- Mantenere solo `addRecords`, `clearRecords` e un semplice `recordCount` per la pagina Upload
- Ogni pagina chiamera direttamente la propria RPC con i filtri selezionati

**3. Aggiornare le pagine:**

- Ogni pagina usera `useQuery` (TanStack React Query, gia installato) per chiamare la propria RPC
- I dati vengono cachati automaticamente da React Query, evitando richieste duplicate
- Il caricamento avviene solo quando l'utente naviga su quella pagina

### Risultato atteso

- **Tempo di caricamento iniziale**: da 10-15 secondi a meno di 1 secondo
- **Navigazione tra pagine**: istantanea grazie alla cache di React Query
- **Memoria browser**: ridotta drasticamente (poche centinaia di righe invece di 51.000+)
- La barra di progresso non sara piu necessaria perche i dati arriveranno quasi istantaneamente

