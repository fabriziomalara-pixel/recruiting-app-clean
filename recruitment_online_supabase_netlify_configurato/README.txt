APP SELEZIONE PERSONALE - VERSIONE ONLINE STARTER
===================================================

COSA CONTIENE
- Frontend statico:
  public/index.html
  public/admin.html
  public/candidate.html
  public/privacy.html
  public/styles.css
  public/app.js
- Backend serverless Netlify:
  netlify/functions/create-invite.js
  netlify/functions/validate-invite.js
  netlify/functions/submit-candidate.js
- Database Supabase:
  supabase/schema.sql
- Config:
  package.json
  netlify.toml
  .env.example

ARCHITETTURA
- Admin:
  login con Supabase Auth
  crea posizione
  genera invito candidato con scadenza in ore
  vede candidature e punteggi
- Candidato:
  apre link con token
  il backend verifica token e scadenza
  compila dati, consensi e test
  invia la candidatura
- Database:
  jobs, invitations, submissions, admin_profiles

PRIMA CONFIGURAZIONE
1. Crea un progetto su Supabase.
2. In Supabase -> SQL Editor esegui il file supabase/schema.sql
3. In Supabase -> Authentication crea il tuo utente admin con email e password
4. Inserisci il tuo user id in admin_profiles con SQL, esempio:
   insert into public.admin_profiles (id, full_name) values ('UUID_DEL_TUO_UTENTE', 'Fabrizio Malara');

5. Crea un file .env partendo da .env.example e inserisci:
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE

6. Installa dipendenze:
   npm install

7. Avvia in locale:
   npx netlify dev

8. Apri l'app locale e prova:
   - /admin.html
   - /candidate.html?token=...

DEPLOY
- Puoi caricarla su Netlify.
- Le variabili ambiente vanno impostate nel pannello Netlify e non nel repository.

NOTE IMPORTANTI
- Il service role NON va mai esposto nel browser.
- Il frontend usa la chiave anon/publishable.
- La sicurezza vera è data da Supabase Auth + RLS + funzioni server-side.
- Questa è una base seria ma non è ancora hardening completo enterprise.

PASSO SUCCESSIVO CONSIGLIATO
- aggiungere caricamento CV su Supabase Storage
- aggiungere PDF report
- aggiungere cancellazione automatica dati a scadenza
