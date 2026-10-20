'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { provisionEmployeeLogin } from './actions';
import './login.css';

const BUCKET = 'Images';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [message, setMessage] = useState('');
  const supabase = useMemo(() => createClient(), []);
  const backgroundUrl = supabase.storage.from(BUCKET).getPublicUrl('ctnp-bg-image-1.png').data.publicUrl;
  const logoUrl = supabase.storage.from(BUCKET).getPublicUrl('ctnp-logo-full.png').data.publicUrl;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'employee_access') {
      setMessage("We couldn't match this account to an active employee record. Contact your administrator.");
    }
  }, []);

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy('email');
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      const provision = await provisionEmployeeLogin(email, password);
      if (!provision.ok) {
        setMessage(provision.reason === 'unavailable'
          ? 'Account setup is unavailable right now. Please contact your administrator.'
          : 'Email or password is incorrect.');
        setBusy(null);
        return;
      }
      const retry = await supabase.auth.signInWithPassword({ email: email.trim(), password: provision.password });
      if (retry.error) {
        setMessage('We could not finish signing in. Please contact your administrator.');
        setBusy(null);
        return;
      }
    }
    const { data: portalAccess, error: accessError } = await supabase.rpc('get_my_portal_access');
    if (accessError || portalAccess !== true) {
      await supabase.auth.signOut();
      setMessage("We couldn't match this account to an active employee record. Contact your administrator.");
      setBusy(null);
      return;
    }
    const requestedNext = new URLSearchParams(window.location.search).get('next');
    const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/';
    router.replace(next);
    router.refresh();
  }

  async function handleGoogleLogin() {
    setBusy('google');
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage(error.message);
      setBusy(null);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setMessage('Enter your email address first, then choose Forgot password.');
      return;
    }
    setBusy('email');
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setBusy(null);
    setMessage(error ? error.message : 'If an account exists for this email, a reset link is on its way.');
  }

  return (
    <main className="login-page" style={{ backgroundImage: `linear-gradient(110deg, rgba(13, 22, 31, .78), rgba(10, 21, 32, .61)), url("${backgroundUrl}")` }}>
      <section className="login-card" aria-label="Sign in to Agent Workspace">
        <div className="login-brand-panel">
          <div className="brand-image-wrap"><img className="login-brand-image" src={logoUrl} alt="CTNP and Telenet logos" /></div>
          <div className="login-brand-caption">
            <strong>CEBU TELE-NET PHILIPPINES</strong>
            <span>AGENT WORKSPACE</span>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-heading">
            <div className="mobile-brand"><img src={logoUrl} alt="CTNP and Telenet"/></div>
            <h1>LOGIN</h1>
            <p>Enter your credentials to access Agent Workspace.</p>
          </div>

          <form className="login-form" onSubmit={handleEmailLogin}>
            <label className="login-field">
              <span>Email</span>
              <span className="input-wrap"><Mail aria-hidden="true"/><input type="email" name="email" autoComplete="username" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /></span>
            </label>
            <label className="login-field">
              <span>Password</span>
              <span className="input-wrap"><LockKeyhole aria-hidden="true"/><input type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required/><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff/> : <Eye/>}</button></span>
            </label>

            <div className="login-options"><label className="remember-option"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/><span>Remember me</span></label><button type="button" className="forgot-link" onClick={handleForgotPassword}>Forgot password?</button></div>
            {message && <p className="login-message" role="alert">{message}</p>}
            <button className="login-submit" type="submit" disabled={busy !== null}>{busy === 'email' ? <><LoaderCircle className="login-spinner"/> Signing in…</> : 'LOGIN'}</button>
          </form>

          <div className="login-divider"><span>or</span></div>
          <button className="google-login" type="button" onClick={handleGoogleLogin} disabled={busy !== null}><span className="google-mark">G</span>{busy === 'google' ? 'Connecting to Google…' : 'Continue with Google'}</button>
          <p className="login-help">Having trouble signing in? <a href="mailto:people@ctnp.example">Contact your administrator</a></p>
        </div>
      </section>
      <footer className="login-footer">© 2026 Cebu Tele-Net Philippines <span>·</span> Agent Workspace</footer>
    </main>
  );
}
