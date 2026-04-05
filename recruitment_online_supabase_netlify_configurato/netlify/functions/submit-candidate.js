
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async (req) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

  const body = await req.json();
  const {
    token,
    full_name,
    email,
    phone,
    city,
    experience,
    consent_privacy,
    consent_future,
    personality_answers,
    situational_answers,
    personality_score,
    situational_score,
    final_score
  } = body || {};

  if (!token || !full_name || !email || !consent_privacy) {
    return new Response(JSON.stringify({ error: 'Dati mancanti o consenso privacy non accettato' }), { status: 400 });
  }

  const { data: invite, error } = await supabaseAdmin
    .from('invitations')
    .select('id,expires_at,status')
    .eq('token', token)
    .maybeSingle();

  if (error || !invite) {
    return new Response(JSON.stringify({ error: 'Invito non trovato' }), { status: 404 });
  }

  if (invite.status === 'submitted') {
    return new Response(JSON.stringify({ error: 'Invito già utilizzato' }), { status: 400 });
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from('invitations').update({ status: 'expired' }).eq('id', invite.id);
    return new Response(JSON.stringify({ error: 'Invito scaduto' }), { status: 400 });
  }

  const { error: insertErr } = await supabaseAdmin
    .from('submissions')
    .insert({
      invitation_id: invite.id,
      full_name,
      email,
      phone,
      city,
      experience,
      consent_privacy,
      consent_future,
      personality_answers,
      situational_answers,
      personality_score,
      situational_score,
      final_score
    });

  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), { status: 400 });
  }

  await supabaseAdmin
    .from('invitations')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', invite.id);

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
