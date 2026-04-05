
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async (req) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ error: 'Missing bearer token' }), { status: 401 });

  const { data: authData, error: authErr } = await supabaseAnon.auth.getUser(token);
  if (authErr || !authData?.user) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });

  const userId = authData.user.id;
  const { data: adminProfile, error: adminErr } = await supabaseAdmin
    .from('admin_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (adminErr || !adminProfile) {
    return new Response(JSON.stringify({ error: 'Not authorized as admin' }), { status: 403 });
  }

  const { job_id, candidate_name, candidate_email, hours } = await req.json();
  if (!job_id || !candidate_name || !candidate_email) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  }

  const expiresAt = new Date(Date.now() + Number(hours || 2) * 60 * 60 * 1000).toISOString();
  const inviteToken = crypto.randomBytes(24).toString('hex');

  const { data, error } = await supabaseAdmin
    .from('invitations')
    .insert({
      job_id,
      candidate_name,
      candidate_email,
      token: inviteToken,
      expires_at: expiresAt,
      created_by: userId
    })
    .select('id')
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  const origin = new URL(req.url).origin;
  return new Response(JSON.stringify({
    ok: true,
    invitation_id: data.id,
    invite_url: `${origin}/candidate.html?token=${inviteToken}`
  }), { status: 200 });
}
