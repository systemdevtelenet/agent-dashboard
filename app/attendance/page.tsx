'use client';

import { useState } from 'react';
import { Bell, CalendarDays, Clock3, Search, ShieldCheck } from 'lucide-react';
import AgentSidebar from '@/components/agent-sidebar';
import AgentSidebarToggle from '@/components/agent-sidebar-toggle';
import TopbarDatePicker from '@/components/topbar-date-picker';
import TopbarProfileMenu from '@/components/topbar-profile-menu';

type AttendanceStatus = 'present' | 'late' | 'leave' | 'absent';

const attendanceByDay: Record<number, AttendanceStatus> = {
  1: 'present', 2: 'present', 5: 'present', 6: 'present', 7: 'late',
  8: 'present', 9: 'present', 12: 'present', 13: 'leave', 14: 'present',
  15: 'present', 16: 'absent', 19: 'present', 20: 'late', 21: 'present',
};
const shiftPunches = [
  { label: 'Shift Start', time: '8:00 AM', detail: 'Start of scheduled shift' },
  { label: 'Break 1 Start', time: '10:02 AM', detail: 'Paid break started' },
  { label: 'Break 1 End', time: '10:17 AM', detail: 'Returned from paid break' },
  { label: 'Lunch Start', time: '12:00 PM', detail: 'Meal break started' },
  { label: 'Lunch End', time: '1:00 PM', detail: 'Returned from lunch' },
  { label: 'Break 2 Start', time: '3:42 PM', detail: 'Paid break started' },
  { label: 'Break 2 End', time: '3:57 PM', detail: 'Returned from paid break' },
  { label: 'Shift End', time: '5:01 PM', detail: 'End of scheduled shift' },
];
const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const octoberOffset = new Date(Date.UTC(2026, 9, 1)).getUTCDay();
const octoberDays = Array.from({ length: 35 }, (_, index) => index - octoberOffset + 1);
const monthlyCounts = Object.values(attendanceByDay).reduce(
  (counts, status) => ({ ...counts, [status]: counts[status] + 1 }),
  { present: 0, late: 0, leave: 0, absent: 0 },
);

function displayStatus(status: string) {
  return status[0].toUpperCase() + status.slice(1);
}

function statusForDay(day: number) {
  const date = new Date(Date.UTC(2026, 9, day));
  return attendanceByDay[day]
    ?? ([0, 6].includes(date.getUTCDay()) ? 'rest day' : day > 22 ? 'upcoming' : 'no record');
}

