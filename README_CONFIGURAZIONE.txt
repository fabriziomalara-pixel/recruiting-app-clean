VERSIONE CONFIGURATA

Ho già inserito questi dati nell'app:
- SUPABASE_URL = https://ocyubbteisvniegyxdmp.supabase.co
- SUPABASE_PUBLISHABLE_KEY = sb_publishable_vsKhuTfB4boZGlcZBXdd-g_oe89wuIf

ATTENZIONE
Questa configurazione riguarda solo la parte frontend/public.
Per far funzionare davvero la versione online con inviti e candidature, in Netlify dovrai ancora impostare:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE

La chiave service role NON va inserita nel browser o nei file pubblici.
