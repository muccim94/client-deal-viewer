

## Aggiunta card "Scheda Anagrafica" nella pagina cliente

### Panoramica
Aggiungere una card "Scheda Anagrafica" accanto alla card "Riepilogo Fatturato" nella pagina dettaglio cliente. I dati anagrafici (indirizzo e provincia) provengono dal file Excel caricato e verranno salvati in una nuova tabella del database.

### Dati dal file Excel
Il file contiene 3 colonne:
- **AZIENDA**: ragione sociale del cliente
- **INDIRIZZO SEDE LEGALE**: indirizzo completo
- **PROVINCIA**: sigla provincia (es. MO, BO, RE)

### Modifiche tecniche

#### 1. Nuova tabella database: `clienti_anagrafica`

```text
clienti_anagrafica
+-------------------+----------+-----------------------------------+
| nome_cliente      | text PK  | ragione sociale (chiave primaria) |
| indirizzo         | text     | indirizzo sede legale             |
| provincia         | text     | sigla provincia                   |
+-------------------+----------+-----------------------------------+
```

- RLS abilitato con policy di lettura per utenti autenticati
- Policy di scrittura per admin (per futuri aggiornamenti)

#### 2. Importazione dati Excel

Creazione di una migration SQL che inserisce tutti i ~170 record del file Excel direttamente nella tabella tramite `INSERT INTO`.

#### 3. File: `src/pages/ClienteDettaglio.tsx`

- Aggiungere una query per recuperare i dati anagrafici dalla tabella `clienti_anagrafica`, cercando per `nome_cliente` corrispondente
- Le due card ("Riepilogo Fatturato" e "Scheda Anagrafica") vengono disposte in una griglia a 2 colonne (`grid grid-cols-1 md:grid-cols-2`) occupando ciascuna meta' dello spazio
- La card "Scheda Anagrafica" mostra:
  - Indirizzo sede legale
  - Provincia
  - Un messaggio "Dati non disponibili" se il cliente non e' presente nella tabella anagrafica

### Layout risultante

```text
+---------------------------+---------------------------+
|   Riepilogo Fatturato     |   Scheda Anagrafica       |
|                           |                           |
|   Fatt. 2026: EUR XXX     |   Indirizzo:              |
|   vs 2025 YTD: EUR XXX    |   Via Example 123, Citta' |
|   Fatt. 2025: EUR XXX     |   Provincia: MO           |
+---------------------------+---------------------------+
```

| File | Modifica |
|---|---|
| Migration SQL | Creare tabella `clienti_anagrafica` + inserire dati dal file Excel |
| `src/pages/ClienteDettaglio.tsx` | Aggiungere query anagrafica, layout a griglia con le due card affiancate |

