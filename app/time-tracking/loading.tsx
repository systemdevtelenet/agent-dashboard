import { Clock3 } from 'lucide-react';

export default function TimeTrackingLoading() {
  return <div className="dashboard-shell" aria-busy="true" aria-label="Loading time tracking">
    <aside className="sidebar"><div className="sidebar-brand-row"><a className="brand" href="/"><span className="brand-emblem">CTNP</span><span className="brand-copy"><strong>Cebu Tele-Net</strong><small>EMPLOYEE WORKSPACE</small></span></a></div><div className="sidebar-label">WORKSPACE</div><nav className="sidebar-nav"><a className="sidebar-link active"><Clock3 /><span>Time Tracking</span></a></nav></aside>
    <main className="main-panel"><header className="topbar"><div className="topbar-title">Agent Workspace</div></header><div className="dashboard-content"><div className="page-heading"><div><div className="eyebrow">PERSONAL RECORDS</div><h1>Time Tracking</h1><p>Loading your personal shift records…</p></div></div><section className="panel-card time-loading-card"><span className="time-loading-line" /><span className="time-loading-line" /><span className="time-loading-line" /></section></div></main>
  </div>;
}
