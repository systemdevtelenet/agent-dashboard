'use client';

import { useEffect, useState } from 'react';
import { CalendarRange, Clock3, FileText, LayoutDashboard, Menu, Settings, X } from 'lucide-react';
import SidebarProfile from '@/components/sidebar-profile';

type AgentPage = 'dashboard' | 'attendance' | 'profile' | 'settings' | 'incident-reports';

const links = [
  { id: 'dashboard', href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'attendance', href: '/attendance', label: 'My Attendance', icon: Clock3 },
  { id: 'schedule', href: '/#schedule', label: 'My schedule', icon: CalendarRange },
  { id: 'incident-reports', href: '/incident-reports', label: 'My Incident Reports', icon: FileText },
];

export default function AgentSidebar({ activePage }: { activePage: AgentPage }) {
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const shell = document.querySelector('.dashboard-shell');
    shell?.classList.toggle('sidebar-wide', expanded);
    return () => shell?.classList.remove('sidebar-wide');
  }, [expanded]);

  useEffect(() => {
    const onOpen = () => {
      if (window.matchMedia('(max-width: 820px)').matches) setMobileOpen(true);
      else setExpanded(value => !value);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('open-agent-sidebar', onOpen);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('open-agent-sidebar', onOpen);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return <>
    <aside className={`sidebar ${expanded ? 'sidebar-expanded' : 'sidebar-collapsed'} ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand-row">
        <a className="brand" href="/" aria-label="Cebu Tele-Net Philippines">
          <span className="brand-emblem">CTNP</span><span className="brand-copy"><strong>Cebu Tele-Net</strong><small>EMPLOYEE WORKSPACE</small></span>
        </a>
        <button className="sidebar-collapse" type="button" aria-label={expanded || mobileOpen ? 'Collapse sidebar' : 'Expand sidebar'} title={expanded || mobileOpen ? 'Collapse sidebar' : 'Expand sidebar'} onClick={() => {
          if (window.matchMedia('(max-width: 820px)').matches) setMobileOpen(value => !value);
          else setExpanded(value => !value);
        }}><Menu /></button>
      </div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map(({ id, href, label, icon: Icon }) => <a className={`sidebar-link ${activePage === id ? 'active' : ''}`} href={href} key={id} title={label} aria-label={label} aria-current={activePage === id ? 'page' : undefined} onClick={() => setMobileOpen(false)}><Icon /><span>{label}</span></a>)}
      </nav>
      <div className="sidebar-bottom">
        <a className={`sidebar-link sidebar-settings ${activePage === 'settings' ? 'active' : ''}`} href="/settings" title="Settings" aria-label="Settings" aria-current={activePage === 'settings' ? 'page' : undefined} onClick={() => setMobileOpen(false)}><Settings /><span>Settings</span></a>
        <SidebarProfile name="Nonie May Elimon" role="Agent" />
      </div>
    </aside>
    {mobileOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
  </>;
}
