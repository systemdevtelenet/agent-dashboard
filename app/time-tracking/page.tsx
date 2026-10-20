import {
  Activity, Bell, CalendarDays, CheckCircle2, Clock3, FileText, LayoutDashboard,
  Menu, Search, UserRound, Timer, BriefcaseBusiness, ShieldCheck, CircleHelp,
} from 'lucide-react';
import SidebarProfile from '@/components/sidebar-profile';
import TopbarDatePicker from '@/components/topbar-date-picker';
import TopbarProfileMenu from '@/components/topbar-profile-menu';
import { getTimeTrackingData, parseTimestamp, prettyDuration, punchLabel } from '@/lib/time-tracking';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function localTime(value?: string) {
  const timestamp = parseTimestamp(value);
  if (timestamp === null) return '—';
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }).format(timestamp);
}

function localDate(value: string) {
  const timestamp = parseTimestamp(value);
  if (timestamp === null) return value || '—';
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }).format(timestamp);
}

function timeAgo(value?: string) {
  const timestamp = parseTimestamp(value);
  if (timestamp === null) return 'No punch recorded';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr${hours === 1 ? '' : 's'} ago`;
}

function Sidebar() {
  return <aside className="sidebar">
    <div className="sidebar-brand-row"><a className="brand" href="/" aria-label="Agent Workspace home"><span className="brand-emblem">CTNP</span><span className="brand-copy"><strong>Cebu Tele-Net</strong><small>EMPLOYEE WORKSPACE</small></span></a><span className="sidebar-collapse"><Menu /></span></div>
    <div className="sidebar-label">WORKSPACE</div>
    <nav className="sidebar-nav" aria-label="Main navigation">
      <a className="sidebar-link" href="/"><LayoutDashboard /><span>Dashboard</span></a>
      <a className="sidebar-link active" href="/time-tracking" aria-current="page"><Clock3 /><span>Time Tracking</span></a>
      <a className="sidebar-link" href="/#attendance"><CalendarDays /><span>My attendance</span></a>
      <a className="sidebar-link" href="/#schedule"><Activity /><span>My schedule</span></a>
      <a className="sidebar-link" href="/profile"><UserRound /><span>Personal information</span></a>
    </nav>
    <div className="sidebar-bottom"><SidebarProfile name="Nonie May Elimon" role="Agent" /></div>
  </aside>;
}

export default async function TimeTrackingPage() {
  const data = await getTimeTrackingData();
  const today = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const statusClass = data.currentStatus?.toLowerCase().includes('break') || data.currentStatus?.toLowerCase().includes('lunch') ? 'status-away' : data.currentStatus?.toLowerCase().includes('shift') && !data.currentStatus.toLowerCase().includes('ended') ? 'status-working' : 'status-neutral';

  return <div className="dashboard-shell">
    <Sidebar />
    <main className="main-panel">
      <header className="topbar">
        <div className="topbar-title">Agent Workspace</div>
        <div className="topbar-actions">
          <label className="global-search"><Search /><input type="search" placeholder="Search attendance, schedule, or notices..." aria-label="Search dashboard" /></label>
          <TopbarDatePicker />
          <a className="topbar-icon" href="/#notifications" aria-label="Notifications"><Bell /></a>
          <TopbarProfileMenu name="Nonie May Elimon" role="Agent" />
        </div>
      </header>

      <div className="dashboard-content">
        <section className="page-heading time-page-heading">
          <div><div className="eyebrow">PERSONAL RECORDS</div><h1>Time Tracking</h1><p>Your shift and work activity from the workforce time tracker.</p></div>
          <span className="readonly-pill"><ShieldCheck /> View only</span>
        </section>

        <div className="readonly-notice"><Clock3 /><div><strong>Manage punches in your time tracker</strong><span>This page displays your records. Shift punches and work entries are managed in the separate time tracking system.</span></div></div>

        {data.state === 'unavailable' && <section className="panel-card time-empty-state" role="status"><div className="time-empty-icon"><CircleHelp /></div><h2>Time tracking data is unavailable</h2><p>{data.errorMessage}</p><small>Your records haven’t been changed. If this continues, contact your system administrator.</small></section>}
        {data.state === 'not_employee' && <section className="panel-card time-empty-state" role="status"><div className="time-empty-icon"><UserRound /></div><h2>No employee profile is linked</h2><p>We couldn’t match this signed-in account to one unique employee record.</p><small>Contact your administrator to link your work email to your employee profile.</small></section>}

        {(data.state === 'ready' || data.state === 'empty') && <>
          <section className="panel-card time-profile-card">
            <div className="time-profile-avatar">{data.name?.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'AG'}</div>
            <div className="time-profile-name"><h2>{data.name}</h2><p>{data.employeeCode ? `Employee ID: ${data.employeeCode}` : 'Employee profile'}</p></div>
            <span className="time-role-pill">{data.role}</span>
            <div className="time-assignment-grid">
              <div><span>POSITION</span><strong>{data.role}</strong></div>
              <div><span>SHIFT SCHEDULE</span><strong>{data.schedule}</strong></div>
              <div><span>ACCOUNT</span><strong>{data.account ?? 'No active assignment'}</strong></div>
              <div><span>DEPARTMENT</span><strong>{data.department ?? '—'}</strong></div>
            </div>
          </section>

          <section className="time-metrics-grid" aria-label="Personal time summary">
            <article className="panel-card time-metric"><div><span>CURRENT SHIFT</span><Timer /></div><strong>{prettyDuration(data.currentShiftSeconds ?? 0)}</strong><small>Working time, excluding breaks</small></article>
            <article className="panel-card time-metric"><div><span>HOURS TODAY</span><Clock3 /></div><strong>{prettyDuration(data.todaySeconds ?? 0)}</strong><small>Based on recorded shift punches</small></article>
            <article className="panel-card time-metric"><div><span>HOURS THIS WEEK</span><CalendarDays /></div><strong>{prettyDuration(data.weekSeconds ?? 0)}</strong><small>Current week · Monday to today</small></article>
            <article className="panel-card time-metric"><div><span>CURRENT STATUS</span><Activity /></div><strong className={`time-status ${statusClass}`}>{data.currentStatus ?? 'No shift punches found'}</strong><small>Last punch {localTime(data.lastPunch)} · {timeAgo(data.lastPunch)}</small></article>
          </section>

          <section className="panel-card time-panel">
            <div className="section-heading"><div><h2>Shift punch timeline</h2><p>Recent events from your current shift</p></div><span className="time-readonly-label"><ShieldCheck /> Read only</span></div>
            {!data.events?.length ? <div className="time-inline-empty">No punch events are available for your current shift.</div> : <div className="punch-timeline">{data.events.map((event, index) => <article className="punch-event" key={`${event.timestamp}-${event.type}-${index}`}><span className="punch-event-icon"><CheckCircle2 /></span><div className="punch-event-copy"><strong>{punchLabel(event.type)}</strong><small>{localDate(event.timestamp)}</small></div><time>{localTime(event.timestamp)}</time></article>)}</div>}
            <div className="time-next-action"><Timer /><span><strong>Next action</strong> Check your separate time tracker for the next available punch.</span></div>
          </section>

          <section className="panel-card time-panel">
            <div className="section-heading"><div><h2>Recent work records</h2><p>Call and task activity recorded in the time tracker</p></div><span className="time-record-count">{data.workRecords?.length ?? 0} records</span></div>
            {!data.workRecords?.length ? <div className="time-inline-empty"><FileText /><span>No recent work records were found for your employee profile.</span></div> : <div className="work-record-list">{data.workRecords.map((record, index) => <article className="work-record" key={`${record.date}-${record.ticket}-${index}`}><div className="work-record-icon"><BriefcaseBusiness /></div><div className="work-record-main"><div className="work-record-title"><strong>{record.account || 'Work activity'}</strong>{record.ticket && <span>Ticket {record.ticket}</span>}</div><p>{record.summary || record.tags || 'No notes provided'}</p><small>{localDate(record.date)}{record.tags && record.summary ? ` · ${record.tags}` : ''}</small></div><strong className="work-record-duration">{record.minutes === null ? '—' : `${Math.floor(record.minutes / 60)}h ${record.minutes % 60}m`}</strong></article>)}</div>}
          </section>
        </>}

        <footer className="dashboard-footer"><span>Time records shown here are read only.</span><a href="mailto:people@ctnp.example">Contact your administrator</a></footer>
      </div>
    </main>
  </div>;
}
