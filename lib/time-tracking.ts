import { createAdminClient } from './supabase/admin';
import { createClient as createSessionClient } from './supabase/server';

type Employee = {
  id: number;
  employee_code: string | null;
  employee_name: string | null;
  employee_email: string | null;
  company_email: string | null;
  role_id: number | null;
  position_id: number | null;
  Department: string | null;
};

export type PunchEvent = { type: string; timestamp: string; duration: string | null; status: string | null };
export type WorkRecord = { date: string; account: string; minutes: number | null; ticket: string; tags: string; summary: string };

export type TimeTrackingData = {
  state: 'ready' | 'empty' | 'unavailable' | 'not_employee';
  name?: string;
  employeeCode?: string;
  role?: string;
  department?: string;
  account?: string;
  schedule?: string;
  todaySeconds?: number;
  weekSeconds?: number;
  currentShiftSeconds?: number;
  events?: PunchEvent[];
  workRecords?: WorkRecord[];
  currentStatus?: string;
  lastPunch?: string;
  errorMessage?: string;
};

const zone = 'Asia/Manila';
const localDateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });

function parseTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const text = value.trim();
  const usDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (usDate) {
    const [, month, day, year, hourText, minuteText, secondText, meridiem] = usDate;
    let hour = Number(hourText ?? 0);
    if (meridiem) hour = hour % 12 + (meridiem.toUpperCase() === 'PM' ? 12 : 0);
    const time = Date.UTC(Number(year), Number(month) - 1, Number(day), hour - 8, Number(minuteText ?? 0), Number(secondText ?? 0));
    return Number.isFinite(time) ? time : null;
  }
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
  const normalized = /^\d{4}-\d\d-\d\d(?:[ T]\d\d:\d\d(?::\d\d(?:\.\d+)?)?)?$/.test(text) && !hasZone
    ? `${text.replace(' ', 'T')}+08:00`
    : text;
  const time = Date.parse(normalized);
  return Number.isFinite(time) ? time : null;
}

function dateKey(time: number) {
  return localDateFormat.format(new Date(time));
}

function dateStart(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year, month - 1, day) - 8 * 60 * 60 * 1000;
}

function mondayKey(key: string) {
  const start = dateStart(key);
  const weekday = new Date(start + 8 * 60 * 60 * 1000).getUTCDay();
  const mondayOffset = (weekday + 6) % 7;
  return dateKey(start - mondayOffset * 86400_000);
}

function prettyDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function normalizePunchType(type: string) {
  return type.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function punchLabel(type: string) {
  const normalized = normalizePunchType(type);
  const labels: Record<string, string> = {
    'shift start': 'Shift start',
    'shift end': 'Shift end',
    'start break': 'Break started',
    'end break': 'Break ended',
    'break 1 start': 'Break 1 started',
    'break1 start': 'Break 1 started',
    'break 1 end': 'Break 1 ended',
    'break1 end': 'Break 1 ended',
    'break 2 start': 'Break 2 started',
    'break2 start': 'Break 2 started',
    'break 2 end': 'Break 2 ended',
    'break2 end': 'Break 2 ended',
    'start lunch': 'Lunch started',
    'end lunch': 'Lunch ended',
  };
  return labels[normalized] ?? type.trim().replace(/[_-]+/g, ' ');
}

function calculateDurations(events: PunchEvent[], now: number) {
  const today = dateKey(now);
  const weekStart = dateStart(mondayKey(today));
  const todayStart = dateStart(today);
  let workingSince: number | null = null;
  let todaySeconds = 0;
  let weekSeconds = 0;

  const closeWorkInterval = (end: number) => {
    if (workingSince === null) return;
    todaySeconds += Math.max(0, Math.min(end, now) - Math.max(workingSince, todayStart)) / 1000;
    weekSeconds += Math.max(0, Math.min(end, now) - Math.max(workingSince, weekStart)) / 1000;
    workingSince = null;
  };

  for (const event of events) {
    const timestamp = parseTimestamp(event.timestamp);
    if (timestamp === null || timestamp > now) continue;
    const type = normalizePunchType(event.type);
    if (type === 'shift start') workingSince = timestamp;
    else if (type.includes('break') && type.endsWith('start') || type === 'start break' || type === 'start lunch') closeWorkInterval(timestamp);
    else if (type.includes('break') && type.endsWith('end') || type === 'end break' || type === 'end lunch') workingSince = timestamp;
    else if (type === 'shift end') closeWorkInterval(timestamp);
  }
  if (workingSince !== null) closeWorkInterval(now);
  return { todaySeconds, weekSeconds };
}

function calculateCurrentShiftSeconds(events: PunchEvent[], now: number) {
  let workingSince: number | null = null;
  let seconds = 0;
  for (const event of events) {
    const timestamp = parseTimestamp(event.timestamp);
    if (timestamp === null || timestamp > now) continue;
    const type = normalizePunchType(event.type);
    const pause = type === 'start lunch' || type === 'lunch start' || type.includes('break') && type.endsWith('start') || type === 'start break';
    const resume = type === 'end lunch' || type === 'lunch end' || type.includes('break') && type.endsWith('end') || type === 'end break';
    if (type === 'shift start') workingSince = timestamp;
    else if (pause && workingSince !== null) {
      seconds += Math.max(0, timestamp - workingSince) / 1000;
      workingSince = null;
    } else if (resume && workingSince === null) workingSince = timestamp;
    else if (type === 'shift end' && workingSince !== null) {
      seconds += Math.max(0, timestamp - workingSince) / 1000;
      workingSince = null;
    }
  }
  if (workingSince !== null) seconds += Math.max(0, now - workingSince) / 1000;
  return seconds;
}

function inferStatus(events: PunchEvent[]) {
  const last = events.at(-1);
  if (!last) return 'No shift punches found';
  const type = normalizePunchType(last.type);
  if (type === 'shift end') return 'Shift ended';
  if (type === 'start lunch' || type === 'lunch start') return 'On lunch';
  if (type === 'start break' || type.includes('break') && type.endsWith('start')) return 'On break';
  if (type === 'shift start' || type === 'end lunch' || type === 'end break' || type.includes('break') && type.endsWith('end')) return 'On shift';
  return last.status?.trim() || 'Status recorded';
}

function formatSchedule(start: string | null, end: string | null) {
  if (!start || !end) return 'No active schedule';
  const format = (time: string) => {
    const [hourText, rawMinuteText] = time.split(':');
    const minuteText = (rawMinuteText ?? '00').slice(0, 2);
    const hour = Number(hourText);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${minuteText} ${suffix}`;
  };
  return `${format(start)} – ${format(end)}`;
}

function unavailable(message = 'Time tracking data is not available right now.') : TimeTrackingData {
  return { state: 'unavailable', errorMessage: message };
}

function exactEmailPattern(email: string) {
  return email.replace(/[\\%_]/g, '\\$&');
}

export async function getTimeTrackingData(): Promise<TimeTrackingData> {
  try {
    const sessionClient = createSessionClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return unavailable('Sign in again to view your own time tracking records.');

    // Tracker tables have no authenticated SELECT policies. Keep the privileged key
    // server-only and scope every lookup to the employee resolved from this session.
    const admin = createAdminClient();
    if (!admin) return unavailable('The secure, read-only data connection has not been configured.');

    const email = user.email.trim().toLowerCase();
    const [employeeEmail, companyEmail] = await Promise.all([
      admin.from('employees').select('id,employee_code,employee_name,employee_email,company_email,role_id,position_id,Department').ilike('employee_email', exactEmailPattern(email)),
      admin.from('employees').select('id,employee_code,employee_name,employee_email,company_email,role_id,position_id,Department').ilike('company_email', exactEmailPattern(email)),
    ]);
    if (employeeEmail.error || companyEmail.error) return unavailable();

    const employeeMap = new Map<number, Employee>();
    for (const employee of [...(employeeEmail.data ?? []), ...(companyEmail.data ?? [])]) employeeMap.set(employee.id, employee as Employee);
    if (employeeMap.size !== 1) return { state: 'not_employee' };
    const employee = Array.from(employeeMap.values())[0];
    const now = new Date();
    const nowIso = now.toISOString();
    const nowMs = now.getTime();

    const [logResult, scheduleResult, assignmentResult, roleResult, positionResult, phoneRowsResult, sameNameRows] = await Promise.all([
      admin.from('time_tracker_logs').select('TYPE,TIMESTAMP,DURATION,STATUS').eq('EMPLOYEE ID', employee.id).order('TIMESTAMP', { ascending: false }).limit(1500),
      admin.from('employee_work_schedules').select('shift_start,shift_end,shift_type,time_zone').eq('employee_id', employee.id).eq('is_active', true).lte('effective_from', nowIso).or(`effective_to.is.null,effective_to.gt.${nowIso}`).order('effective_from', { ascending: false }).limit(1).maybeSingle(),
      admin.from('employee_assignments').select('account_id').eq('employee_id', employee.id).or(`effective_from.is.null,effective_from.lte.${nowIso}`).or(`effective_to.is.null,effective_to.gt.${nowIso}`).order('effective_from', { ascending: false }).limit(1).maybeSingle(),
      employee.role_id === null ? Promise.resolve({ data: null, error: null }) : admin.from('roles').select('role_name').eq('role_id', employee.role_id).maybeSingle(),
      employee.position_id === null ? Promise.resolve({ data: null, error: null }) : admin.from('positions').select('position_name').eq('position_id', employee.position_id).maybeSingle(),
      admin.from('phone_time_tracker').select('date_of_shift,account,total_minutes,ticket_number,tagging,summary').eq('name', employee.employee_name ?? '').limit(100),
      admin.from('employees').select('id').eq('employee_name', employee.employee_name ?? ''),
    ]);
    if (logResult.error || scheduleResult.error || assignmentResult.error || roleResult.error || positionResult.error || phoneRowsResult.error || sameNameRows.error) return unavailable();

    let accountName: string | undefined;
    if (assignmentResult.data?.account_id) {
      const { data, error } = await admin.from('accounts').select('account_name').eq('account_id', assignmentResult.data.account_id).maybeSingle();
      if (error) return unavailable();
      accountName = data?.account_name ?? undefined;
    }

    const rawEvents = (logResult.data ?? []).map((row: Record<string, unknown>) => ({
      type: String(row.TYPE ?? ''),
      timestamp: String(row.TIMESTAMP ?? ''),
      duration: row.DURATION == null ? null : String(row.DURATION),
      status: row.STATUS == null ? null : String(row.STATUS),
    })).filter((event: PunchEvent) => event.type && parseTimestamp(event.timestamp) !== null)
      .sort((left: PunchEvent, right: PunchEvent) => (parseTimestamp(left.timestamp) ?? 0) - (parseTimestamp(right.timestamp) ?? 0));
    const latestShiftStart = rawEvents.map((event: PunchEvent) => normalizePunchType(event.type)).lastIndexOf('shift start');
    const currentShiftEvents = latestShiftStart >= 0 ? rawEvents.slice(latestShiftStart) : rawEvents.slice(-20);
    const totals = calculateDurations(rawEvents, nowMs);
    const employeeName = employee.employee_name?.trim() || 'Employee';
    const workRecords = (sameNameRows.data?.length === 1 ? phoneRowsResult.data ?? [] : []).map((record: Record<string, unknown>) => {
      const parsedMinutes = Number(String(record.total_minutes ?? '').replace(/[^\d.]/g, ''));
      return {
        date: String(record.date_of_shift ?? ''),
        account: String(record.account ?? ''),
        minutes: Number.isFinite(parsedMinutes) ? parsedMinutes : null,
        ticket: String(record.ticket_number ?? ''),
        tags: String(record.tagging ?? ''),
        summary: String(record.summary ?? ''),
      };
    }).sort((left: WorkRecord, right: WorkRecord) => (parseTimestamp(right.date) ?? 0) - (parseTimestamp(left.date) ?? 0)).slice(0, 20);
    const latestPunch = currentShiftEvents.at(-1);

    return {
      state: rawEvents.length || workRecords.length ? 'ready' : 'empty',
      name: employeeName,
      employeeCode: employee.employee_code ?? undefined,
      role: roleResult.data?.role_name ?? positionResult.data?.position_name ?? 'Employee',
      department: employee.Department ?? undefined,
      account: accountName,
      schedule: formatSchedule(scheduleResult.data?.shift_start ?? null, scheduleResult.data?.shift_end ?? null),
      todaySeconds: totals.todaySeconds,
      weekSeconds: totals.weekSeconds,
      currentShiftSeconds: calculateCurrentShiftSeconds(currentShiftEvents, nowMs),
      events: currentShiftEvents,
      workRecords,
      currentStatus: inferStatus(currentShiftEvents),
      lastPunch: latestPunch?.timestamp,
    };
  } catch {
    return unavailable();
  }
}

export { dateKey, parseTimestamp, prettyDuration, punchLabel };
