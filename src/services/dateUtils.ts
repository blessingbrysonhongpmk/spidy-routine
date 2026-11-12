import { DayOfWeek } from '@/types';

export const WEEKDAYS_ORDERED: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function formatLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatLocalDateString(new Date());
}

export function parseLocalDate(dateStr: string): Date {
  const parts = (dateStr || '').split('-');
  if (parts.length !== 3) return new Date();
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();
  return new Date(year, month, day);
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatLocalDateString(date);
}

export function formatDateHeader(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);

  const dayShort = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

  return `${dayShort}, ${monthShort} ${day} • ${dayName}`;
}

export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = parseLocalDate(dateStr);

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFullDateLabel(dateStr: string): string {
  const today = getTodayDateString();
  if (dateStr === today) return 'Today';
  if (dateStr === addDaysToDateString(today, 1)) return 'Tomorrow';
  if (dateStr === addDaysToDateString(today, -1)) return 'Yesterday';

  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const date = parseLocalDate(dateStr);
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

/**
 * Returns the Monday–Sunday 7-day sequence containing `anchorDateStr` in local timezone.
 */
export function getWeekDatesForDate(anchorDateStr?: string): {
  day: DayOfWeek;
  date: string;
  dayNumber: number;
  isToday: boolean;
}[] {
  const todayStr = getTodayDateString();
  const anchor = parseLocalDate(anchorDateStr || todayStr);
  // getDay(): 0 = Sun, 1 = Mon ... 6 = Sat
  // Offset so Monday = 0, Tuesday = 1 ... Sunday = 6
  const jsDay = anchor.getDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;

  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + mondayOffset);

  const result: {
    day: DayOfWeek;
    date: string;
    dayNumber: number;
    isToday: boolean;
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatLocalDateString(d);
    result.push({
      day: WEEKDAYS_ORDERED[i],
      date: dateStr,
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  return result;
}

/**
 * Parses either 24h ("14:30", "07:00") or 12h ("7:00 PM", "6:30 AM", "12:00 AM") into { hours, minutes }.
 */
export function parseTimeToHoursMinutes(
  timeStr?: string
): { hours: number; minutes: number } | null {
  if (!timeStr || !timeStr.trim()) return null;
  const raw = timeStr.trim().toUpperCase();

  // Check 12-hour format first: e.g. "7:00 PM", "06:45AM"
  const match12 = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3];
    if (isNaN(hours) || isNaN(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      return null;
    }
    if (period === 'AM') {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }
    return { hours, minutes };
  }

  // Check 24-hour format: e.g. "14:30", "09:00"
  const match24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    return { hours, minutes };
  }

  return null;
}

export function timeToMinutes(timeStr?: string): number {
  const parsed = parseTimeToHoursMinutes(timeStr);
  if (!parsed) return Number.MAX_SAFE_INTEGER;
  return parsed.hours * 60 + parsed.minutes;
}

/**
 * Converts "19:00" -> "7:00 PM" or normalizes "07:00 AM" -> "7:00 AM".
 */
export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr || !timeStr.trim()) return '';
  const parsed = parseTimeToHoursMinutes(timeStr);
  if (!parsed) return timeStr.trim();

  const period = parsed.hours >= 12 ? 'PM' : 'AM';
  const displayHour = parsed.hours % 12 === 0 ? 12 : parsed.hours % 12;
  const displayMin = String(parsed.minutes).padStart(2, '0');
  return `${displayHour}:${displayMin} ${period}`;
}

export function parseReminderOffsetMinutes(reminderTime?: string): number {
  if (!reminderTime) return 0;
  const lower = reminderTime.toLowerCase();
  if (lower.includes('hour')) {
    const num = parseInt(lower, 10);
    return isNaN(num) ? 60 : num * 60;
  }
  if (lower.includes('min')) {
    const num = parseInt(lower, 10);
    return isNaN(num) ? 10 : num;
  }
  return 0;
}

export function getMonthMatrix(year: number, month: number): (string | null)[][] {
  // month: 0-indexed (0 = Jan, 11 = Dec)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const totalDays = lastDay.getDate();
  const startingDayIndex = firstDay.getDay(); // 0 = Sun

  const matrix: (string | null)[][] = [];
  let currentWeek: (string | null)[] = [];

  for (let i = 0; i < startingDayIndex; i++) {
    currentWeek.push(null);
  }

  for (let d = 1; d <= totalDays; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    currentWeek.push(`${year}-${monthStr}-${dayStr}`);

    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    matrix.push(currentWeek);
  }

  return matrix;
}

export function getMonthName(month: number): string {
  const date = new Date(2026, month, 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
}
