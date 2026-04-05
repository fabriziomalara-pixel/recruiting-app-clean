
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return new Response(JSON.stringify({ valid: false, error: 'Missing token' }), { status: 400 });

  const { data: invite, error } = await supabaseAdmin
    .from('invitations')
    .select('id,candidate_name,candidate_email,expires_at,status,jobs(title)')
    .eq('token', token)
    .maybeSingle();

  if (error || !invite) {
    return new Response(JSON.stringify({ valid: false, error: 'Invito non trovato' }), { status: 404 });
  }

  if (invite.status === 'submitted') {
    return new Response(JSON.stringify({ valid: false, error: 'Invito già utilizzato' }), { status: 400 });
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from('invitations').update({ status: 'expired' }).eq('id', invite.id);
    return new Response(JSON.stringify({ valid: false, error: 'Invito scaduto' }), { status: 400 });
  }

  if (invite.status === 'invited') {
    await supabaseAdmin.from('invitations').update({ status: 'opened', opened_at: new Date().toISOString() }).eq('id', invite.id);
  }

  return new Response(JSON.stringify({
    valid: true,
    invitation_id: invite.id,
    candidate_name: invite.candidate_name,
    candidate_email: invite.candidate_email,
    expires_at: invite.expires_at,
    job_title: invite.jobs?.title || 'Posizione aperta'
  }), { status: 200 });
}
