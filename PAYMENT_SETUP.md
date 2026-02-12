# Payment Tracking Setup Instructions

## ⚠️ IMPORTANT: Database Update Required

Before the payment checkboxes will work, you MUST run this SQL in your database:

### Step 1: Add the `paid_date` column to milestones table

```sql
ALTER TABLE `milestones` 
ADD COLUMN `paid_date` DATE DEFAULT NULL AFTER `is_paid`;
```

### Step 2: Ensure milestones have proper IDs

The milestones table should already have an `id` column (auto-increment primary key). If not, it was created in the original schema.

---

## How to Use Payment Tracking

### 1. **Create a New Project**
   - Go to Projects → Create Project
   - Fill in project details
   - Milestones will be automatically created with:
     - Unique IDs
     - Default due dates (7, 30, 60 days from now)
     - Payment amounts based on project type

### 2. **View Payment Schedule**
   - Click on any project in the list
   - Click the "View Details" (eye icon)
   - Scroll down to see **"Payment Schedule & Reminders"**

### 3. **Mark Payments as Received**
   - ✅ **Check the checkbox** next to each payment when you receive it
   - The system will:
     - Save the payment as "Paid"
     - Record today's date as the payment received date
     - Update profit calculations automatically
     - Stop sending reminders for that payment

### 4. **Set Custom Payment Due Dates**
   - Click the **✏️ pencil icon** next to "Payment Due Date"
   - Select a new date from the date picker
   - Click **Save**
   - Email reminders will be sent based on this date

### 5. **View Profit Calculations**
   - The payment tracker shows:
     - **Received (Revenue)**: Total of checked payments
     - **Pending**: Total of unchecked payments
     - **Total Expected**: Full project value
     - **Collection %**: Percentage of revenue collected

---

## Troubleshooting

### ❌ Checkboxes don't work / No response when clicking
**Solution**: Run the SQL command above to add the `paid_date` column

### ❌ Can't see Payment Schedule
**Solution**: 
1. Make sure you're viewing a project (not just the project list)
2. Scroll down in the project details modal
3. The Payment Schedule appears below the project overview

### ❌ Milestones don't have due dates
**Solution**: 
- Old projects created before this update won't have due dates
- Create a NEW project to test the feature
- Or manually update due dates in the database

---

## Email Reminder Schedule

Automated emails will be sent to **novalinkhelp@gmail.com** for:
- ⏰ **3 days before** each payment due date
- 📅 **On the due date** if still unpaid
- 🔴 **Daily** for overdue payments

To activate email reminders, set up the cron job as described in `PAYMENT_TRACKING_GUIDE.md`

---

## Next Steps

1. ✅ Run the SQL command above
2. ✅ Create a test project
3. ✅ View the project details
4. ✅ Test checking/unchecking payment boxes
5. ✅ Test editing due dates
6. ✅ Verify profit calculations update

---

**Need Help?** Check the browser console (F12) for any error messages.
