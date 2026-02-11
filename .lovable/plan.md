
# Ristrutturazione del Modello Dati e Parsing Excel

## Panoramica

Il file Excel ha una struttura molto diversa da quella attualmente gestita dall'app. Occorre ristrutturare completamente il modello dati, la logica di parsing e aggiornare Dashboard, Anagrafiche e Upload di conseguenza.

---

## Nuovo modello dati

Dalla riga Excel grezza verranno estratti questi campi:

| Campo originale | Elaborazione | Campo risultante |
|---|---|---|
| Sorgente | Ignorato | - |
| Azienda | "FO" = Fogliani, "FU" = Futurtec | `azienda` (codice + nome) |
| Anno | Usato direttamente | `anno` |
| Mese | Numero 1-12, convertito in nome mese | `mese` |
| Cliente | Es. "FO_076654 - NEW TRADE SRL" --> codice "076654" + nome "NEW TRADE SRL" | `codiceCliente` + `nomeCliente` |
| Fattura_Riga | Ignorato | - |
| Ordine_Riga | Ignorato | - |
| DataDDT | Ignorato | - |
| Agente | Usato direttamente (es. "FO_FO77") | `agente` |
| Articolo | Rimossi primi 3 char (es. "FO_"), poi i primi 3 char sono il marchio (es. "VIW", "BEG", "CV.") | `marchio` + `articolo` (codice completo senza prefisso azienda) |
| Qta | Ignorato nel calcolo importi (ma puo' essere utile in futuro) | - |
| Imponibile | Valore da sommare per aggregazioni | `imponibile` |

---

## Dettaglio delle modifiche

### 1. Tipo dati (`src/types/data.ts`)

Sostituire `SalesRecord` con un nuovo tipo che riflette la struttura reale:

```text
SalesRecord {
  azienda: string        // "FO" o "FU"
  aziendaNome: string    // "Fogliani" o "Futurtec"
  anno: number
  mese: number
  codiceCliente: string  // solo parte numerica es. "076654"
  nomeCliente: string    // es. "NEW TRADE SRL"
  agente: string         // es. "FO_FO77"
  marchio: string        // primi 3 char dopo prefisso azienda es. "VIW", "BEG", "CV."
  articolo: string       // codice articolo completo senza prefisso azienda
  imponibile: number
}
```

### 2. Parsing Excel (`src/lib/parseExcel.ts`)

Riscrivere la logica per:
- Leggere le colonne per nome (Sorgente, Azienda, Anno, Mese, Cliente, ecc.)
- Ignorare Sorgente, Fattura_Riga, Ordine_Riga, DataDDT
- Estrarre codice cliente e nome cliente dalla colonna "Cliente" (split su " - ")
- Rimuovere il prefisso azienda dal codice cliente (es. "FO_076654" diventa "076654")
- Estrarre il marchio dalla colonna "Articolo" (rimuovere primi 3 char per il prefisso azienda, poi prendere i primi 3 char come marchio)
- Mappare "FO" a "Fogliani" e "FU" a "Futurtec"

### 3. Dashboard (`src/pages/Dashboard.tsx`)

Aggiornare KPI e grafici:
- **KPI**: Fatturato totale, n. clienti unici, n. marchi, media per cliente
- **Grafico barre**: Top 10 clienti per fatturato (usando nomeCliente)
- **Grafico torta**: Distribuzione vendite per marchio (somma imponibile per marchio)
- **Grafico barre**: Fatturato per azienda (Fogliani vs Futurtec)
- Aggiungere filtro per azienda (FO/FU/Tutte) e per mese/anno

### 4. Anagrafiche (`src/pages/Anagrafiche.tsx`)

Aggiornare tabella e filtri:
- Colonne: Azienda, Codice Cliente, Nome Cliente, Marchio, Imponibile (aggregato)
- Filtri: per Azienda, per Marchio, per Cliente
- I dati vengono mostrati aggregati: ogni riga rappresenta la somma imponibile per combinazione cliente + marchio + mese
- Ricerca globale su nome cliente e marchio
- Ordinamento su tutte le colonne

### 5. Upload Excel (`src/pages/UploadExcel.tsx`)

Aggiornare l'anteprima per mostrare le nuove colonne (Azienda, Codice, Nome Cliente, Marchio, Imponibile).

### 6. Context e Store

Aggiornare `DataContext` e `store.ts` per utilizzare il nuovo tipo `SalesRecord`.

---

## Logica di aggregazione chiave

Le aggregazioni principali saranno:
- **Per marchio**: somma tutti gli imponibili con lo stesso marchio (es. tutti i "VIW" sommati insieme)
- **Per cliente**: somma tutti gli imponibili per lo stesso codice cliente
- **Per azienda**: somma separata per Fogliani e Futurtec
- **Per mese/anno**: possibilita' di filtrare per periodo

---

## File da modificare

1. `src/types/data.ts` - nuovo tipo SalesRecord
2. `src/lib/parseExcel.ts` - nuova logica di parsing
3. `src/lib/store.ts` - nessuna modifica strutturale (salva/carica array)
4. `src/contexts/DataContext.tsx` - nessuna modifica strutturale
5. `src/pages/Dashboard.tsx` - nuovi KPI, grafici per marchio e azienda
6. `src/pages/Anagrafiche.tsx` - nuove colonne, filtri, aggregazioni
7. `src/pages/UploadExcel.tsx` - anteprima aggiornata
