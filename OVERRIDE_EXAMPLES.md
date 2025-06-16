# Schedule Override System - Working Examples

## Backend Implementation Status ✅

The system is now properly integrated with your frontend architecture:

### **Backend Changes Made:**
1. ✅ **SchedulesService** - Enhanced to apply overrides when `date` parameter is provided
2. ✅ **ChannelsService** - Modified to pass `date` parameter to SchedulesService
3. ✅ **ChannelsController** - Added `date` parameter to `/channels/with-schedules` endpoint
4. ✅ **Override Management** - Full CRUD for schedule overrides
5. ✅ **Validation** - Date must match schedule's day of week

## Frontend Integration Examples

### **Current Frontend Calls (still work normally):**
```typescript
// Today's schedules (no overrides applied)
GET /channels/with-schedules?day=monday&live_status=true

// Week schedules (no overrides applied)  
GET /channels/with-schedules?live_status=true
```

### **New Frontend Calls (with override support):**
```typescript
// Monday schedules for specific date (overrides applied!)
GET /channels/with-schedules?day=monday&date=2024-01-15&live_status=true

// All schedules for specific date (overrides applied!)
GET /channels/with-schedules?date=2024-01-15&live_status=true
```

## Complete Example Scenario

### **Setup:**
- **Program**: "Morning Show" on Vortex channel
- **Base Schedule**: Friday 4:00-6:00 PM (schedule ID: 103)
- **Override Goal**: Change Friday 2024-01-19 to 3:00-5:00 PM

### **Step 1: Create Override (Backend Admin)**
```bash
POST /schedule-overrides
{
  "originalScheduleId": "103",
  "overrideDate": "2024-01-19",     # Must be a Friday!
  "overrideType": "time_change",
  "newStartTime": "15:00",
  "newEndTime": "17:00",
  "reason": "Special event accommodation"
}
```

### **Step 2: Frontend Fetches Friday Schedule**
```typescript
// Without override (normal schedule)
const normalSchedule = await fetch('/api/channels/with-schedules?day=friday');

// With override (modified schedule)  
const overrideSchedule = await fetch('/api/channels/with-schedules?day=friday&date=2024-01-19');
```

### **Step 3: Results Comparison**

**Normal Friday Schedule:**
```json
{
  "channel": { "id": 1, "name": "Vortex" },
  "schedules": [{
    "id": 103,
    "day_of_week": "friday",
    "start_time": "16:00",    // 4 PM
    "end_time": "18:00",      // 6 PM
    "program": { "name": "Morning Show" }
  }]
}
```

**Friday with Override:**
```json
{
  "channel": { "id": 1, "name": "Vortex" },
  "schedules": [{
    "id": 103,
    "day_of_week": "friday", 
    "start_time": "15:00",    // 3 PM (changed!)
    "end_time": "17:00",      // 5 PM (changed!)
    "program": { "name": "Morning Show" }
  }]
}
```

## Frontend Implementation Suggestions

### **Option 1: Add Date Picker to Existing Grid**
```typescript
// In HomeClient.tsx or similar
const [selectedDate, setSelectedDate] = useState<string>('');

const fetchSchedules = useCallback(async () => {
  const params: any = { live_status: true };
  if (deviceId) params.deviceId = deviceId;
  if (selectedDate) params.date = selectedDate;
  
  const resp = await api.get('/channels/with-schedules', { params });
  setChannelsWithSchedules(resp.data);
}, [deviceId, selectedDate]);

// Add date picker component
<DatePicker 
  value={selectedDate}
  onChange={setSelectedDate}
  label="View schedules for specific date"
/>
```

### **Option 2: Admin Interface for Override Management**
```typescript
const OverrideManager = () => {
  const [overrides, setOverrides] = useState([]);
  
  const createOverride = async (data) => {
    await api.post('/schedule-overrides', data);
    // Refresh overrides list
    loadOverrides();
  };

  const loadOverrides = async () => {
    const resp = await api.get('/schedule-overrides');
    setOverrides(resp.data);
  };

  return (
    <div>
      <OverrideForm onSubmit={createOverride} />
      <OverridesList overrides={overrides} />
    </div>
  );
};
```

## How Different Override Types Work

### **1. CANCEL Override**
```bash
POST /schedule-overrides
{
  "originalScheduleId": "103",
  "overrideDate": "2024-01-19", 
  "overrideType": "cancel",
  "reason": "Host is sick"
}
```
**Result**: Program doesn't appear in Friday schedule for 2024-01-19

### **2. TIME_CHANGE Override**  
```bash
POST /schedule-overrides
{
  "originalScheduleId": "103",
  "overrideDate": "2024-01-19",
  "overrideType": "time_change", 
  "newStartTime": "15:00",
  "newEndTime": "17:00",
  "reason": "Special event"
}
```
**Result**: Program shows 3-5 PM instead of 4-6 PM on 2024-01-19

### **3. RESCHEDULE Override**
```bash
POST /schedule-overrides  
{
  "originalScheduleId": "103",
  "overrideDate": "2024-01-19",
  "overrideType": "reschedule",
  "newDayOfWeek": "saturday", 
  "newStartTime": "14:00",
  "newEndTime": "16:00",
  "reason": "Holiday adjustment"
}
```
**Result**: 
- Program disappears from Friday 2024-01-19
- Program appears on Saturday 2024-01-20 at 2-4 PM

## Validation and Error Handling

### **Date Validation Example**
```bash
# ❌ This will fail
POST /schedule-overrides
{
  "originalScheduleId": "103",  # Friday schedule
  "overrideDate": "2024-01-21", # This is a Sunday!
  "overrideType": "cancel"
}

# Response:
{
  "error": "Override date 2024-01-21 is a sunday, but the original schedule is for friday. Please use a date that falls on a friday."
}
```

### **Get Valid Dates Helper**
```bash
# Get valid override dates for a schedule
GET /schedule-overrides/possible-dates/103?startDate=2024-01-01&endDate=2024-02-01

# Response:
{
  "scheduleId": 103,
  "dayOfWeek": "friday",
  "possibleDates": [
    "2024-01-05", "2024-01-12", "2024-01-19", "2024-01-26"
  ]
}
```

## Key Benefits for Your Frontend

### **✅ Backward Compatibility**
- All existing frontend code continues to work unchanged
- No overrides applied unless `date` parameter is passed

### **✅ Gradual Implementation**  
- Can add date picker to one component at a time
- Can implement admin interface separately
- Can test with specific dates before rolling out

### **✅ Performance Optimized**
- Caching strategy handles both normal and override scenarios
- Minimal impact on existing API calls
- Efficient database queries with proper indexing

### **✅ User Experience**
- Users see normal schedules by default
- Admins can create overrides for specific dates
- Changes are immediately visible when date is specified

This system gives you the flexibility to handle real-world scheduling changes while maintaining your existing frontend architecture! 