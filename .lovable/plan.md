

## Fix larghezza tabella Anagrafiche su mobile

### Problema
La tabella nella pagina Anagrafiche ha un leggero overflow orizzontale su mobile. La causa principale e il padding predefinito delle celle (`p-4` = 16px su tutti i lati) che, sommato su 3 colonne visibili (Nome Cliente, Fatturato, Chevron), supera la larghezza dello schermo.

### Modifiche previste

**File: `src/pages/Anagrafiche.tsx`**

1. **Ridurre padding delle TableHead visibili su mobile**: aggiungere `px-2 sm:px-4` alle intestazioni "Nome Cliente" e "Fatt. anno corrente"
2. **Ridurre padding della cella Nome Cliente**: cambiare da padding predefinito a `px-2 sm:px-4 py-2 sm:py-4`
3. **Ridurre padding della cella ChevronRight**: aggiungere `px-1 sm:px-4` per minimizzare lo spazio occupato dalla freccia
4. **Ridurre la larghezza della colonna chevron**: da `w-8` a `w-6 sm:w-8`
5. **Aggiungere `table-fixed` alla Table su mobile** per forzare la tabella a rispettare la larghezza del contenitore, usando `className="sm:table-auto table-fixed"`

### Dettagli tecnici

- TableHead "Nome Cliente": aggiungere `px-2 sm:px-4`
- TableHead "Fatt. anno corrente": aggiungere `px-2 sm:px-4`
- TableHead chevron: `w-6 sm:w-8 px-1 sm:px-4`
- TableCell nome cliente: gia ha `px-2 sm:px-4` -- OK
- TableCell fatturato: gia ha `px-2 sm:px-4` -- OK
- TableCell chevron: aggiungere `px-1 sm:px-4 py-2`
- Aggiungere `className="table-fixed sm:table-auto"` al componente `<Table>` per forzare il rispetto della larghezza su mobile

Nessuna migrazione SQL necessaria.

