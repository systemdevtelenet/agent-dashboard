'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock3 } from 'lucide-react';

const PH_TIME_ZONE = 'Asia/Manila';
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' });
const shortMonthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function manilaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PH_TIME_ZONE, year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(part => [part.type, Number(part.value)])) as Record<string, number>;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export default function TopbarDatePicker() {
  const [now, setNow] = useState<Date | null>(null);
  const [selectedKey, setSelectedKey] = useState('');
  const [viewYear, setViewYear] = useState(0);
  const [viewMonth, setViewMonth] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const current = new Date();
      const parts = manilaDateParts(current);
      setNow(current);
      setSelectedKey(key => key || dateKey(parts.year, parts.month - 1, parts.day));
      setViewYear(year => year || parts.year);
      setViewMonth(month => month || parts.month - 1);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const todayParts = now ? manilaDateParts(now) : null;
  const calendarDays = useMemo(() => {
    if (!viewYear && viewYear !== 0) return [];
    const firstWeekday = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const daysInPrevious = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();
    const count = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    return Array.from({ length: count }, (_, index) => {
      const offsetDay = index - firstWeekday + 1;
      const date = new Date(Date.UTC(viewYear, viewMonth, offsetDay));
      return {
        year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate(),
        muted: offsetDay < 1 || offsetDay > daysInMonth,
        key: dateKey(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
        label: offsetDay < 1 ? daysInPrevious + offsetDay : offsetDay > daysInMonth ? offsetDay - daysInMonth : offsetDay,
      };
    });
  }, [viewYear, viewMonth]);

  const selected = selectedKey ? dateFromKey(selectedKey) : null;
  const displayDate = selected ? dayFormatter.format(selected) : 'Loading date';
  const displayTime = now ? new Intl.DateTimeFormat('en-US', {
    timeZone: PH_TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  }).format(now) : '--:--:-- --';
  const setMonth = (month: number) => {
    const date = new Date(Date.UTC(viewYear, month, 1));
    setViewYear(date.getUTCFullYear());
    setViewMonth(date.getUTCMonth());
  };
  const shiftMonth = (delta: number) => setMonth(viewMonth + delta);

  return <div className="topbar-calendar-anchor" ref={rootRef}>
    <button className="topbar-date-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <CalendarDays aria-hidden="true" />
      <span>{displayDate}</span>
      <i aria-hidden="true" />
      <Clock3 aria-hidden="true" />
      <span>{displayTime}</span>
      {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
    </button>
    {open && <div className="calendar-popover" role="dialog" aria-label="Choose a date">
      <div className="calendar-popover-heading">
        <strong>{monthFormatter.format(new Date(Date.UTC(viewYear, viewMonth, 1)))} {selected?.getUTCDate() ?? todayParts?.day ?? ''}</strong>
        <span className="calendar-year-badge"><i />{viewYear}<i /></span>
      </div>
      <div className="calendar-select-row">
        <label><span className="sr-only">Month</span><select value={viewMonth} onChange={event => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, month) => <option value={month} key={month}>{monthFormatter.format(new Date(Date.UTC(2020, month, 1)))}</option>)}</select><ChevronDown /></label>
        <label><span className="sr-only">Year</span><select value={viewYear} onChange={event => setViewYear(Number(event.target.value))}>{Array.from({ length: 21 }, (_, index) => viewYear - 10 + index).map(year => <option value={year} key={year}>{year}</option>)}</select><ChevronDown /></label>
        <div className="calendar-month-arrows"><button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}><ChevronLeft /></button><button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}><ChevronRight /></button></div>
      </div>
      <div className="calendar-weekdays">{weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="calendar-grid">{calendarDays.map(date => {
        const isSelected = date.key === selectedKey;
        const isToday = todayParts && date.year === todayParts.year && date.month === todayParts.month - 1 && date.day === todayParts.day;
        return <button type="button" key={date.key} className={`${date.muted ? 'muted ' : ''}${isSelected ? 'selected ' : ''}${isToday ? 'today' : ''}`} aria-pressed={isSelected} onClick={() => { setSelectedKey(date.key); setViewYear(date.year); setViewMonth(date.month); }}>{date.label}</button>;
      })}</div>
      <div className="calendar-selected-date"><Clock3 /><span>Selected Date</span><strong>{selected ? dayFormatter.format(selected) : '—'}</strong></div>
      <button className="calendar-confirm" type="button" onClick={() => setOpen(false)}>Confirm Selection</button>
    </div>}
  </div>;
}
