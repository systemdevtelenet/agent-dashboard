'use client';

import { useMemo, useState } from 'react';
import {
  Bell, CalendarDays, ChevronRight, Eye, FileText, LockKeyhole, Search,
  ShieldCheck, UserRound, X,
} from 'lucide-react';
import AgentSidebar from '@/components/agent-sidebar';
import AgentSidebarToggle from '@/components/agent-sidebar-toggle';
import TopbarDatePicker from '@/components/topbar-date-picker';
import TopbarProfileMenu from '@/components/topbar-profile-menu';

type IncidentReport = {
  reference: string;
  date: string;
  reportedBy: string;
  title: string;
  status: 'Awaiting acknowledgment' | 'Acknowledged';
  summary: string;
};

// Demonstration data only. Connect this view to the IR system's employee-scoped records later.
const reports: IncidentReport[] = [
  {
    reference: 'IR-2026-0018',
    date: 'October 21, 2026',
    reportedBy: 'Customer Support Supervisor',
    title: 'Incident report',
    status: 'Awaiting acknowledgment',
    summary: 'This is a sample record for the Agent Workspace preview. The incident description and supporting documents will appear here when the IR system is connected.',
  },
  {
    reference: 'IR-2026-0012',
    date: 'October 14, 2026',
    reportedBy: 'Customer Support Supervisor',
    title: 'Incident report',
    status: 'Acknowledged',
    summary: 'This is a sample record for the Agent Workspace preview. The incident description and supporting documents will appear here when the IR system is connected.',
  },
];

export default function IncidentReportsPage() {
  const [query, setQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const filteredReports = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return reports;
    return reports.filter(report => [report.reference, report.reportedBy, report.title, report.status].some(value => value.toLowerCase().includes(normalized)));
  }, [query]);

  return <div className="dashboard-shell">
    <AgentSidebar activePage="incident-reports" />
    <main className="main-panel">
      <header className="topbar"><AgentSidebarToggle /><div className="topbar-actions"><label className="global-search"><Search /><input type="search" placeholder="Search attendance, schedule, or notices..." aria-label="Search workspace" /></label><TopbarDatePicker /><a className="topbar-icon" href="/#notifications" aria-label="Notifications"><Bell /></a><TopbarProfileMenu name="Nonie May Elimon" role="Customer Service Associate" /></div></header>
      <div className="dashboard-content ir-page-content">
        <section className="page-heading ir-page-heading"><div><div className="eyebrow">PERSONAL RECORDS</div><h1>My Incident Reports</h1><p>Review incident reports that have been issued to you.</p></div><span className="readonly-pill"><ShieldCheck /> View only</span></section>

        <div className="readonly-notice ir-readonly-notice"><LockKeyhole /><div><strong>Read-only access</strong><span>You can review reports addressed to you. Creating, editing, acknowledging, and signing reports are managed in the Incident Report system.</span></div></div>
        <div className="ir-demo-notice">Sample preview data Â· No live incident report records are connected yet.</div>

        <section className="ir-summary-grid" aria-label="Incident report summary">
          <article className="ir-summary-card"><span className="ir-summary-icon blue"><FileText /></span><div><span>REPORTS RECEIVED</span><strong>{reports.length}</strong><small>Issued to your account</small></div></article>
          <article className="ir-summary-card"><span className="ir-summary-icon gold"><CalendarDays /></span><div><span>AWAITING ACKNOWLEDGMENT</span><strong>{reports.filter(report => report.status === 'Awaiting acknowledgment').length}</strong><small>Status shown for reference</small></div></article>
          <article className="ir-summary-card"><span className="ir-summary-icon green"><ShieldCheck /></span><div><span>ACKNOWLEDGED</span><strong>{reports.filter(report => report.status === 'Acknowledged').length}</strong><small>Previously acknowledged</small></div></article>
        </section>

        <section className="panel-card ir-list-card">
          <div className="ir-list-heading"><div><h2>Received Incident Reports</h2><p>Reports assigned to your employee account</p></div><span className="ir-record-count">{filteredReports.length} records</span></div>
          <label className="ir-search"><Search /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by reference or reported by..." aria-label="Search incident reports" /></label>
          {filteredReports.length ? <div className="ir-table-wrap"><table className="ir-table"><thead><tr><th>REFERENCE / REPORT</th><th>REPORTED BY</th><th>DATE ISSUED</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{filteredReports.map(report => <tr key={report.reference}><td><strong>{report.title}</strong><small>{report.reference}</small></td><td>{report.reportedBy}</td><td>{report.date}</td><td><span className={`ir-status ${report.status === 'Acknowledged' ? 'acknowledged' : 'pending'}`}><i />{report.status}</span></td><td><button className="ir-view-button" type="button" onClick={() => setSelectedReport(report)}><Eye />View report<ChevronRight /></button></td></tr>)}</tbody></table></div> : <div className="ir-empty-state"><FileText /><strong>No matching incident reports</strong><span>Try a different reference or reporter name.</span></div>}
        </section>
      </div>
    </main>

    {selectedReport && <div className="ir-drawer-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedReport(null); }}>
      <aside className="ir-drawer" role="dialog" aria-modal="true" aria-labelledby="ir-drawer-title">
        <header className="ir-drawer-header"><span className="ir-drawer-icon"><FileText /></span><div><h2 id="ir-drawer-title">Incident Report</h2><p>{selectedReport.reference}</p></div><button type="button" aria-label="Close report" onClick={() => setSelectedReport(null)}><X /></button></header>
        <div className="ir-drawer-content">
          <div className="ir-detail-status"><span>REPORT STATUS</span><strong className={`ir-status ${selectedReport.status === 'Acknowledged' ? 'acknowledged' : 'pending'}`}><i />{selectedReport.status}</strong></div>
          <div className="ir-detail-block"><span><CalendarDays />Date issued</span><strong>{selectedReport.date}</strong></div>
          <div className="ir-detail-block"><span><UserRound />Reported by</span><strong>{selectedReport.reportedBy}</strong></div>
          <div className="ir-detail-block"><span><FileText />Reference</span><strong>{selectedReport.reference}</strong></div>
          <section className="ir-detail-summary"><h3>Report details</h3><p>{selectedReport.summary}</p></section>
          <div className="ir-detail-readonly"><LockKeyhole /><span>This report is shown for review only. To acknowledge, sign, or discuss it, use the separate Incident Report system.</span></div>
        </div>
        <footer className="ir-drawer-footer"><button type="button" onClick={() => setSelectedReport(null)}>Close</button></footer>
      </aside>
    </div>}
  </div>;
}
