# Piano di sviluppo - Clone Flowgorithm Web App

## Obiettivo

Realizzare una web app ispirata a Flowgorithm che permetta di creare algoritmi tramite flowchart, modificarli visualmente, eseguirli, fare debugging passo-passo e salvare/caricare i progetti.

Il primo traguardo consigliato e' un MVP client-side: niente backend obbligatorio, salvataggio locale in JSON, editor visuale, blocchi essenziali e motore di esecuzione funzionante.

## Stack consigliato

- React + TypeScript
- Vite
- React Flow per canvas, nodi e connessioni
- Zustand per stato applicativo
- expr-eval o parser dedicato per valutare espressioni in modo controllato
- CSS Modules, Tailwind oppure CSS plain, in base alle preferenze del progetto
- localStorage e import/export JSON per la persistenza iniziale

## Funzionalita' MVP

- Canvas per flowchart
- Palette blocchi
- Blocchi:
  - Start
  - End
  - Input
  - Output
  - Assignment
  - If / Else
  - While
- Pannello proprieta' per modificare il blocco selezionato
- Collegamenti tra blocchi
- Validazione del diagramma
- Esecuzione completa
- Esecuzione step-by-step
- Evidenziazione del nodo corrente
- Console output
- Tabella variabili
- Salvataggio e caricamento in JSON

## Modello dati iniziale

```ts
type FlowNode = {
  id: string;
  type: "start" | "end" | "input" | "output" | "assign" | "if" | "while";
  data: {
    label: string;
    variable?: string;
    expression?: string;
    prompt?: string;
  };
  position: {
    x: number;
    y: number;
  };
};

type FlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: "next" | "true" | "false";
};

type FlowProject = {
  id: string;
  name: string;
  version: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
};
```

## Piano per fasi

### Fase 0 - Analisi e setup

Durata stimata: 1-2 giorni

Attivita':

- Definire il perimetro preciso dell'MVP
- Creare progetto React + TypeScript + Vite
- Installare React Flow e librerie di supporto
- Definire struttura cartelle
- Impostare linting, formatting e script di build

Deliverable:

- Progetto avviabile in locale
- Struttura base dell'app
- Pagina principale vuota con layout iniziale

### Fase 1 - Editor visuale base

Durata stimata: 3-5 giorni

Attivita':

- Integrare React Flow
- Creare canvas centrale
- Creare palette laterale dei blocchi
- Aggiungere nodi al canvas
- Spostare nodi con drag & drop
- Collegare nodi tramite edge
- Selezionare ed eliminare nodi/edge
- Creare rendering custom per i blocchi principali

Deliverable:

- Editor visuale interattivo
- Creazione manuale di un flowchart semplice
- Blocchi visualmente distinguibili

### Fase 2 - Stato applicativo e modello progetto

Durata stimata: 2-3 giorni

Attivita':

- Definire modello dati stabile
- Centralizzare stato con Zustand
- Gestire nodi, edge e progetto corrente
- Implementare nuovo progetto
- Implementare salvataggio locale
- Implementare caricamento locale
- Implementare import/export JSON

Deliverable:

- Flowchart serializzabile in JSON
- Progetti salvabili e ricaricabili
- Base dati coerente per editor e runtime

### Fase 3 - Pannello proprieta'

Durata stimata: 2-4 giorni

Attivita':

- Creare pannello laterale per nodo selezionato
- Modificare label, variabile, espressione e prompt
- Validare input base dei campi
- Aggiornare il canvas in tempo reale
- Gestire stati vuoti, selezione multipla e nessuna selezione

Deliverable:

- Editing completo dei dati dei blocchi
- UX minima ma solida per configurare il diagramma

### Fase 4 - Validazione flowchart

Durata stimata: 3-4 giorni

Attivita':

- Verificare presenza di un solo Start
- Verificare presenza di almeno un End
- Verificare connessioni richieste per ogni tipo di blocco
- Verificare uscite true/false per If e While
- Segnalare nodi irraggiungibili
- Mostrare errori in pannello dedicato
- Evidenziare nodi con errori sul canvas

Deliverable:

- Validatore strutturale
- Messaggi errore leggibili
- Blocco esecuzione in caso di diagramma non valido

### Fase 5 - Motore di esecuzione

Durata stimata: 5-8 giorni

Attivita':

- Creare interprete del flowchart
- Gestire stato runtime
- Implementare Assignment
- Implementare Output
- Implementare Input con richiesta valore
- Implementare If / Else
- Implementare While
- Gestire variabili e tipi base
- Gestire errori runtime
- Evitare eval diretto per le espressioni

Deliverable:

- Esecuzione completa del diagramma
- Console output
- Stato variabili aggiornato
- Errori runtime comprensibili

