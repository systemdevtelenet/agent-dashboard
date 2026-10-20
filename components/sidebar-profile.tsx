'use client';

import { useEffect, useState } from 'react';
import { LogOut, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SidebarProfile({ name, role }: { name?: string; role?: string }) {
  const [signingOut, setSigningOut] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [profileName, setProfileName] = useState(name);
  const [profileRole, setProfileRole] = useState(role);

  useEffect(() => {
    if (name) return;
    const supabase = createClient();
    let current = true;
    Promise.all([supabase.rpc('get_my_employee_portal_access'), supabase.auth.getUser()]).then(([profileResult, userResult]) => {
      if (!current) return;
      const employee = profileResult.data?.[0];
      if (employee?.employee_name) setProfileName(employee.employee_name);
      const roleName = userResult.data.user?.app_metadata?.portal_role_name;
      if (typeof roleName === 'string' && roleName) setProfileRole(roleName);
    }).catch(() => undefined);
    return () => { current = false; };
  }, [name]);

  useEffect(() => {
    if (!confirmOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !signingOut) setConfirmOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [confirmOpen, signingOut]);

  useEffect(() => {
    const openConfirmation = () => { setSignOutError(''); setConfirmOpen(true); };
    window.addEventListener('open-logout-confirmation', openConfirmation);
    return () => window.removeEventListener('open-logout-confirmation', openConfirmation);
  }, []);

  const initials = profileName?.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'AG';

  async function signOut() {
    setSigningOut(true);
    setSignOutError('');
    const { error } = await createClient().auth.signOut();
    if (error) {
      setSignOutError('We could not sign you out. Please try again.');
      setSigningOut(false);
      return;
    }
    window.location.assign('/login');
  }

  return <div className="sidebar-profile">
    <Link className="sidebar-profile-link" href="/profile" aria-label="Open profile">
      <div className="avatar" aria-hidden="true">{initials}</div>
      <div className="sidebar-profile-copy"><strong title={profileName ?? 'Agent account'}>{profileName ?? 'Agent account'}</strong><small title={profileRole ?? 'Employee'}>{profileRole ?? 'Employee'}</small></div>
    </Link>
    <button className="profile-menu-button" type="button" aria-label="Sign out" title="Sign out" onClick={() => { setSignOutError(''); setConfirmOpen(true); }}><LogOut /></button>
    {confirmOpen && <div className="logout-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !signingOut) setConfirmOpen(false); }}>
      <section className="logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description">
        <button className="logout-close" type="button" aria-label="Close logout confirmation" onClick={() => !signingOut && setConfirmOpen(false)} disabled={signingOut}><X /></button>
        <div className="logout-symbol"><LogOut /></div>
        <h2 id="logout-title">Logout</h2>
        <p className="logout-question" id="logout-description">Are you sure you want to logout?</p>
        <p className="logout-description">You will need to sign in again to access the dashboard.</p>
        {signOutError && <p className="logout-error" role="alert">{signOutError}</p>}
        <div className="logout-actions">
          <button className="logout-cancel" type="button" onClick={() => setConfirmOpen(false)} disabled={signingOut} autoFocus>Cancel</button>
          <button className="logout-confirm" type="button" onClick={signOut} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Yes'}</button>
        </div>
      </section>
    </div>}
  </div>;
}
