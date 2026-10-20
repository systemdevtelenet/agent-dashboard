'use client';

import { useMemo, useState } from 'react';
import {
  Activity, ArrowRight, ArrowUpRight, Bell, CalendarDays, CalendarRange, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, Clock3,
  FileText, LayoutDashboard, Menu, Search, Settings, ShieldCheck, UserRound, X,
} from 'lucide-react';
import SidebarProfile from '@/components/sidebar-profile';
import TopbarDatePicker from '@/components/topbar-date-picker';

const notices = [
  { title: 'Attendance recorded', body: 'Your check-in was saved for today.', time: '9:02 AM', icon: 'check' },
  { title: 'Schedule reminder', body: 'Your shift ends at 5:30 PM today.', time: '8:45 AM', icon: 'calendar' },
  { title: 'Timesheet due soon', body: 'Review your hours for this week.', time: 'Yesterday', icon: 'file' },
];
const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const now = new Date();

function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

export default function Dashboard() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [read, setRead] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [toast, setToast] = useState('');
  const dateText = useMemo(() => now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), []);
  const monthText = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarDays = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth();
    const offset = (new Date(y, m, 1).getDay() + 6) % 7;
    const count = new Date(y, m + 1, 0).getDate();
    const prevCount = new Date(y, m, 0).getDate();
    const total = Math.ceil((offset + count) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const n = i - offset + 1, inMonth = n >= 1 && n <= count;
      const date = new Date(y, m, n);
      return {
        day: n < 1 ? prevCount + n : n > count ? n - count : n,
        muted: !inMonth,
        present: inMonth && date < new Date(now.getFullYear(), now.getMonth(), now.getDate()) && ![0, 6].includes(date.getDay()) && date.getDate() % 9 !== 0,
        leave: inMonth && date.getDate() % 13 === 0,
        today: inMonth && y === now.getFullYear() && m === now.getMonth() && n === now.getDate(),
      };
    });
  }, [month]);
  function showToast(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2600); }
  const closeMenu = () => setMenuOpen(false);

  return <div className="dashboard-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand-row">
        <a className="brand" href="#overview" aria-label="Cebu Tele-Net Philippines">
          <span className="brand-emblem">CTNP</span><span className="brand-copy"><strong>Cebu Tele-Net</strong><small>EMPLOYEE WORKSPACE</small></span>
        </a>
        <button className="sidebar-collapse" type="button" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <a className="sidebar-link active" href="#overview" onClick={closeMenu}><LayoutDashboard /><span>Dashboard</span></a>
        <a className="sidebar-link" href="/time-tracking" onClick={closeMenu}><Clock3 /><span>Time Tracking</span></a>
        <a className="sidebar-link" href="#attendance" onClick={closeMenu}><CalendarDays /><span>My attendance</span></a>
        <a className="sidebar-link" href="#schedule" onClick={closeMenu}><CalendarRange /><span>My schedule</span></a>
        <a className="sidebar-link" href="/profile" onClick={closeMenu}><UserRound /><span>Personal information</span></a>
      </nav>
      <div className="sidebar-bottom">
        <a className="sidebar-link sidebar-settings" href="#settings" onClick={closeMenu}><Settings /><span>Settings</span></a>
        <SidebarProfile name="Nonie May Elimon" role="Agent" />
      </div>
    </aside>
    {menuOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={closeMenu} />}

    <main className="main-panel" id="overview">
      <header className="topbar">
        <button className="topbar-menu" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu /></button>
        <div className="topbar-title">Agent Workspace</div>
        <div className="topbar-actions">
          <label className="global-search"><Search /><input type="search" placeholder="Search attendance, schedule, or notices..." aria-label="Search dashboard" /><kbd>⌘ K</kbd></label>
          <TopbarDatePicker />
          <div className="notification-anchor">
            <button className="topbar-icon" type="button" aria-label="Open notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell />{!read && <i />}</button>
            {notificationsOpen && <div className="notification-menu"><div className="notification-menu-head"><strong>Notifications</strong><button type="button" onClick={() => setRead(true)}>Mark all read</button></div>
              {notices.map(item => <div className="notification-menu-row" key={item.title}><span className="notification-symbol"><Bell /></span><div><strong>{item.title}</strong><p>{item.body}</p><time>{item.time}</time></div></div>)}
            </div>}
          </div>
          <button className="topbar-user" type="button" aria-label="Open profile" onClick={() => document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' })}><UserRound /></button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="page-heading">
          <div><div className="eyebrow">EMPLOYEE DASHBOARD</div><h1>Your workspace</h1><p>{dateText} · Your attendance and schedule at a glance.</p></div>
          <button className={`primary-action ${checkedIn ? 'checked-in' : ''}`} type="button" onClick={() => { setCheckedIn(!checkedIn); showToast(checkedIn ? 'You have checked out.' : 'Check-in recorded. Have a great shift!'); }}>
            {checkedIn ? <Check /> : <ClipboardCheck />}<span>{checkedIn ? 'Checked in' : 'Check in'}</span>
          </button>
        </section>

        <section className="summary-grid" aria-label="Attendance summary">
          <article className="summary-card"><div className="summary-card-head"><span>HOURS THIS WEEK</span><span className="summary-icon blue"><Clock3 /></span></div><div className="summary-value">32h 40m</div><div className="summary-foot"><span className="trend up"><ArrowUpRight /> 2h 40m</span> compared with last week</div><div className="summary-watermark"><Clock3 /></div></article>
          <article className="summary-card"><div className="summary-card-head"><span>ON-TIME RATE</span><span className="summary-icon green"><Activity /></span></div><div className="summary-value">98%</div><div className="summary-foot"><span className="trend up"><ArrowUpRight /> 3%</span> this month</div><div className="summary-watermark"><Activity /></div></article>
          <article className="summary-card"><div className="summary-card-head"><span>DAYS PRESENT</span><span className="summary-icon gold"><CalendarDays /></span></div><div className="summary-value">18<span className="value-small"> / 20</span></div><div className="summary-foot">2 scheduled workdays remaining</div><div className="summary-watermark"><CalendarDays /></div></article>
          <article className="summary-card"><div className="summary-card-head"><span>LEAVE BALANCE</span><span className="summary-icon slate"><FileText /></span></div><div className="summary-value">12<span className="value-small"> days</span></div><div className="summary-foot">Available annual leave</div><div className="summary-watermark"><FileText /></div></article>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-column">
            <section className="panel-card attendance-panel" id="attendance">
              <SectionHeading title="Attendance overview" subtitle="Your weekly attendance and hours" action={<select className="compact-select" aria-label="Attendance period"><option>This week</option><option>Last week</option><option>This month</option></select>} />
              <div className="attendance-highlight"><div><span>WEEKLY HOURS</span><strong>32h 40m</strong><small>of 40h target</small></div><div className="weekly-progress"><div className="progress-track"><span /></div><small>82% complete</small></div><div className="attendance-stamp"><ShieldCheck /></div></div>
              <div className="chart-toolbar"><strong>Hours by day</strong><div className="chart-key"><span><i className="key-blue" /> This week</span><span><i className="key-gold" /> Last week</span></div></div>
              <div className="attendance-chart" role="img" aria-label="Bar chart comparing hours worked this week and last week">
                <div className="chart-y-labels"><span>10h</span><span>7h</span><span>4h</span><span>0h</span></div>
                <div className="chart-area"><div className="chart-guides"><i /><i /><i /><i /></div><div className="chart-bars">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => <div className="chart-day" key={day}><div className="bar-pair"><span className="bar-last" style={{ height: [76, 71, 80, 74, 68, 19, 10][i] + '%' }} /><span className="bar-current" style={{ height: [82, 88, 77, 82, 0, 0, 0][i] + '%' }} /></div><small>{day}</small></div>)}
                </div></div>
              </div>
              <div className="attendance-note"><span className="note-dot" />Your attendance is on track. Keep it up!</div>
            </section>
            <section className="panel-card schedule-panel" id="schedule">
              <SectionHeading title="Upcoming shift" subtitle="Your next scheduled workday" action={<button className="text-link" type="button" onClick={() => showToast('Full schedule view is coming soon.')}>View schedule <ArrowRight /></button>} />
              <div className="shift-card"><div className="shift-date"><span className="shift-date-icon"><CalendarDays /></span><div><strong>Wednesday, 21 October</strong><small>Tomorrow · Scheduled shift</small></div><span className="shift-status">UPCOMING</span></div>
                <div className="shift-details"><div><span>SHIFT HOURS</span><strong>9:00 AM – 5:30 PM</strong></div><div><span>DEPARTMENT</span><strong>Customer Support</strong></div><div><span>BREAK</span><strong>1:00 – 1:30 PM</strong></div></div>
              </div>
            </section>
          </div>

          <div className="dashboard-column">
            <section className="panel-card calendar-panel">
              <SectionHeading title="My attendance" subtitle="Monthly check-in calendar" />
              <div className="calendar-toolbar"><strong>{monthText}</strong><div><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div></div>
              <div className="calendar-grid">{weekdays.map((day, i) => <span className="calendar-weekday" key={i}>{day}</span>)}{calendarDays.map((day, i) => <span key={i} className={`calendar-day ${day.muted ? 'muted' : ''} ${day.present ? 'present' : ''} ${day.leave ? 'leave' : ''} ${day.today ? 'today' : ''}`}>{day.day}</span>)}</div>
              <div className="calendar-legend"><span><i className="legend-present" /> Present</span><span><i className="legend-leave" /> Leave</span><span><i className="legend-today" /> Today</span></div>
            </section>
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
        <footer className="dashboard-footer"><span>© {now.getFullYear()} Cebu Tele-Net Philippines · Training Performance Hub</span><a href="mailto:people@ctnp.example">Contact your administrator</a></footer>
      </div>
    </main>
    {toast && <div className="toast-message" role="status" aria-live="polite">{toast}</div>}
  </div>;
}
