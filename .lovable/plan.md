

## Abilitare la conferma automatica dell'email

### Problema
Dopo la registrazione, il sistema richiede la conferma dell'email per attivare l'account, ma l'email di conferma non viene recapitata. Questo impedisce di completare la registrazione e accedere all'app.

### Soluzione
Abilitare la **conferma automatica dell'email** nella configurazione di autenticazione del progetto. In questo modo, quando un utente si registra, il suo account viene attivato immediatamente senza bisogno di cliccare su un link di conferma via email.

### Dettagli tecnici

1. Utilizzare lo strumento di configurazione dell'autenticazione per impostare `autoconfirm: true` per le registrazioni via email.
2. Nessuna modifica al codice dell'applicazione -- la pagina di login e registrazione funzionera' come prima, ma dopo la registrazione l'utente potra' accedere subito.

