'use client';

import { useState } from 'react';
import {
  Activity, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check,
  CircleHelp, Clock3,
  FileText, Search, ShieldCheck, UserRound,
} from 'lucide-react';
import Link from 'next/link';
import AgentSidebar from '@/components/agent-sidebar';
import AgentSidebarToggle from '@/components/agent-sidebar-toggle';
import TopbarDatePicker from '@/components/topbar-date-picker';
import TopbarProfileMenu from '@/components/topbar-profile-menu';

const notices = [
  { title: 'Attendance recorded', body: 'Your check-in was saved for today.', time: '9:02 AM', icon: 'check' },
  { title: 'Schedule reminder', body: 'Your shift ends at 5:30 PM today.', time: '8:45 AM', icon: 'calendar' },
  { title: 'Timesheet due soon', body: 'Review your hours for this week.', time: 'Yesterday', icon: 'file' },
];
const now = new Date();

function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

export default function Dashboard() {
  const [read, setRead] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const dateText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  function showToast(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2600); }
  return <div className="dashboard-shell">
    <AgentSidebar activePage="dashboard" />
    <main className="main-panel" id="overview">
      <header className="topbar">
        <AgentSidebarToggle />

        <div className="topbar-actions">
          <label className="global-search"><Search /><input type="search" placeholder="Search attendance, schedule, or notices..." aria-label="Search dashboard" /><kbd>Ctrl K</kbd></label>
          <TopbarDatePicker />
          <div className="notification-anchor">
            <button className="topbar-icon" type="button" aria-label="Open notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell />{!read && <i />}</button>
            {notificationsOpen && <div className="notification-menu"><div className="notification-menu-head"><strong>Notifications</strong><button type="button" onClick={() => setRead(true)}>Mark all read</button></div>
              {notices.map(item => <div className="notification-menu-row" key={item.title}><span className="notification-symbol"><Bell /></span><div><strong>{item.title}</strong><p>{item.body}</p><time>{item.time}</time></div></div>)}
            </div>}
          </div>
          <TopbarProfileMenu name="Nonie May Elimon" role="Agent" />
        </div>
      </header>

      <div className="dashboard-content">
        <section className="page-heading">
          <div><div className="eyebrow">EMPLOYEE DASHBOARD</div><h1>Your workspace</h1><p>{dateText} · Your attendance and schedule at a glance.</p></div>
          <Link className="primary-action" href="/attendance"><Clock3 /><span>View attendance</span></Link>
        </section>

        <section className="summary-grid" aria-label="Attendance summary">
          <article className="summary-card"><div className="summary-card-head"><span>HOURS THIS WEEK</span><span className="summary-icon blue"><Clock3 /></span></div><div className="summary-value">32h 40m</div><div className="summary-foot"><span className="trend up"><ArrowUpRight /> 2h 40m</span> compared with last week</div><div className="summary-watermark"><Clock3 /></div></article>
          <article className="summary-card"><div className="summary-card-head"><span>ON-TIME RATE</span><span className="summary-icon green"><Activity /></span></div><div className="summary-value">98%</div><div className="summary-foot"><span className="trend up"><ArrowUpRight /> 3%</span> this month</div><div className="summary-watermark"><Activity /></div></article>
          <article className="summary-card"><div className="summary-card-head"><span>DAYS PRESENT</span><span className="summary-icon gold"><CalendarDays /></span></div><div className="summary-value">11<span className="value-small"> / 15</span></div><div className="summary-foot">This month</div><div className="summary-watermark"><CalendarDays /></div></article>
          <article className="summary-card"><div className="summary-card-head"><span>LEAVE BALANCE</span><span className="summary-icon slate"><FileText /></span></div><div className="summary-value">12<span className="value-small"> days</span></div><div className="summary-foot">Available annual leave</div><div className="summary-watermark"><FileText /></div></article>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-column">
            <section className="panel-card dashboard-time-summary" id="attendance">
              <SectionHeading title="My attendance" subtitle="Today's shift at a glance" action={<Link className="text-link" href="/attendance">View details <ArrowRight /></Link>} />
              <div className="dashboard-attendance-status"><span><i /> Shift complete</span><strong>7h 31m logged today</strong><small>Last punch recorded at 5:01 PM</small></div>
              <div className="dashboard-attendance-punches"><div><span>FIRST PUNCH</span><strong>8:00 AM</strong></div><div><span>LAST PUNCH</span><strong>5:01 PM</strong></div><div><span>THIS WEEK</span><strong>32h 40m</strong></div></div>
              <Link className="dashboard-attendance-link" href="/attendance">View attendance history <ArrowRight /></Link>
            </section>
            <section className="panel-card schedule-panel" id="schedule">
              <SectionHeading title="Upcoming shift" subtitle="Your next scheduled workday" action={<button className="text-link" type="button" onClick={() => showToast('Full schedule view is coming soon.')}>View schedule <ArrowRight /></button>} />
              <div className="shift-card"><div className="shift-date"><span className="shift-date-icon"><CalendarDays /></span><div><strong>Thursday, 22 October</strong><small>Tomorrow · Scheduled shift</small></div><span className="shift-status">UPCOMING</span></div>
                <div className="shift-details"><div><span>SHIFT HOURS</span><strong>9:00 AM – 5:30 PM</strong></div><div><span>DEPARTMENT</span><strong>Customer Support</strong></div><div><span>BREAK</span><strong>1:00 – 1:30 PM</strong></div></div>
              </div>
            </section>
          </div>

          <div className="dashboard-column">
            <section className="panel-card profile-panel" id="profile">
              <SectionHeading title="Personal information" subtitle="Your employee profile" action={<button className="text-link" type="button" onClick={() => showToast('Profile updates are managed by your administrator.')}>Request update <ArrowRight /></button>} />
              <div className="profile-summary"><div className="profile-avatar"><UserRound /></div><div><strong>Employee profile</strong><small>Details linked to your account</small></div><span className="profile-verified"><ShieldCheck /> Verified</span></div>
              <div className="profile-data"><div><span>EMPLOYEE ID</span><strong>Available after account sync</strong></div><div><span>DEPARTMENT</span><strong>Assigned by your team</strong></div></div>
              <div className="profile-footer"><span>For corrections, contact your team administrator.</span><CircleHelp /></div>
            </section>
            <section className="panel-card notifications-panel" id="notifications">
              <SectionHeading title="Recent notifications" subtitle="Updates for your account" action={<button className="text-link" type="button" onClick={() => setRead(true)}>Mark read <Check /></button>} />
              <div className="notice-list">{notices.map((notice, index) => <article className="notice-row" key={notice.title}><span className={`notice-icon notice-${notice.icon}`}>{notice.icon === 'check' ? <Check /> : notice.icon === 'calendar' ? <CalendarDays /> : <FileText />}</span><div className="notice-copy"><strong>{notice.title}</strong><p>{notice.body}</p><time>{notice.time}</time></div>{!read && index === 0 && <i className="unread-dot" />}</article>)}</div>
            </section>
          </div>
        </section>
        <footer className="dashboard-footer"><span>© {now.getFullYear()} Cebu Tele-Net Philippines · Agent Workspace</span><a href="mailto:people@ctnp.example">Contact your administrator</a></footer>
      </div>
    </main>
    {toast && <div className="toast-message" role="status" aria-live="polite">{toast}</div>}
  </div>;
}
