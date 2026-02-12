# Payment Tracking Troubleshooting Guide

## 🚨 STEP-BY-STEP FIX

### **Step 1: Run This SQL (REQUIRED)**
Open phpMyAdmin and run this exact SQL:

```sql
ALTER TABLE `milestones` 
ADD COLUMN `paid_date` DATE DEFAULT NULL AFTER `is_paid`;
```

**How to verify it worked:**
```sql
DESCRIBE milestones;
```
You should see these columns:
- id
- project_id  
- label
- amount
- is_paid
- **paid_date** ← This must exist!
- due_date

---

### **Step 2: Create a BRAND NEW Project**

**IMPORTANT:** Old projects created before the updates won't work properly.

1. Go to Projects tab
2. Click "Create Project"
3. Fill in:
   - Project Name: "Test Payment Tracking"
   - Client: Any client
   - Total Project Cost: 10000
   - Payment Structure: "Default (40% / 30% / 30%)"
4. Click "Commit Deployment"

This will create milestones with:
- ✅ Unique IDs
- ✅ Due dates (7, 30, 60 days from today)
- ✅ Proper structure

---

### **Step 3: View the Project**

1. Find your new "Test Payment Tracking" project in the list
2. Click the **eye icon** (View Details)
3. A modal opens
4. **Scroll down** to see "Payment Schedule & Reminders"

---

### **Step 4: Test Each Feature**

#### **A. Edit Due Date (Each payment separately)**
1. Find "Payment 1: Upfront Payment (40%)"
2. Click the blue **"EDIT"** button next to the due date
3. A date picker appears
4. Select a new date (e.g., tomorrow)
5. Click "✓ Save Date"
6. Page refreshes
7. Open project again - date should be updated

#### **B. Mark Payment as Received (Checkbox)**
1. Find "Payment 1: Upfront Payment (40%)"
2. Click the **checkbox** on the left
3. It should turn green with a checkmark
4. You'll see "Payment received on [today's date]"
5. The "Received (Revenue)" box updates

#### **C. Test Different Dates for Each Payment**
1. Payment 1: Set due date to Feb 15, 2026
2. Payment 2: Set due date to Mar 20, 2026
3. Payment 3: Set due date to Apr 25, 2026
4. Each payment has its own independent date!

---

## ❌ Common Issues & Fixes

### Issue 1: "Checkboxes don't respond when clicked"
**Cause:** Database missing `paid_date` column
**Fix:** Run the SQL from Step 1

### Issue 2: "Can't see Payment Schedule section"
**Cause:** Viewing an old project OR not scrolling down
**Fix:** 
- Create a NEW project (Step 2)
- Scroll down in the modal

### Issue 3: "Edit button doesn't work"
**Cause:** Milestones don't have IDs
**Fix:** Create a NEW project with the updated code

### Issue 4: "Page doesn't refresh after editing date"
**Cause:** API endpoint not accessible
**Fix:** Check browser console (F12) for errors

### Issue 5: "All payments show same date"
**Cause:** Looking at old project
**Fix:** Create NEW project - each will have different default dates

---

## 🧪 Testing Checklist

Create a new project and verify:

- [ ] Project creates successfully
- [ ] Can view project details
- [ ] See 3 payments with different due dates
- [ ] Click EDIT on Payment 1 - date picker appears
- [ ] Change date and save - page refreshes
- [ ] Reopen project - new date is saved
- [ ] Click EDIT on Payment 2 - different date picker
- [ ] Change Payment 2 to different date than Payment 1
- [ ] Click checkbox on Payment 1 - turns green
- [ ] See "Payment received on [date]"
- [ ] "Received (Revenue)" shows Payment 1 amount
- [ ] Click checkbox on Payment 2 - turns green independently
- [ ] "Received (Revenue)" now shows Payment 1 + Payment 2
- [ ] Payment 3 still unchecked and has its own due date

---

## 📊 Expected Behavior

### **Example: $10,000 Project (40-30-30)**

**Initial State:**
```
Payment 1: $4,000 | Due: Feb 19, 2026 | ☐ Unpaid
Payment 2: $3,000 | Due: Mar 14, 2026 | ☐ Unpaid  
Payment 3: $3,000 | Due: Apr 13, 2026 | ☐ Unpaid

Received: $0
Pending: $10,000
```

**After receiving Payment 1:**
```
Payment 1: $4,000 | Due: Feb 19, 2026 | ☑ Paid (Feb 12, 2026)
Payment 2: $3,000 | Due: Mar 14, 2026 | ☐ Unpaid
Payment 3: $3,000 | Due: Apr 13, 2026 | ☐ Unpaid

Received: $4,000 (40%)
Pending: $6,000
```

**After changing Payment 2 due date:**
```
Payment 1: $4,000 | Due: Feb 19, 2026 | ☑ Paid (Feb 12, 2026)
Payment 2: $3,000 | Due: Apr 1, 2026 ← CHANGED | ☐ Unpaid
Payment 3: $3,000 | Due: Apr 13, 2026 | ☐ Unpaid

Received: $4,000 (40%)
Pending: $6,000
```

---

## 🔍 Debug Mode

### Check Browser Console
1. Press **F12**
2. Go to **Console** tab
3. Look for errors when:
   - Clicking checkbox
   - Clicking EDIT button
   - Saving date

### Check Network Tab
1. Press **F12**
2. Go to **Network** tab
3. Click a checkbox
4. Look for request to `/api/updatePayment.php`
5. Check if it returns `{"success": true}`

### Check Database
```sql
-- See all milestones with their dates
SELECT 
    m.id,
    p.name as project_name,
    m.label,
    m.amount,
    m.is_paid,
    m.paid_date,
    m.due_date
FROM milestones m
JOIN projects p ON m.project_id = p.id
ORDER BY p.id, m.id;
```

---

## 📧 Email Reminders

Each payment's reminder is sent based on ITS OWN due date:

```
Payment 1 due Feb 19:
  - Reminder sent Feb 16 (3 days before)
  - Reminder sent Feb 19 (on due date)

Payment 2 due Apr 1:
  - Reminder sent Mar 29 (3 days before)
  - Reminder sent Apr 1 (on due date)

Payment 3 due Apr 13:
  - Reminder sent Apr 10 (3 days before)
  - Reminder sent Apr 13 (on due date)
```

---

## ✅ Success Criteria

You know it's working when:
1. ✅ Each payment has a different due date
2. ✅ You can edit each due date independently
3. ✅ Checkboxes respond immediately
4. ✅ Revenue updates when you check boxes
5. ✅ Each payment shows "Paid" or "Pending" independently

---

**Still not working?** 
1. Check you ran the SQL
2. Create a BRAND NEW project
3. Check browser console for errors
4. Verify `paid_date` column exists in database
