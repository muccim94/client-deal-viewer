## Miglioramenti Incentivazioni: Titolo PDF e Barra Progresso

### 1. Titolo file PDF personalizzato

Attualmente il titolo della finestra PDF e' generico ("Incentivazioni"). Verra' cambiato per includere i dati del cliente.

**Formato nuovo titolo**: `LAMINAM SPA - C009327 - 2026 - 01-01_31-12`

La durata di default sara' "01-01/31-12" (tutto l'anno). Nel titolo del file si usera' l'underscore per compatibilita'.

**Modifica in `src/pages/IncentivazioniBrowser.tsx**`:

- La funzione `openPdfWindow` ricevera' il titolo dal contesto della lettera
- Per singolo download: `{nome_cliente} - {codice_cliente} - {anno} - 01-01_31-12`
- Per download multiplo: si manterra' un titolo generico "Incentivazioni"
- Il titolo della pagina HTML (`<title>`) verra' impostato di conseguenza (alcuni browser lo usano come nome file suggerito nel salvataggio PDF)

### 2. Barra di progresso dinamica al click sulla riga

Quando l'utente clicca su una riga nella tabella delle incentivazioni, si espandera' una sezione sotto la riga che mostra una **barra orizzontale segmentata** con i vari scaglioni della lettera e il fatturato attuale del cliente sovrapposto.

**Comportamento**:

- Click sulla riga (esclusi checkbox e pulsante PDF) -> toggle della barra
- La barra mostra gli step (scaglioni) come segmenti colorati proporzionali
- Una linea o indicatore mostra dove si trova il fatturato attuale del cliente
- Sotto la barra: label con i valori degli scaglioni e il fatturato corrente

**Dati necessari**: il fatturato corrente del cliente per l'anno della lettera. Verra' recuperato tramite una query dedicata usando `get_clienti_list` (gia' filtrato per azienda FO) oppure una query diretta sulla tabella `sales_records`.

### Modifiche tecniche

**File: `src/pages/IncentivazioniBrowser.tsx**`

1. **Titolo PDF**: Modificare `openPdfWindow` per accettare un titolo personalizzato. Aggiornare `handleDownloadSingle` per passare il titolo formattato con nome cliente, codice, anno e durata.
2. **Barra progresso espandibile**:
  - Aggiungere uno stato `expandedId` per tracciare quale riga e' espansa
  - Per ogni riga espansa, fare una query per ottenere il fatturato corrente del cliente (anno della lettera, solo azienda FO) tramite una query diretta su `sales_records` con `supabase.rpc` o query filtrata
  - Renderizzare sotto la `TableRow` una riga aggiuntiva con `colSpan` pieno contenente la barra segmentata
  - La barra sara' composta da segmenti colorati (uno per scaglione) con larghezza proporzionale al fatturato dello scaglione
  - Un indicatore (linea verticale o riempimento parziale) mostra il punto attuale del fatturato
  - Etichette sotto la barra con i valori degli scaglioni raggiunti e non ancora raggiunti
3. **Componente barra**: Creare un sotto-componente `ProgressBarLettera` che riceve le righe della lettera e il fatturato attuale, e visualizza la barra segmentata orizzontale con:
  - Segmenti colorati con gradiente (verde per raggiunti, grigio per non raggiunti)
  - Etichette degli importi sotto ogni segmento
  - Indicatore del fatturato attuale con valore numerico
  - Percentuale di completamento rispetto all'ultimo scaglione