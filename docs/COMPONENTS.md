# Component Documentation

## Layout Components

### `AppShell`
Root layout wrapper providing sidebar (desktop), mobile bottom nav, and dark mode class toggling.

### `Sidebar`
Desktop navigation with links to Dashboard, Meetings, Calendar, Analytics, Settings. Includes "New Meeting" CTA.

### `MobileNav`
Fixed bottom navigation for mobile with Meetings, Calendar, Notifications (with unread badge), and Profile.

---

## Meeting Components

### `MeetingCard`
Displays a meeting summary with status badge, title, description, time/duration, attendee count, and optional response progress bar.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `meeting` | `Meeting` | required | Meeting data object |
| `showProgress` | `boolean` | `true` | Show availability response progress |

### `RecommendationCard`
Shows a ranked meeting time recommendation with attendance breakdown and preferred-not privacy handling.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `recommendation` | `Recommendation` | required | Recommendation data |
| `selected` | `boolean` | — | Highlight as selected |
| `onSelect` | `() => void` | — | Selection handler |
| `showManualDetails` | `boolean` | — | Reveal preferred-not participant names |
| `preferredNotNames` | `string[]` | — | Names for manual coordination mode |

### `AvailabilityGrid`
Interactive slot picker with 3-state cycling. Renders as calendar grid (desktop) or scrollable cards (mobile).

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `slots` | `TimeSlot[]` | required | Candidate time slots |
| `availability` | `AvailabilityEntry[]` | required | Current availability data |
| `userId` | `string` | required | User submitting availability |
| `onChange` | `(slotId, state) => void` | required | State change callback |

Automatically renders **scrollable cards** on mobile (<768px) and **calendar grid** on tablet/desktop.

**State colors:**
- Green = Available (default)
- Yellow = Preferred Not (soft constraint, private)
- Red = Unavailable (hard constraint)

### `ParticipantBadge`
Avatar + name display with required/optional and response status indicators.

### `StatusBadge`
Color-coded badge for meeting lifecycle status.

### `Timeline`
Visual stepper showing meeting lifecycle progress. Supports compact horizontal scroll on mobile.

### `StatisticsCard`
Dashboard metric card with icon, value, subtitle, and optional trend indicator.

### `ConfirmationDialog`
Modal for organizer to confirm a selected recommendation. Explains auto-confirm vs. confirmation-request flow.

### `ChangeRequestModal`
Modal for attendees to submit change requests with reason selection and optional notes.

### `CreateMeetingForm`
Full meeting creation form with attendee role assignment and invitation sending.

---

## Matching Engine

Located at `src/lib/matching-engine.ts`.

**Algorithm:**
1. Generate candidate slots from date range and duration
2. Remove slots where ANY required attendee is unavailable
3. Rank remaining by: required attendance → optional attendance → least preferred-not
4. Return top 3 with human-readable explanations

**Privacy:** `preferredNotCount` is always aggregated. Names only exposed when `manualCoordinationMode` is enabled.

---

## State Management

`useMeetingStore` (Zustand + localStorage persistence) manages:
- Meetings array with full lifecycle
- Notifications
- Dark mode preference
- All CRUD and flow actions (create, invite, availability, match, confirm, change request)
