

## Chiusura automatica sidebar al click su una voce di menu

### Problema
Quando si clicca una voce del menu, la sidebar resta aperta sia su mobile (Sheet) che su desktop (sidebar espansa). L'utente vuole che si chiuda automaticamente in entrambi i casi.

### Soluzione
In `AppSidebar.tsx`:
1. Importare `useSidebar` dal componente sidebar
2. Wrappare ogni `NavLink` con un `onClick` che:
   - Su mobile: chiama `setOpenMobile(false)` per chiudere lo Sheet
   - Su desktop/tablet: chiama `toggleSidebar()` per collassare la sidebar (solo se è aperta/expanded)

### File coinvolto
- `src/components/AppSidebar.tsx` — aggiungere `useSidebar` e handler `onClick` sui NavLink

