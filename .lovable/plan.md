

## Download Template Excel per Anagrafiche

Aggiungere un pulsante "Scarica Template" nella sezione "Importa Anagrafiche" che genera e scarica un file Excel vuoto con le colonne corrette.

### Funzionamento

- Un pulsante "Scarica Template" apparira' nella card "Importa Anagrafiche", visibile nella zona di upload (prima di caricare un file)
- Cliccando il pulsante, viene generato e scaricato un file `template_anagrafiche.xlsx` con le colonne: **Nome Cliente**, **Partita IVA**, **Indirizzo**, **Provincia**, **Telefono**, **Email**
- Il file conterra' solo l'intestazione, senza dati

### Modifiche tecniche

**File: `src/pages/UploadExcel.tsx`**

- Aggiungere una funzione `downloadAnagraficaTemplate` che usa la libreria `xlsx` (gia' installata) per creare un workbook con un foglio contenente solo le intestazioni e avviare il download
- Aggiungere un pulsante `Download` sotto il testo descrittivo nella drop zone delle anagrafiche, con `e.stopPropagation()` per non attivare il file picker