export default function AttendancePage() {
  const [selectedDay, setSelectedDay] = useState(21);
  const selectedDate = new Date(Date.UTC(2026, 9, selectedDay));
  const selectedDateText = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
  const selectedStatus = statusForDay(selectedDay);
  const selectedPunches = selectedDay === 21 ? shiftPunches : [];

  return <div className="dashboard-shell">
    <AgentSidebar activePage="attendance" />
    <main className="main-panel">
      <header className="topbar">
        <AgentSidebarToggle />
        <div className="topbar-actions">
          <label className="global-search"><Search /><input type="search" placeholder="Search attendance, schedule, or notices..." aria-label="Search workspace" /></label>
          <TopbarDatePicker />
          <a className="topbar-icon" href="/#notifications" aria-label="Notifications"><Bell /></a>
          <TopbarProfileMenu name="Nonie May Elimon" role="Agent" />
        </div>
      </header>
      <div className="dashboard-content attendance-page-content">
        <section className="page-heading">
          <div><div className="eyebrow">PERSONAL RECORDS</div><h1>My Attendance</h1><p>Review your attendance status and recorded punches.</p></div>
          <span className="readonly-pill"><ShieldCheck /> View only</span>
        </section>

        <section className="panel-card attendance-overview-card" aria-label="October attendance summary">
          <div className="attendance-overview-heading">
            <div className="section-heading attendance-section-heading">
              <div className="attendance-title-icon"><CalendarDays /></div>
              <div><h2>October at a glance</h2><p>Your recorded attendance for this month</p></div>
            </div>
            <span className="attendance-overview-period">October 2026</span>
          </div>
          <div className="attendance-overview-stats">
            <div><span>PRESENT</span><strong>{monthlyCounts.present}</strong></div>
            <div><span>LATE</span><strong>{monthlyCounts.late}</strong></div>
            <div><span>LEAVE</span><strong>{monthlyCounts.leave}</strong></div>
            <div><span>ABSENT</span><strong>{monthlyCounts.absent}</strong></div>
          </div>
          <div className="attendance-latest-shift">
            <div className="attendance-latest-title"><span>LATEST RECORDED SHIFT</span><strong>Wednesday, October 21</strong><small>Complete · 8 punches recorded</small></div>
            <div><span>WORKING TIME</span><strong>7h 31m</strong></div>
            <div><span>FIRST PUNCH</span><strong>8:00 AM</strong></div>
            <div><span>LAST PUNCH</span><strong>5:01 PM</strong></div>
          </div>
        </section>

        <div className="attendance-page-grid">
          <section className="panel-card attendance-calendar-card">
            <div className="attendance-calendar-heading">
              <div className="section-heading attendance-section-heading">
                <div className="attendance-title-icon"><CalendarDays /></div>
                <div><h2>Attendance calendar</h2><p>Select a day to view its record</p></div>
              </div>
              <span className="attendance-month-label">October 2026</span>
            </div>
            <div className="attendance-calendar-grid">
              {weekdays.map((day) => <span className="attendance-weekday" key={day}>{day}</span>)}
              {octoberDays.map((day, index) => {
                if (day < 1 || day > 31) {
                  return <span className="attendance-calendar-day outside-month" key={index}><span>{day < 1 ? 30 + day : day - 31}</span></span>;
                }
                const status = statusForDay(day);
                const statusClass = status.replace(' ', '-');
                return <button type="button" className={`attendance-calendar-day day-${statusClass} ${day === selectedDay ? 'calendar-selected' : ''}`} key={day} aria-pressed={day === selectedDay} aria-label={`October ${day}: ${displayStatus(status)}`} onClick={() => setSelectedDay(day)}><span>{day}</span><small>{displayStatus(status)}</small></button>;
              })}
            </div>
            <div className="attendance-calendar-legend">
              <span><i className="legend-present" /> Present</span>
              <span><i className="legend-late" /> Late</span>
              <span><i className="legend-leave" /> Leave</span>
              <span><i className="legend-absent" /> Absent</span>
              <span><i className="legend-rest" /> Rest day</span>
            </div>
          </section>

          <section className="panel-card attendance-day-detail">
            <div className="attendance-day-detail-heading">
              <span className="attendance-date-badge"><small>OCT</small><strong>{selectedDay}</strong></span>
              <div><h2>{selectedDateText}</h2><p>Attendance record · view only</p></div>
            </div>
            <div className="attendance-day-status"><span>ATTENDANCE STATUS</span><strong>{displayStatus(selectedStatus)}</strong></div>
            <div className="attendance-day-punch-title"><strong>RECORDED PUNCHES</strong><span>{selectedPunches.length} events</span></div>
            {selectedPunches.length ? <div className="attendance-day-punches">
              {selectedPunches.map(punch => <div className="attendance-day-punch" key={punch.label}><i /><span>{punch.label}<small>{punch.detail}</small></span><time>{punch.time}</time></div>)}
            </div> : <div className="attendance-detail-empty">{selectedStatus === 'present' || selectedStatus === 'late' ? 'Punch times are not included in this sample record.' : selectedStatus === 'upcoming' ? 'Attendance has not been recorded for this date yet.' : selectedStatus === 'rest day' ? 'No punches are expected on a rest day.' : 'No punch events recorded for this day.'}</div>}
          </section>
        </div>
        <footer className="dashboard-footer"><span>Sample attendance records for layout preview. Punches are managed in the time tracker.</span></footer>
      </div>
    </main>
  </div>;
}
