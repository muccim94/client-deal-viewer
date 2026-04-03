

## Piano: Swipe-right per aprire la sidebar su mobile

### Cosa faremo
Aggiungere un listener touch nel `SidebarProvider` che rileva uno swipe da sinistra verso destra sul bordo sinistro dello schermo e apre la sidebar mobile.

### Modifica: `src/components/ui/sidebar.tsx`

Aggiungere un `useEffect` dentro `SidebarProvider` (dopo il keyboard shortcut effect, ~riga 89) che:

1. Ascolta `touchstart` — registra la posizione X iniziale, solo se il touch parte entro 30px dal bordo sinistro
2. Ascolta `touchmove` — calcola la distanza orizzontale
3. Ascolta `touchend` — se lo swipe è >70px verso destra e il menu mobile è chiuso, chiama `setOpenMobile(true)`

Condizione: attivo solo quando `isMobile` è true. Nessun impatto su desktop.

```typescript
React.useEffect(() => {
  if (!isMobile) return;
  let startX = 0;
  let startY = 0;
  const onTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    if (startX < 30 && dx > 70 && dy < 100) {
      setOpenMobile(true);
    }
  };
  document.addEventListener("touchstart", onTouchStart);
  document.addEventListener("touchend", onTouchEnd);
  return () => {
    document.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchend", onTouchEnd);
  };
}, [isMobile, setOpenMobile]);
```

Nessun'altra modifica necessaria — la sidebar mobile usa già il componente Sheet che gestisce la chiusura.

