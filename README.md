# SPIDEY FLOW — YOUR DAY. YOUR MISSION.

A personal productivity, routine, and task management mobile application engineered with **React Native** and **Expo**. Designed with the craftsmanship, restraint, and consistency found in top-tier commercial mobile applications (Linear, Things 3, Bear).

---

## 🎨 Premium Superhero Design System

Rather than relying on loud illustrations, garish neons, or gaming aesthetics, **SPIDEY FLOW** integrates three superhero visual influences directly into its design tokens and micro-interactions:

- **Spider-Man (Action & Energy)**:
  - Deep refined crimson accents (`#EF4444`, `rgba(239, 68, 68, 0.12)`).
  - Razor-thin geometric web lines (0.5px hairline) integrated subtly into the header canvas.
  - Tactile web-shoot snap audio interaction on task completion.
- **Thor (Power & Focus)**:
  - Tactical electric-blue accents (`#0EA5E9`) for active focus and upcoming priorities.
  - Restrained metallic gold (`#F59E0B`) for milestone accomplishments.
  - Electric crackle audio cue on progress milestones.
- **Venom (Atmosphere & Depth)**:
  - Deep warm near-black charcoal surfaces (`#0B0C0E`, `#13151A`).
  - Subtle twilight purple tones (`#8B5CF6`) for evening/night routine protocols.
  - Quiet ambient dusk vignette at screen borders.

---

## 📱 Navigation & Screens Architecture

### 1. Today — Main Dashboard
Engineered for immediate comprehension within 3 seconds:
1. **Greeting & Current Date**:
   - Modern brand wordmark `SPIDEY FLOW` with crimson indicator.
   - Operative avatar (`B`) and notification bell.
   - Dynamic greeting and formatted calendar date badge.
2. **Today's Mission Progress**:
   - Compact 70px precision progress ring with smooth Reanimated arc.
   - Combined task and routine completion tallies.
   - Milestone conquered badge when all objectives are complete.
3. **Next Upcoming Activity**:
   - High-priority action card with Thor electric-blue left accent.
   - Scheduled time, title, and accessible `✓ Complete` button with haptic feedback.
4. **Daily Routine Timeline**:
   - Structured 4-stage day: Morning (Suit Up), Afternoon (Mission), Evening (Recharge), Night (Reset).
   - Expandable inline activity rows with direct completion checkboxes.
5. **Independent Tasks**:
   - Today's tasks with instant filter pills: *All*, *Pending*, *Completed*.
   - 44pt touch target checkboxes with web-shoot audio feedback.
   - Task title, scheduled time, tactical notes, and quick edit/delete actions.
6. **Quick-Add Action**:
   - Refined `+ New Mission Task` primary CTA button.

### 2. Routine Protocols
- Segmented control across Morning, Afternoon, Evening, and Night.
- Date-isolated completion tracking (`routine_completions` in SQLite).
- Configured protocols view showing repeat days (`Daily`, `Mon–Fri`).
- Easy inline activity addition and management.

### 3. Tactical Calendar
- Clean monthly matrix with previous/next month navigation and "Today" button.
- 4px precision task indicator dots: Crimson for pending, emerald for completed.
- Selected date agenda with immediate task scheduling for that specific date.

### 4. Settings & Cinematic Sound Control (Section 18)
- Security clearance profile & sign-out.
- Master UI sound effects toggle & volume stepper.
- Haptic feedback pulse toggle.
- Interactive **Audio Asset Preview** grid for testing superhero sound effects.
- SQLite local database statistics and reset controls.

---

## 🛠️ Technology Stack

- **Framework**: React Native 0.88 + Expo SDK 58 (Expo Router 58, React 19)
- **Database**: `expo-sqlite` (WAL journal mode, foreign keys, indexed queries)
- **Audio & Haptics**: `expo-av`, `expo-haptics` (in-memory 16-bit PCM WAV synthesizer)
- **Animations & Graphics**: `react-native-reanimated`, `react-native-svg`
- **Notifications**: `expo-notifications` (scheduled local alerts & Android channels)
- **Authentication**: `firebase/auth` + persistent offline SQLite session
- **Language**: TypeScript (Strict Mode)

---

## 🧪 Quality Assurance & Verification

- `npx tsc --noEmit`: **0 errors (Clean Pass)**
- `npx expo-doctor`: **20/20 checks passed**
- `npx expo export --platform android`: **1,939 modules bundled to Hermes bytecode**
