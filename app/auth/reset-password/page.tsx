'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const backgroundUrl = supabase.storage.from('Images').getPublicUrl('ctnp-bg-image-1.png').data.publicUrl;

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : 'Password updated. You can now sign in.');
    setBusy(false);
  }

  return <main className="login-page" style={{ backgroundImage: `linear-gradient(110deg, rgba(13, 22, 31, .78), rgba(10, 21, 32, .61)), url('${backgroundUrl}')` }}>
    <section className="login-card reset-card"><div className="login-form-panel"><div className="login-heading"><h1>RESET PASSWORD</h1><p>Choose a new password for your Training Performance Hub account.</p></div><form className="login-form" onSubmit={updatePassword}><label className="login-field"><span>New password</span><span className="input-wrap"><input type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required/></span></label>{message && <p className="login-message" role="status">{message}</p>}<button className="login-submit" type="submit" disabled={busy}>{busy ? 'Updating…' : 'UPDATE PASSWORD'}</button></form></div></section>
  </main>;
}
