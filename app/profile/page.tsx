import {
  Activity, Bell, CalendarDays, Clock3, LayoutDashboard, Menu, Search, UserRound,
} from 'lucide-react';
import SidebarProfile from '@/components/sidebar-profile';
import TopbarDatePicker from '@/components/topbar-date-picker';

const profile = {
  name: 'Nonie May Elimon',
  role: 'Agent',
  employeeId: 'Not provided',
  workEmail: 'Not provided',
  department: 'Not provided',
  contactNumber: 'Not provided',
  account: 'Not provided',
  shift: 'Not provided',
};

function ProfileField({ label, value }: { label: string; value: string }) {
  return <div className="profile-field"><span>{label}</span><strong>{value}</strong></div>;
}

export default function ProfilePage() {
  return <div className="dashboard-shell">
    <aside className="sidebar">
      <div className="sidebar-brand-row"><a className="brand" href="/" aria-label="Agent Workspace home"><span className="brand-emblem">CTNP</span><span className="brand-copy"><strong>Cebu Tele-Net</strong><small>EMPLOYEE WORKSPACE</small></span></a><span className="sidebar-collapse"><Menu /></span></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <a className="sidebar-link" href="/"><LayoutDashboard /><span>Dashboard</span></a>
        <a className="sidebar-link" href="/time-tracking"><Clock3 /><span>Time Tracking</span></a>
        <a className="sidebar-link" href="/#attendance"><CalendarDays /><span>My attendance</span></a>
        <a className="sidebar-link" href="/#schedule"><Activity /><span>My schedule</span></a>
        <a className="sidebar-link active" href="/profile" aria-current="page"><UserRound /><span>Personal information</span></a>
      </nav>
      <div className="sidebar-bottom"><SidebarProfile name={profile.name} role={profile.role} /></div>
    </aside>
    <main className="main-panel">
      <header className="topbar"><div className="topbar-title">Agent Workspace</div><div className="topbar-actions"><label className="global-search"><Search /><input type="search" placeholder="Search attendance, schedule, or notices..." aria-label="Search dashboard" /></label><TopbarDatePicker /><a className="topbar-icon" href="/#notifications" aria-label="Notifications"><Bell /></a><span className="topbar-user" aria-label="Employee profile"><UserRound /></span></div></header>
      <div className="dashboard-content profile-page-content">
        <section className="page-heading"><div><div className="eyebrow">WORKSPACE / PERSONAL INFORMATION</div><h1>My profile</h1><p>Review your employee information and current work assignment.</p></div></section>
        <section className="panel-card profile-hero-card">
          <div className="profile-hero-avatar">NM</div>
          <div className="profile-hero-copy"><span>EMPLOYEE PROFILE</span><h2>{profile.name}</h2><p>{profile.role}</p></div>
          <span className="profile-view-pill"><UserRound /> Personal profile</span>
        </section>
        <div className="profile-page-grid">
          <section className="panel-card profile-details-card"><div className="section-heading"><div><h2>Personal information</h2><p>Your basic employee details</p></div></div><div className="profile-fields-grid"><ProfileField label="FULL NAME" value={profile.name} /><ProfileField label="EMPLOYEE ID" value={profile.employeeId} /><ProfileField label="WORK EMAIL" value={profile.workEmail} /><ProfileField label="CONTACT NUMBER" value={profile.contactNumber} /></div></section>
          <section className="panel-card profile-details-card"><div className="section-heading"><div><h2>Work information</h2><p>Your current role and assignment</p></div></div><div className="profile-fields-grid"><ProfileField label="POSITION" value={profile.role} /><ProfileField label="DEPARTMENT" value={profile.department} /><ProfileField label="ACCOUNT" value={profile.account} /><ProfileField label="SHIFT SCHEDULE" value={profile.shift} /></div><p className="profile-page-note">Some profile fields will appear when employee data is connected.</p></section>
        </div>
      </div>
    </main>
  </div>;
}
