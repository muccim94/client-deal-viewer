

## Ricerca mobile: pannello a scorrimento dall'alto

### Cosa cambia

Su mobile, invece del dialog centrato, la ricerca si apre come un pannello che scende dalla cima dello schermo (full-width, ancorato in alto). L'input di testo sara' in cima, seguito dai risultati sotto. Su desktop/tablet il dialog resta come e' ora.

### Implementazione in `src/pages/Dashboard.tsx`

1. **Layout condizionale mobile vs desktop**: usare `useIsMobile()` (gia' importato) per rendere due UI diverse:
   - **Mobile**: sostituire il `Dialog` con un pannello custom (`fixed inset-x-0 top-0 z-50`) con overlay, che contiene Input in alto e ScrollArea con risultati sotto. Animazione slide-down con `animate-in slide-in-from-top`.
   - **Desktop/tablet**: mantenere il `Dialog` attuale invariato (centrato, `sm:max-w-md`).

2. **Struttura mobile**:
   - Overlay scuro full-screen
   - Pannello bianco ancorato in alto, `rounded-b-lg`, padding
   - Input in cima con pulsante chiudi (X)
   - ScrollArea con risultati sotto l'input
   - `max-h-[70vh]` per non coprire tutto lo schermo

3. **Nessuna modifica al database o ad altri file**

### File coinvolti
- `src/pages/Dashboard.tsx`

