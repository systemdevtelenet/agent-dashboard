'use client';

import { useEffect, useState } from 'react';
import {
  Bell, BriefcaseBusiness, CalendarDays, Check, Clock3, IdCard, Mail, Monitor,
  Moon, Phone, RotateCcw, Save, Settings as SettingsIcon, ShieldCheck, Sun, Tag,
  UserRound, UsersRound,
} from 'lucide-react';
import AgentSidebar from '@/components/agent-sidebar';
import AgentSidebarToggle from '@/components/agent-sidebar-toggle';
import TopbarDatePicker from '@/components/topbar-date-picker';
import TopbarProfileMenu from '@/components/topbar-profile-menu';

type SettingsTab = 'profile' | 'notifications' | 'general';
type ThemePreference = 'light' | 'dark' | 'system';

const profile = {
  firstName: 'Nonie May',
  middleName: 'Not provided',
  lastName: 'Elimon',
  suffix: 'Not provided',
  employeeId: 'Not linked',
  role: 'Customer Service Associate',
  email: 'Not provided',
  phone: 'Not provided',
  startDate: 'Not provided',
  account: 'Customer Support',
  task: 'Customer Service',
  supervisor: 'Not provided',
};

function Field({ label, value }: { label: string; value: string }) {
  const Icon = label.includes('Name') ? UserRound
    : label.includes('ID') ? IdCard
    : label.includes('Role') ? ShieldCheck
    : label.includes('Email') ? Mail
    : label.includes('Number') ? Phone
    : label === 'Account' || label === 'Primary Task' ? BriefcaseBusiness
    : label.includes('Supervisor') ? UsersRound
    : label.includes('Schedule') ? CalendarDays
    : Tag;
  return <label className="settings-field"><span className="settings-field-label"><Icon />{label}</span><input value={value} readOnly aria-readonly="true" /></label>;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('profile');
  const [notice, setNotice] = useState('');
  const [theme, setTheme] = useState<ThemePreference>('light');
  const [preferences, setPreferences] = useState({ attendance: true, schedule: true, announcements: true, compact: false, weekMonday: true });

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('agent-workspace-theme');
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = () => { document.documentElement.dataset.theme = media.matches ? 'dark' : 'light'; };
    syncTheme();
    media.addEventListener('change', syncTheme);
    return () => media.removeEventListener('change', syncTheme);
  }, [theme]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  }

  function resetDefaults() {
    setPreferences({ attendance: true, schedule: true, announcements: true, compact: false, weekMonday: true });
    showNotice('Settings restored to the default values.');
  }

  function saveSettings() {
    showNotice('Your preferences are saved for this preview.');
  }

  function togglePreference(key: keyof typeof preferences) {
    setPreferences(current => ({ ...current, [key]: !current[key] }));
  }

  function selectTheme(nextTheme: ThemePreference) {
    setTheme(nextTheme);
    window.localStorage.setItem('agent-workspace-theme', nextTheme);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = nextTheme === 'system' ? (systemDark ? 'dark' : 'light') : nextTheme;
  }

  return <div className="dashboard-shell">
    <AgentSidebar activePage="settings" />
    <main className="main-panel">
      <header className="topbar"><AgentSidebarToggle /><div className="topbar-actions"><TopbarDatePicker /><TopbarProfileMenu name="Nonie May Elimon" role="Customer Service Associate" /></div></header>
      <div className="dashboard-content settings-page-content">
        <div className="settings-page-heading">
          <div><h1>System Settings</h1><p>Manage your profile view, notifications, and workspace preferences.</p></div>
          <div className="settings-heading-actions"><button className="settings-reset" type="button" onClick={resetDefaults}><RotateCcw />Reset to Default</button><button className="settings-save" type="button" onClick={saveSettings}><Save />Save Changes</button></div>
        </div>

        <div className="settings-tabs" role="tablist" aria-label="Settings sections">
          <button type="button" role="tab" aria-selected={tab === 'profile'} className={tab === 'profile' ? 'selected' : ''} onClick={() => setTab('profile')}><UserRound />Profile</button>
          <button type="button" role="tab" aria-selected={tab === 'notifications'} className={tab === 'notifications' ? 'selected' : ''} onClick={() => setTab('notifications')}><Bell />Notifications</button>
          <button type="button" role="tab" aria-selected={tab === 'general'} className={tab === 'general' ? 'selected' : ''} onClick={() => setTab('general')}><SettingsIcon />General</button>
        </div>

        {tab === 'profile' && <section className="settings-panel" role="tabpanel">
          <div className="settings-section-heading"><div><h2>Profile Information</h2><p>Review the employee details associated with your agent account.</p></div><span className="settings-managed"><ShieldCheck />Company managed</span></div>
          <div className="settings-profile-banner">
            <div className="settings-profile-avatar">NM</div>
            <div className="settings-profile-main"><h3>{profile.firstName} {profile.lastName}</h3><span className="settings-role-pill">CUSTOMER SERVICE ASSOCIATE</span><p>{profile.email}</p>
              <div className="settings-profile-facts"><div><span>EMPLOYEE ID</span><strong>{profile.employeeId}</strong></div><div><span>START DATE</span><strong>{profile.startDate}</strong></div><div><span>ACCOUNT</span><strong>{profile.account}</strong></div><div><span>PRIMARY TASK</span><strong>{profile.task}</strong></div></div>
            </div>
          </div>
          <div className="settings-fields-grid">
            <Field label="First Name" value={profile.firstName} /><Field label="Middle Name" value={profile.middleName} />
            <Field label="Last Name" value={profile.lastName} /><Field label="Suffix Name" value={profile.suffix} />
            <Field label="Employee ID" value={profile.employeeId} /><Field label="System Role" value={profile.role} />
            <Field label="Work Email" value={profile.email} /><Field label="Mobile Number" value={profile.phone} />
            <Field label="Account" value={profile.account} /><Field label="Direct Supervisor" value={profile.supervisor} />
            <Field label="Primary Task" value={profile.task} /><Field label="Shift Schedule" value="8:00 AM â€“ 5:00 PM" />
          </div>
          <p className="settings-profile-note"><ShieldCheck /> Profile information is managed by your company. Contact your supervisor or administrator to request a correction.</p>
        </section>}

        {tab === 'notifications' && <section className="settings-panel settings-preferences" role="tabpanel">
          <div className="settings-section-heading"><div><h2>Notification Preferences</h2><p>Choose which updates appear in your Agent Workspace.</p></div></div>
          <Preference icon={<Clock3 />} title="Attendance updates" description="Notices about attendance records and punch activity." checked={preferences.attendance} onClick={() => togglePreference('attendance')} />
          <Preference icon={<CalendarDays />} title="Schedule reminders" description="Reminders about upcoming shifts and schedule changes." checked={preferences.schedule} onClick={() => togglePreference('schedule')} />
          <Preference icon={<Bell />} title="Team announcements" description="General updates from your customer support team." checked={preferences.announcements} onClick={() => togglePreference('announcements')} />
        </section>}

        {tab === 'general' && <section className="settings-panel settings-preferences" role="tabpanel">
          <div className="settings-section-heading"><div><h2>Preferences</h2><p>Customize your interface theme and workspace display.</p></div></div>
          <div className="settings-theme-card">
            <div className="settings-theme-title"><span><Monitor /></span><div><strong>Theme Preference</strong><p>Select how the interface should appear on your device.</p></div></div>
            <div className="settings-theme-options" role="group" aria-label="Theme preference">
              <ThemeOption icon={<Sun />} label="Light" value="light" selected={theme === 'light'} onSelect={selectTheme} />
              <ThemeOption icon={<Moon />} label="Dark" value="dark" selected={theme === 'dark'} onSelect={selectTheme} />
              <ThemeOption icon={<Monitor />} label="System" value="system" selected={theme === 'system'} onSelect={selectTheme} />
            </div>
          </div>
          <Preference icon={<CalendarDays />} title="Start week on Monday" description="Use Monday as the first day in attendance calendars." checked={preferences.weekMonday} onClick={() => togglePreference('weekMonday')} />
          <Preference icon={<SettingsIcon />} title="Compact dashboard cards" description="Use a denser layout for summary information." checked={preferences.compact} onClick={() => togglePreference('compact')} />
          <div className="settings-timezone"><Clock3 /><div><strong>Time zone</strong><span>Philippine Standard Time (UTC+8)</span></div><span className="settings-fixed-value">Company setting</span></div>
        </section>}
      </div>
    </main>
    {notice && <div className="toast-message" role="status" aria-live="polite"><Check />{notice}</div>}
  </div>;
}

function ThemeOption({ icon, label, value, selected, onSelect }: { icon: React.ReactNode; label: string; value: ThemePreference; selected: boolean; onSelect: (value: ThemePreference) => void }) {
  return <button className={`settings-theme-option ${selected ? 'selected' : ''}`} type="button" aria-pressed={selected} onClick={() => onSelect(value)}>{icon}<span>{label}</span></button>;
}

function Preference({ icon, title, description, checked, onClick }: { icon: React.ReactNode; title: string; description: string; checked: boolean; onClick: () => void }) {
  return <div className="settings-preference-row"><span className="settings-preference-icon">{icon}</span><div className="settings-preference-copy"><strong>{title}</strong><p>{description}</p></div><button className={`settings-switch ${checked ? 'on' : ''}`} type="button" role="switch" aria-checked={checked} aria-label={title} onClick={onClick}><i /></button></div>;
}
