'use client';

import { useEffect, useRef, useState } from 'react';
import { CircleHelp, LogOut, Moon, Settings, Sun, UserRound } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function TopbarProfileMenu({ name = 'Agent', role = 'Employee' }: { name?: string; role?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [dark, setDark] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'AG';

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? '')).catch(() => undefined);
    const savedTheme = window.localStorage.getItem('agent-workspace-theme');
    const isDark = savedTheme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : savedTheme === 'dark';
    setDark(isDark);
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function toggleTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? 'dark' : 'light';
    window.localStorage.setItem('agent-workspace-theme', nextDark ? 'dark' : 'light');
  }

  function requestLogout() {
    setOpen(false);
    window.dispatchEvent(new Event('open-logout-confirmation'));
  }

  return <div className="topbar-profile-anchor" ref={rootRef}>
    <button className="topbar-user" type="button" aria-label="Open account menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}>{initials}</button>
    {open && <div className="topbar-profile-menu" role="menu" aria-label="Account menu">
      <div className="topbar-profile-summary">
        <span className="topbar-profile-avatar">{initials}</span>
        <div className="topbar-profile-identity"><strong title={name}>{name}</strong><small title={email || 'Account email unavailable'}>{email || 'Account email unavailable'}</small></div>
      </div>
      <div className="topbar-profile-role">{role}</div>
      <div className="topbar-profile-divider" />
      <Link className="topbar-profile-item" href="/profile" role="menuitem" onClick={() => setOpen(false)}><UserRound /><span>My Profile</span></Link>
      <a className="topbar-profile-item" href="/#help" role="menuitem" onClick={() => setOpen(false)}><CircleHelp /><span>Help &amp; Support</span></a>
      <Link className="topbar-profile-item" href="/settings" role="menuitem" onClick={() => setOpen(false)}><Settings /><span>Settings</span></Link>
      <button className="topbar-profile-item theme-item" type="button" role="menuitem" onClick={toggleTheme}>{dark ? <Sun /> : <Moon />}<span>{dark ? 'Light Mode' : 'Dark Mode'}</span><small>{dark ? 'DARK' : 'LIGHT'}</small></button>
      <div className="topbar-profile-divider" />
      <button className="topbar-profile-item logout-menu-item" type="button" role="menuitem" onClick={requestLogout}><LogOut /><span>Logout</span></button>
    </div>}
  </div>;
}
