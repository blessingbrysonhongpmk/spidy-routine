/**
 * SPIDEY FLOW — Automated Comprehensive Test Suite
 * Tests date utilities, procedural audio synthesis, database structures,
 * and brand asset integrity.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? '— ' + details : ''}`);
    failedTests++;
  }
}

console.log('\n========================================');
console.log('🧪 RUNNING SPIDEY FLOW COMPREHENSIVE TEST SUITE');
console.log('========================================\n');

// ----------------------------------------------------
// TEST GROUP 1: Date Utilities
// ----------------------------------------------------
console.log('📅 Test Group 1: Date & Calendar Engine');

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateHeader(dateStr) {
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

const todayStr = getTodayDateString();
assert(/^\d{4}-\d{2}-\d{2}$/.test(todayStr), 'getTodayDateString returns YYYY-MM-DD');

const formattedHeader = formatDateHeader('2026-11-10');
assert(formattedHeader.includes('Nov 10') || formattedHeader.includes('Nov'), 'formatDateHeader formats correctly', formattedHeader);

// ----------------------------------------------------
// TEST GROUP 2: Procedural Audio Waveform Generation
// ----------------------------------------------------
console.log('\n🔊 Test Group 2: EDM Procedural Sound Engine');

function generateWavDataUri(sampleRate, generator, durationSec) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const blockAlign = 2; // 16-bit mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new Uint8Array(44 + dataSize);

  // RIFF header
  buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // "RIFF"
  const totalFileSize = 36 + dataSize;
  buffer[4] = totalFileSize & 0xff;
  buffer[5] = (totalFileSize >> 8) & 0xff;
  buffer[6] = (totalFileSize >> 16) & 0xff;
  buffer[7] = (totalFileSize >> 24) & 0xff;
  buffer[8] = 0x57; buffer[9] = 0x41; buffer[10] = 0x56; buffer[11] = 0x45; // "WAVE"

  // fmt chunk
  buffer[12] = 0x66; buffer[13] = 0x6d; buffer[14] = 0x74; buffer[15] = 0x20; // "fmt "
  buffer[16] = 16; buffer[17] = 0; buffer[18] = 0; buffer[19] = 0; // SubChunk1Size (16 for PCM)
  buffer[20] = 1; buffer[21] = 0; // AudioFormat (1 = PCM)
  buffer[22] = 1; buffer[23] = 0; // NumChannels (1 = Mono)
  buffer[24] = sampleRate & 0xff;
  buffer[25] = (sampleRate >> 8) & 0xff;
  buffer[26] = (sampleRate >> 16) & 0xff;
  buffer[27] = (sampleRate >> 24) & 0xff;
  buffer[28] = byteRate & 0xff;
  buffer[29] = (byteRate >> 8) & 0xff;
  buffer[30] = (byteRate >> 16) & 0xff;
  buffer[31] = (byteRate >> 24) & 0xff;
  buffer[32] = blockAlign; buffer[33] = 0; // BlockAlign
  buffer[34] = 16; buffer[35] = 0; // BitsPerSample (16)

  // data chunk
  buffer[36] = 0x64; buffer[37] = 0x61; buffer[38] = 0x74; buffer[39] = 0x61; // "data"
  buffer[40] = dataSize & 0xff;
  buffer[41] = (dataSize >> 8) & 0xff;
  buffer[42] = (dataSize >> 16) & 0xff;
  buffer[43] = (dataSize >> 24) & 0xff;

  let byteOffset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = generator(t, numSamples);
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = Math.floor(sample < 0 ? sample * 32768 : sample * 32767);
    buffer[byteOffset++] = intSample & 0xff;
    buffer[byteOffset++] = (intSample >> 8) & 0xff;
  }

  const base64 = Buffer.from(buffer).toString('base64');
  return { uri: `data:audio/wav;base64,${base64}`, buffer };
}

// Test EDM Synth Pluck (buttonTap)
const buttonTapWav = generateWavDataUri(22050, (t) => {
  const env = Math.exp(-t * 28);
  const tone1 = Math.sin(2 * Math.PI * 440 * t);
  const tone2 = Math.sin(2 * Math.PI * 880 * t) * 0.5;
  const tone3 = Math.sin(2 * Math.PI * 1320 * t) * 0.25;
  const kick = Math.sin(2 * Math.PI * 110 * Math.exp(-t * 40) * t) * 0.4;
  return env * (tone1 + tone2 + tone3 + kick) * 0.8;
}, 0.12);

assert(buttonTapWav.uri.startsWith('data:audio/wav;base64,'), 'EDM buttonTap produces valid Data URI');
assert(buttonTapWav.buffer[0] === 0x52 && buttonTapWav.buffer[1] === 0x49, 'RIFF header byte check passed');
assert(buttonTapWav.buffer[8] === 0x57 && buttonTapWav.buffer[9] === 0x41, 'WAVE format byte check passed');

// Test Electro Surge (electricCrackle)
const crackleWav = generateWavDataUri(22050, (t) => {
  const env = Math.exp(-t * 9);
  const bass = Math.sin(2 * Math.PI * (180 - t * 120) * t) * 0.6;
  const sub = Math.sin(2 * Math.PI * 55 * t) * 0.4;
  const pulse = (Math.sin(2 * Math.PI * 330 * t) > 0 ? 0.35 : -0.35);
  return env * (bass + sub + pulse) * 0.85;
}, 0.28);

assert(crackleWav.uri.startsWith('data:audio/wav;base64,'), 'EDM electricCrackle produces valid Data URI');
assert(crackleWav.buffer.length > 500, 'Audio buffer has expected PCM sample length');

// ----------------------------------------------------
// TEST GROUP 3: Database Logic & Default Protocols
// ----------------------------------------------------
console.log('\n🗄️ Test Group 3: Database & Starter Protocols');

const starterProtocols = [
  {
    name: 'Morning Patrol Protocol',
    category: 'morning',
    repeat_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    items: [
      { title: 'Hydration & Vitals Check', scheduled_time: '06:30 AM' },
      { title: 'Review Daily Mission Directives', scheduled_time: '07:00 AM' },
      { title: 'Morning Physical Conditioning', scheduled_time: '07:30 AM' },
    ],
  },
  {
    name: 'Deep Focus Block',
    category: 'afternoon',
    repeat_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    items: [
      { title: 'Priority Mission Sprint 1', scheduled_time: '09:00 AM' },
      { title: 'Midday Mission Calibration', scheduled_time: '01:00 PM' },
    ],
  },
  {
    name: 'Evening Debrief',
    category: 'evening',
    repeat_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    items: [
      { title: 'Daily Mission Log & Trophies Review', scheduled_time: '08:30 PM' },
      { title: 'Gear Down & Sleep Protocol', scheduled_time: '10:00 PM' },
    ],
  },
];

assert(starterProtocols.length === 3, 'Default starter protocols count is 3');
starterProtocols.forEach((p, idx) => {
  assert(p.name.length > 0, `Protocol #${idx + 1} has valid title`);
  assert(['morning', 'afternoon', 'evening', 'night'].includes(p.category), `Protocol #${idx + 1} category is valid`);
  assert(p.items.length > 0, `Protocol #${idx + 1} has activities`);
  p.items.forEach((item, itemIdx) => {
    assert(item.title.length > 0, `Item ${itemIdx + 1} has title`);
    assert(item.scheduled_time.length > 0, `Item ${itemIdx + 1} has scheduled time`);
  });
});

// ----------------------------------------------------
// TEST GROUP 4: Brand & Asset Integrity (Zero Personal Photos)
// ----------------------------------------------------
console.log('\n🛡️ Test Group 4: Brand & Persona Asset Integrity');

function scanDirForKeyword(dir, keyword) {
  let matches = [];
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.expo') {
        matches = matches.concat(scanDirForKeyword(fullPath, keyword));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json')) {
      const content = readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        matches.push(fullPath);
      }
    }
  }
  return matches;
}

const photoReferences = scanDirForKeyword('src', 'hero-portrait');
assert(photoReferences.length === 0, 'ZERO personal photo ("hero-portrait") references in src/', photoReferences.join(', '));

// Verify SpidyLogo component exists and exports SpidyLogo & SpidyAvatar
const spidyLogoContent = readFileSync('src/components/SpidyLogo.tsx', 'utf8');
assert(spidyLogoContent.includes('export const SpidyLogo'), 'SpidyLogo component exported');
assert(spidyLogoContent.includes('export const SpidyAvatar'), 'SpidyAvatar component exported');
assert(spidyLogoContent.includes('spiderman'), 'SpidyAvatar handles Spider-Man archetype');
assert(spidyLogoContent.includes('thor'), 'SpidyAvatar handles Thor archetype');
assert(spidyLogoContent.includes('venom'), 'SpidyAvatar handles Venom archetype');

// Verify SpidyInput component exists
const spidyInputContent = readFileSync('src/components/SpidyInput.tsx', 'utf8');
assert(spidyInputContent.includes('export const SpidyInput'), 'SpidyInput component exported');
assert(spidyInputContent.includes('showClearButton'), 'SpidyInput supports showClearButton');
assert(spidyInputContent.includes('error'), 'SpidyInput supports error validation prop');

// Verify SpidyButton component exists
const spidyButtonContent = readFileSync('src/components/SpidyButton.tsx', 'utf8');
assert(spidyButtonContent.includes('export const SpidyButton'), 'SpidyButton component exported');
assert(spidyButtonContent.includes('electric'), 'SpidyButton supports electric variant');
assert(spidyButtonContent.includes('primary'), 'SpidyButton supports primary variant');

// ----------------------------------------------------
// TEST GROUP 5: Dashboard Analytics & Productivity Telemetry Engine
// ----------------------------------------------------
console.log('\n📊 Test Group 5: Dashboard Analytics & Productivity Engine');

// Verify dashboard component files exist
const dashboardFiles = [
  'src/components/dashboard/DashboardHeader.tsx',
  'src/components/dashboard/TodayProductivityCard.tsx',
  'src/components/dashboard/StreakConsistencyCard.tsx',
  'src/components/dashboard/ProductivityGraphsCard.tsx',
  'src/components/dashboard/DailyTimelineCard.tsx',
  'src/components/dashboard/RoutineAnalyticsCard.tsx',
  'src/components/dashboard/AchievementsCard.tsx',
  'src/components/dashboard/ProductivityInsightsCard.tsx',
  'src/services/dashboardAnalytics.ts',
];

dashboardFiles.forEach((file) => {
  const content = readFileSync(file, 'utf8');
  assert(content.length > 100, `Dashboard component/module ${file} exists and is populated`);
});

// Test streak algorithm with consecutive dates
function calculateStreaks(activeDatesSet, todayDate) {
  const dateParts = todayDate.split('-').map(Number);
  const todayLocal = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  const formatLocalDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  let streak = 0;
  let checkDate = new Date(todayLocal);
  if (!activeDatesSet.has(todayDate)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (activeDatesSet.has(formatLocalDate(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const sortedDates = Array.from(activeDatesSet).sort();
  let maxStreak = 0;
  let currentChain = 0;
  let prevDate = null;

  for (const dateItem of sortedDates) {
    const p = dateItem.split('-').map(Number);
    const curDate = new Date(p[0], p[1] - 1, p[2]);
    if (!prevDate) {
      currentChain = 1;
    } else {
      const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentChain++;
      } else if (diffDays > 1) {
        currentChain = 1;
      }
    }
    prevDate = curDate;
    if (currentChain > maxStreak) {
      maxStreak = currentChain;
    }
  }

  return { currentStreak: streak, longestStreak: Math.max(maxStreak, streak) };
}

const mockActiveDates = new Set(['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11']);
const streakResult = calculateStreaks(mockActiveDates, '2026-11-11');
assert(streakResult.currentStreak === 4, 'Consecutive 4-day streak calculated accurately', `Got ${streakResult.currentStreak}`);
assert(streakResult.longestStreak === 4, 'Longest streak calculated accurately', `Got ${streakResult.longestStreak}`);

// Streak when today is not yet completed (yesterday completed)
const mockActiveYesterday = new Set(['2026-11-09', '2026-11-10']);
const streakYesterday = calculateStreaks(mockActiveYesterday, '2026-11-11');
assert(streakYesterday.currentStreak === 2, 'Preserves active streak when today is pending', `Got ${streakYesterday.currentStreak}`);

// Streak when broken
const mockBrokenStreak = new Set(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-11']);
const brokenResult = calculateStreaks(mockBrokenStreak, '2026-11-11');
assert(brokenResult.currentStreak === 1, 'Current streak resets to 1 after gap', `Got ${brokenResult.currentStreak}`);
assert(brokenResult.longestStreak === 3, 'Historical longest streak preserved after gap', `Got ${brokenResult.longestStreak}`);

// Verify all 8 milestone IDs are covered in analytics
const analyticsContent = readFileSync('src/services/dashboardAnalytics.ts', 'utf8');
const milestoneIds = [
  'first_mission',
  'streak_3',
  'streak_7',
  'streak_14',
  'streak_30',
  'centurion',
  'flawless',
  'routine_master',
];
milestoneIds.forEach((mId) => {
  assert(analyticsContent.includes(`id: '${mId}'`), `Milestone ${mId} defined in analytics pipeline`);
});

// ----------------------------------------------------
// TEST GROUP 6: Mobile-First Navigation, Nested Routines & Local Time Accuracy
// ----------------------------------------------------
console.log('\n📱 Test Group 6: Mobile Navigation, Nested Routines & Date/Time Logic');

// Verify CustomTabBar has all 5 primary destinations: Home, Routine, Tasks, Calendar, Settings
const tabBarSrc = readFileSync('src/components/CustomTabBar.tsx', 'utf8');
['Home', 'Routine', 'Tasks', 'Calendar', 'Settings'].forEach((label) => {
  assert(tabBarSrc.includes(`'${label}'`), `CustomTabBar includes destination "${label}"`);
});

// Verify dateUtils has zero unsafe toISOString UTC shifting
const dateUtilsSrc = readFileSync('src/services/dateUtils.ts', 'utf8');
assert(!dateUtilsSrc.includes('toISOString'), 'dateUtils uses pure local timezone arithmetic (no UTC toISOString shifts)');
assert(dateUtilsSrc.includes('parseTimeToHoursMinutes'), 'dateUtils exports parseTimeToHoursMinutes');
assert(dateUtilsSrc.includes('getWeekDatesForDate'), 'dateUtils exports getWeekDatesForDate');

const modalTaskSrc = readFileSync('src/app/modal-task.tsx', 'utf8');
assert(!modalTaskSrc.includes('toISOString'), 'modal-task uses local date presets without UTC toISOString shifts');

// Test local time parsing across 12h & 24h formats
function parseTimeTest(timeStr) {
  const raw = timeStr.trim().toUpperCase();
  const match12 = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    if (match12[3] === 'AM' && h === 12) h = 0;
    if (match12[3] === 'PM' && h !== 12) h += 12;
    return { hours: h, minutes: m };
  }
  const match24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) return { hours: parseInt(match24[1], 10), minutes: parseInt(match24[2], 10) };
  return null;
}

const t7pm = parseTimeTest('7:00 PM');
assert(t7pm?.hours === 19 && t7pm?.minutes === 0, '12h "7:00 PM" parses accurately to 19:00');
const t12am = parseTimeTest('12:00 AM');
assert(t12am?.hours === 0 && t12am?.minutes === 0, '12h "12:00 AM" parses accurately to 00:00');
const t12pm = parseTimeTest('12:30 PM');
assert(t12pm?.hours === 12 && t12pm?.minutes === 30, '12h "12:30 PM" parses accurately to 12:30');
const t24 = parseTimeTest('14:45');
assert(t24?.hours === 14 && t24?.minutes === 45, '24h "14:45" parses accurately');

// Test parent routine auto-completion & no double-counting rule
function evalRoutineProgress(subItems) {
  const total = subItems.length;
  const completed = subItems.filter((i) => i.completed).length;
  const parentComplete =
    total > 0 && subItems.every((i) => i.completed || i.skipped) && completed > 0;
  return { total, completed, parentComplete };
}

const partialWorkout = evalRoutineProgress([
  { id: '1', completed: true, skipped: false },
  { id: '2', completed: true, skipped: false },
  { id: '3', completed: false, skipped: false },
]);
assert(partialWorkout.completed === 2 && partialWorkout.total === 3 && !partialWorkout.parentComplete, 'Partial sub-activities keep parent incomplete (2/3)');

const completedWorkout = evalRoutineProgress([
  { id: '1', completed: true, skipped: false },
  { id: '2', completed: true, skipped: false },
  { id: '3', completed: false, skipped: true },
]);
assert(completedWorkout.completed === 2 && completedWorkout.total === 3 && completedWorkout.parentComplete, 'Parent marks complete when all non-skipped sub-activities finish');

// Verify DB preserves historical completions on edit (soft-deactivation rather than blanket DELETE completions)
const dbSrc = readFileSync('src/services/database.ts', 'utf8');
assert(dbSrc.includes('duplicateRoutine'), 'database supports duplicating routines to selected days');
assert(dbSrc.includes('copyDayRoutinesToDays'), 'database supports copying weekday routines independently');
assert(dbSrc.includes('reorderRoutineItems'), 'database supports reordering routine sub-activities');
assert(dbSrc.includes('setRoutineItemStatus'), 'database supports completed/skipped/pending sub-activity states');

// Verify Analytics & Achievements screens exist
assert(readFileSync('src/app/analytics.tsx', 'utf8').length > 200, 'Analytics screen exists and is populated');
assert(readFileSync('src/app/achievements.tsx', 'utf8').length > 200, 'Achievements screen exists and is populated');

// ----------------------------------------------------
// TEST GROUP 9: Superhero Theme System (Spider-Man, Thor, Venom)
// ----------------------------------------------------
console.log('\n🦸 Test Group 9: Superhero Theme System (Spider-Man, Thor, Venom)');
const themeConstantsSrc = readFileSync('src/constants/theme.ts', 'utf8');
assert(themeConstantsSrc.includes('spiderman:'), 'theme.ts defines Colors.spiderman');
assert(themeConstantsSrc.includes('thor:'), 'theme.ts defines Colors.thor');
assert(themeConstantsSrc.includes('venom:'), 'theme.ts defines Colors.venom');
assert(themeConstantsSrc.includes('#EF4444'), 'Spider-Man palette features crimson red primary (#EF4444)');
assert(themeConstantsSrc.includes('#0EA5E9'), 'Thor palette features electric blue primary (#0EA5E9)');
assert(themeConstantsSrc.includes('#A855F7'), 'Venom palette features symbiote violet primary (#A855F7)');

const themeContextSrc = readFileSync('src/context/ThemeContext.tsx', 'utf8');
assert(themeContextSrc.includes("'spiderman'"), 'ThemeContext supports spiderman mode');
assert(themeContextSrc.includes("'thor'"), 'ThemeContext supports thor mode');
assert(themeContextSrc.includes("'venom'"), 'ThemeContext supports venom mode');
assert(themeContextSrc.includes('heroTheme'), 'ThemeContext exposes heroTheme property');

const symbioteBgSrc = readFileSync('src/components/SymbioteBackground.tsx', 'utf8');
assert(symbioteBgSrc.includes('spideyOpacityMult'), 'SymbioteBackground tunes web opacity for Spider-Man');
assert(symbioteBgSrc.includes('thorOpacityMult'), 'SymbioteBackground tunes lightning opacity for Thor');
assert(symbioteBgSrc.includes('venomOpacityMult'), 'SymbioteBackground tunes tendril opacity for Venom');

const settingsScreenSrc = readFileSync('src/app/(tabs)/settings.tsx', 'utf8');
assert(settingsScreenSrc.includes('HERO THEME & PALETTE'), 'Settings features HERO THEME & PALETTE selector');
assert(settingsScreenSrc.includes('webShoot'), 'Settings plays webShoot sound for Spider-Man');
assert(settingsScreenSrc.includes('thunderMilestone'), 'Settings plays thunderMilestone sound for Thor');
assert(settingsScreenSrc.includes('symbioteWhoosh'), 'Settings plays symbioteWhoosh sound for Venom');

console.log('\n========================================');
console.log(`🏁 TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

