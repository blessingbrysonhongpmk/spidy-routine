import { DayOfWeek } from '@/types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateHeader(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);

  const dayShort = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

  return `${dayShort}, ${monthShort} ${day} • ${dayName}`;
}

export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);

  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

export function getMonthMatrix(year: number, month: number): (string | null)[][] {
  // month: 0-indexed (0 = Jan, 11 = Dec)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const totalDays = lastDay.getDate();
  const startingDayIndex = firstDay.getDay(); // 0 = Sun

  const matrix: (string | null)[][] = [];
  let currentWeek: (string | null)[] = [];

  // Pad beginning with null
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

  // Pad end if needed
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
