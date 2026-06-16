# Reading Plan Progress Tracking System

## Overview
The reading plan system now automatically tracks progress **per logged-in user**. When users log in, their reading plans and daily progress are loaded and saved automatically.

## How It Works

### 1. **User-Specific Storage**
- Each user's plans are stored with their email as the key
- Storage key format: `reading_plans_[userEmail]`
- Plans are stored locally on the device in AsyncStorage

### 2. **Progress Tracking Points**

#### When User Logs In:
```
1. User logs in with email/password
2. ReadingPlanContext loads plans for that user
3. Active plan is automatically loaded
4. Progress bar shows days completed
```

#### When User Reads a Chapter:
```
1. User reads a Bible chapter
2. Reader screen calls: markDayComplete(planId, dayNumber)
3. Progress is updated and saved to device
4. Next time app opens, progress is preserved
```

#### When User Logs Out:
```
1. Plans stay saved on device
2. On next login, old plans are loaded
3. Users can continue from where they left off
```

### 3. **Data Structure**

Each user plan is stored as:
```typescript
interface UserReadingPlan {
  id: string;                    // Unique plan instance ID
  planId: string;                // Reference to plan template (gospel_30, etc)
  userId: string;                // User's email
  startDate: string;             // ISO date string
  completedDays: number;         // Days finished
  currentDay: number;            // Current day in plan
  completed: boolean;            // Plan finished?
}
```

### 4. **ReadingPlanContext API**

The `useReadingPlan()` hook provides:

```typescript
// Get all plans for logged-in user
userPlans: UserReadingPlan[]

// Get the active (incomplete) plan
activePlan: UserReadingPlan | null

// Start a new plan
startPlan(planId: string): Promise<void>

// Mark a day as completed
markDayComplete(planId: string, day: number): Promise<void>

// Delete a plan
deletePlan(planId: string): Promise<void>

// Reload plans from storage
reloadPlans(): Promise<void>

// Get plan template details
getPlanDetails(planId: string): ReadingPlan | undefined

// Get today's reading
getTodayReading(): ReadingPlan['readings'] | null
```

## Usage Examples

### In a Component:
```typescript
import { useReadingPlan } from '@/lib/readingPlanContext';

function MyComponent() {
  const { activePlan, markDayComplete, userPlans } = useReadingPlan();

  const handleMarkComplete = async () => {
    if (activePlan) {
      await markDayComplete(activePlan.id, activePlan.currentDay + 1);
    }
  };

  return (
    <View>
      <Text>Plan: {activePlan?.planId}</Text>
      <Text>Day: {activePlan?.currentDay} / {activePlan?.currentDay}</Text>
      <Button onPress={handleMarkComplete} title="Mark Day Complete" />
    </View>
  );
}
```

### Integrating with Reader Screen:
```typescript
import { useReadingPlan } from '@/lib/readingPlanContext';

function ReaderScreen({ bookId, chapter }: Props) {
  const { activePlan, markDayComplete } = useReadingPlan();

  const handleChapterComplete = async () => {
    if (activePlan) {
      // Find matching day in plan
      const planDetails = readingPlans.find(p => p.id === activePlan.planId);
      const matchingDay = planDetails?.readings.find(
        r => r.book_id === bookId && r.chapter === chapter
      );
      
      if (matchingDay) {
        await markDayComplete(activePlan.id, matchingDay.day);
      }
    }
  };

  return (
    <View>
      <BibleContent />
      <Button onPress={handleChapterComplete} title="Mark as Read" />
    </View>
  );
}
```

## Auto-Save Features

### Automatic Login:
- When app starts, AuthProvider checks for saved session
- If user was logged in, session is automatically restored
- ReadingPlanContext auto-loads that user's plans

### Progress Persistence:
- Every `markDayComplete` call saves to device storage
- Progress survives app crashes and restarts
- Survives phone reboots

### Multi-Device Support (Future):
Currently all data is device-local. To enable cloud sync:
1. Add Supabase tables for `reading_plans` and `plan_progress`
2. Sync on login/logout
3. Merge conflicts if user starts plan on different device

## Testing the System

### Test Case 1: Start Reading Plan
```
1. Login with test account
2. Navigate to Plans tab
3. Click "Start Reading" on a plan
4. Verify plan appears in "Your Active Plan"
5. Force close app
6. Reopen app - plan should still be active
```

### Test Case 2: Track Progress
```
1. Have active plan
2. Mark a day complete
3. Verify progress bar updates
4. Force close app
5. Reopen - progress should be saved
```

### Test Case 3: Multi-User
```
1. Login with User A
2. Start a plan
3. Logout
4. Login with User B
5. Verify User A's plans don't appear
6. Start different plan
7. Logout, login User A
8. Verify User A's original plan is still there
```

## Current Limitations

- ✅ Automatic user-specific tracking
- ✅ Persistent storage on device
- ✅ Day-by-day progress marking
- ✅ Plan start/delete functionality
- ✅ Auto-load on login

Planned:
- ⏳ Cloud sync (Supabase)
- ⏳ Multi-device sync
- ⏳ Reading notifications
- ⏳ Weekly progress reports
- ⏳ Achievement badges

## Technical Details

### Storage Keys:
```
reading_plans_user@example.com
reading_plans_john.doe@gmail.com
reading_plans_admin@bible.ai
```

### Data Flow:
```
User Logs In
    ↓
AuthContext saves session
    ↓
ReadingPlanContext loads plans for user email
    ↓
activePlan is set
    ↓
Plans tab displays progress
    ↓
User marks day complete
    ↓
markDayComplete updates storage
    ↓
Progress bar updates
    ↓
New session restored on restart
```

### Component Hierarchy:
```
RootLayout (_layout.tsx)
├── AuthProvider
├── ReadingPlanProvider
└── Stack (tabs, login, admin)
    └── useReadingPlan() - usable in any child
```

## Troubleshooting

### Plans not saving?
- Check user is logged in (`useAuth()` returns user email)
- Verify AsyncStorage is working
- Check device storage permissions

### Progress not updating?
- Ensure `markDayComplete` is called with correct plan ID
- Verify plan matches plan template ID
- Check day number is within plan duration

### Plans disappear after logout?
- This is intentional - each user has separate storage
- Login with same account to restore
- Plans are device-local, not cloud-synced yet

## Future Enhancements

1. **Cloud Sync**: Save to Supabase when online
2. **Offline-First**: Sync on next login if offline
3. **Smart Notifications**: Remind users to complete daily reading
4. **Stats Dashboard**: Show reading trends over time
5. **Community Leaderboards**: Compare progress with friends
6. **AI Recommendations**: Suggest plans based on preferences