### Fase 6 - Debug step-by-step

Durata stimata: 3-5 giorni

Attivita':

- Implementare comandi Run, Step, Pause, Stop, Reset
- Evidenziare il nodo corrente
- Aggiornare variabili a ogni step
- Gestire input durante esecuzione
- Aggiungere limite anti-loop infinito
- Mostrare storico output

Deliverable:

- Debugger visuale base
- Esecuzione passo-passo funzionante
- Esperienza simile ai concetti principali di Flowgorithm

### Fase 7 - Rifinitura UI/UX

Durata stimata: 4-6 giorni

Attivita':

- Rifinire layout principale
- Migliorare toolbar e palette
- Aggiungere icone e tooltip
- Migliorare pannello errori
- Migliorare console e tabella variabili
- Gestire responsive minimo
- Aggiungere stati vuoti e messaggi di feedback

Deliverable:

- Interfaccia piu' pulita e usabile
- Workflow completo piu' fluido
- MVP presentabile

### Fase 8 - Test e stabilizzazione

Durata stimata: 4-7 giorni

Attivita':

- Test unitari per validatore
- Test unitari per motore runtime
- Test manuali su flowchart di esempio
- Test di import/export
- Test di casi errore
- Correzione bug principali
- Ottimizzazione minima delle performance

Deliverable:

- MVP stabile
- Suite test essenziale
- Esempi di flowchart dimostrativi

## Stima complessiva MVP

| Fase | Durata stimata |
| --- | ---: |
| Fase 0 - Analisi e setup | 1-2 giorni |
| Fase 1 - Editor visuale base | 3-5 giorni |
| Fase 2 - Stato e modello progetto | 2-3 giorni |
| Fase 3 - Pannello proprieta' | 2-4 giorni |
| Fase 4 - Validazione | 3-4 giorni |
| Fase 5 - Motore di esecuzione | 5-8 giorni |
| Fase 6 - Debug step-by-step | 3-5 giorni |
| Fase 7 - Rifinitura UI/UX | 4-6 giorni |
| Fase 8 - Test e stabilizzazione | 4-7 giorni |
| Totale | 27-44 giorni |

Stima realistica per una persona: 5-9 settimane, considerando sviluppo part-time o normale margine per imprevisti.

Stima aggressiva per una persona full-time con esperienza su React Flow: 4-6 settimane.

Stima per due persone:

- Frontend/editor visuale
- Runtime/validazione/test

Totale stimato: 3-5 settimane.

## Funzionalita' post-MVP

- Undo/redo
- Layout automatico del diagramma
- Funzioni e procedure
- Array e strutture dati
- Tipi piu' rigorosi
- Generazione pseudocodice
- Esportazione immagine/PDF
- Condivisione link progetto
- Backend con account utente
- Libreria di esempi
- Modalita' didattica con esercizi
- Traduzione UI italiano/inglese

## Rischi principali

### Motore espressioni

La valutazione delle espressioni e' una parte delicata. Usare `eval` diretto e' sconsigliato. Conviene usare un parser limitato oppure una libreria controllata.

### Struttura dei cicli

If e While richiedono regole chiare sulle uscite e sui rientri. Una validazione debole puo' rendere il runtime instabile.

### UX del canvas

Disegnare nodi e collegamenti e' semplice con React Flow, ma rendere l'editing davvero comodo richiede iterazione.

### Scope creep

Flowgorithm ha molte funzionalita'. Per arrivare a un risultato concreto e' importante chiudere prima un MVP piccolo ma funzionante.

## Priorita' consigliata

1. Creare editor visuale con Start, End, Assignment e Output.
2. Definire JSON progetto stabile.
3. Implementare salvataggio/caricamento.
4. Implementare runtime lineare.
5. Aggiungere If.
6. Aggiungere While.
7. Aggiungere step-by-step.
8. Rifinire UI e test.

## Milestone suggerite

### Milestone 1 - Editor funzionante

Durata: circa 1 settimana

Risultato: l'utente puo' creare e salvare un diagramma semplice.

### Milestone 2 - Algoritmi lineari eseguibili

Durata: circa 1 settimana aggiuntiva

Risultato: assignment e output funzionano, con console e variabili.

### Milestone 3 - Controllo di flusso

Durata: circa 1-2 settimane aggiuntive

Risultato: If e While funzionano correttamente.

### Milestone 4 - Debugger visuale

Durata: circa 1 settimana aggiuntiva

Risultato: esecuzione passo-passo con nodo corrente e variabili aggiornate.

### Milestone 5 - MVP rifinito

Durata: circa 1-2 settimane aggiuntive

Risultato: app stabile, testata e presentabile.
