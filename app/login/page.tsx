'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { provisionEmployeeLogin } from './actions';
import './login.css';

const agentHeadlines = ['Stay informed.', 'Stay on track.', 'Stay connected.'];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);
  const [message, setMessage] = useState('');
  const [heroPhraseIndex, setHeroPhraseIndex] = useState(0);
  const [heroText, setHeroText] = useState(agentHeadlines[0]);
  const [deletingHeadline, setDeletingHeadline] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = agentHeadlines[heroPhraseIndex];
    let timer: number;
    if (!deletingHeadline && heroText === target) {
      timer = window.setTimeout(() => setDeletingHeadline(true), 1800);
    } else if (deletingHeadline && heroText.length === 0) {
      timer = window.setTimeout(() => {
        setDeletingHeadline(false);
        setHeroPhraseIndex(index => (index + 1) % agentHeadlines.length);
      }, 220);
    } else {
      timer = window.setTimeout(() => {
        setHeroText(text => deletingHeadline ? text.slice(0, -1) : target.slice(0, text.length + 1));
      }, deletingHeadline ? 55 : 95);
    }
    return () => window.clearTimeout(timer);
  }, [deletingHeadline, heroPhraseIndex, heroText]);

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
      setMessage('Enter your email address first, then choose Need help? to request a reset link.');
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
    <main className="login-page">
      <section className="login-story-panel" aria-label="Agent Workspace overview">
        <div className="login-hero-frame">
          <img className="login-hero-image" src="/login-hero.png" alt="Customer service representative wearing a headset" />
        </div>
        <div className="login-story-overlay" />
        <div className="login-story-rings" aria-hidden="true"><i /><i /></div>
        <div className="login-story-content">
          <div className="login-story-copy">
            <h2 className="login-story-headline"><span>Show up.</span><span>Stay ready.</span><span className="login-headline-accent">{heroText}<i className="login-type-cursor" aria-hidden="true" /></span></h2>
            <div className="login-accent-rule" />
            <p>Keep up with your attendance, schedule, and important updates across your agent workspace.</p>
          </div>
          <div className="login-feature-row">
            <div><span>ATTENDANCE</span><strong>Review your workday</strong></div>
            <div><span>SCHEDULE</span><strong>Know what’s next</strong></div>
            <div><span>UPDATES</span><strong>Reports and team notices</strong></div>
          </div>
          <footer className="login-story-footer"><span>AGENT WORKSPACE</span><span>CTNP | PHILIPPINES</span></footer>
        </div>
      </section>

      <section className="login-form-panel" aria-label="Sign in to Agent Workspace">
        <div className="login-form-content">
          <div className="login-mobile-kicker">ATTEND. STAY READY. STAY INFORMED.</div>
          <img className="login-logo" src="/logo.png" alt="Cebu Tele-Net Philippines" />
          <div className="login-heading">
            <h1>Welcome back</h1>
            <p>Sign in to your agent workspace.</p>
          </div>
          <form className="login-form" onSubmit={handleEmailLogin}>
            <label className="login-field">
              <span>EMAIL</span>
              <span className="input-wrap"><UserRound aria-hidden="true" /><input type="email" name="email" autoComplete="username" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required /></span>
            </label>
            <label className="login-field">
              <span>PASSWORD</span>
              <span className="input-wrap"><LockKeyhole aria-hidden="true" /><input type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></span>
            </label>
            <div className="login-options"><span /><button type="button" className="forgot-link" onClick={handleForgotPassword}>Need help?</button></div>
            {message && <p className="login-message" role="alert">{message}</p>}
            <button className="login-submit" type="submit" disabled={busy !== null}>{busy === 'email' ? <><LoaderCircle className="login-spinner" /> Signing in…</> : 'Sign In'}</button>
          </form>
          <div className="login-divider"><span>OR</span></div>
          <button className="google-login" type="button" onClick={handleGoogleLogin} disabled={busy !== null}>
            <svg className="google-mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.7c3.9-3.6 6-8.8 6-14.9Z" /><path fill="#FF3D00" d="M24 44c5.5 0 10.2-1.8 13.6-4.8l-6.7-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.9-3.6-11.5-8.5H5.6v5.2A20 20 0 0 0 24 44Z" /><path fill="#4CAF50" d="M12.5 27.6a12 12 0 0 1 0-7.2v-5.2H5.6a20 20 0 0 0 0 17.6l6.9-5.2Z" /><path fill="#1976D2" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.6 15.2l6.9 5.2C14.1 15.6 18.7 12 24 12Z" /></svg>
            {busy === 'google' ? 'Connecting to Google…' : 'Sign in with Google'}
          </button>
        </div>
        <footer className="login-form-footer">AGENT WORKSPACE <span>|</span> INTERNAL USE ONLY</footer>
      </section>
    </main>
  );
}
