

## Link Google Maps nell'indirizzo anagrafica

Rendere l'indirizzo nella card "Scheda Anagrafica" un link cliccabile che apre Google Maps con l'indirizzo precompilato.

### Modifica

**File: `src/pages/ClienteDettaglio.tsx`**

- Wrappare il testo dell'indirizzo in un tag `<a>` con `href` che punta a `https://www.google.com/maps/search/?api=1&query={indirizzo}` (URL-encoded)
- Aggiungere `target="_blank"` e `rel="noopener noreferrer"` per aprire in nuova scheda
- Styling: colore primario e underline on hover per indicare che e' cliccabile

