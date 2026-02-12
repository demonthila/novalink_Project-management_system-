# Payment Tracking & Reminders - Implementation Guide

## Overview
This implementation adds comprehensive payment tracking and automated email reminders to the Stratis IT Management Suite.

---

## 1. Database Schema Updates

### Run the following SQL in phpMyAdmin on Hostinger:

```sql
-- Add paid_date column to milestones table
ALTER TABLE `milestones` 
ADD COLUMN `paid_date` DATE DEFAULT NULL AFTER `is_paid`;

-- Create system_settings table (if not exists)
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL UNIQUE,
  `setting_value` text,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Insert default currency
INSERT INTO `system_settings` (`setting_key`, `setting_value`) 
VALUES ('currency', 'AUD') 
ON DUPLICATE KEY UPDATE setting_value = 'AUD';
```

**Or** import the file: `php_backend/payment_tracking_schema.sql`

---

## 2. Backend Files Created

### a) `api/updatePayment.php`
- **Purpose**: Update payment status when admin marks a milestone as paid
- **Method**: POST
- **Parameters**: 
  - `milestoneId` (required)
  - `isPaid` (boolean)
  - `paidDate` (date string, auto-set to today if marking as paid)

### b) `api/sendPaymentReminder.php`
- **Purpose**: Automated cron job to send payment reminders
- **Security**: Protected by `CRON_SECRET` key
- **Logic**:
  - Finds all unpaid milestones due within 3 days OR overdue
  - Sends email to `novalinkhelp@gmail.com`
  - Only processes projects with status: Approved or Ongoing
  - Email includes: Project name, milestone label, amount, due date, client info

---

## 3. Frontend Component

### `components/PaymentTracker.tsx`
- **Features**:
  - Visual payment schedule with color-coded status badges
  - Status indicators:
    - ✓ **Paid** (Green) - Payment received
    - ⚠ **Due Soon** (Amber) - Due within 3 days
    - ! **Overdue** (Red) - Past due date
    - ○ **Pending** (Gray) - Not yet due
  - One-click "Mark as Paid" button
  - Shows payment received date when paid
  - Displays automated reminder notice

### Integration Example:
```tsx
import PaymentTracker from './components/PaymentTracker';

// In your Project Details view:
<PaymentTracker
  projectId={project.id}
  projectName={project.name}
  milestones={project.milestones}
  currency={project.currency}
  onPaymentUpdate={(milestoneId, isPaid, paidDate) => {
    // Update local state
    setProject(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, isPaid, paidDate } 
          : m
      )
    }));
  }}
/>
```

---

## 4. Cron Job Setup (Hostinger)

### Step-by-Step:

1. **Login to Hostinger Control Panel**
2. **Navigate to**: Advanced → Cron Jobs
3. **Add New Cron Job**:
   - **Type**: Custom
   - **Schedule**: Daily at 9:00 AM
     - Minute: `0`
     - Hour: `9`
     - Day: `*`
     - Month: `*`
     - Weekday: `*`
   - **Command**:
     ```bash
     /usr/bin/php /home/u123456789/public_html/api/sendPaymentReminder.php?key=stratis_secure_cron_token_123
     ```
     *(Replace `/home/u123456789/` with your actual Hostinger path)*
     *(Replace the key with your actual CRON_SECRET from secrets.php)*

4. **Save Cron Job**

### Testing the Cron Manually:
```bash
curl "https://yourdomain.com/api/sendPaymentReminder.php?key=stratis_secure_cron_token_123"
```

---

## 5. Email Configuration

### PHP mail() function requirements:
- Hostinger supports PHP `mail()` by default
- Emails will be sent from: `noreply@stratis.com` (or your domain)
- Recipient: `novalinkhelp@gmail.com`

### Email Content Includes:
- Project name
- Milestone/Payment number
- Amount (with currency)
- Due date
- Client name and email
- Professional HTML formatting

### If emails don't send:
1. Check Hostinger email settings
2. Verify SPF/DKIM records for your domain
3. Consider using SMTP instead of mail() (PHPMailer library)

---

## 6. Security Considerations

✅ **Implemented**:
- CRON_SECRET key protection for reminder endpoint
- PDO prepared statements prevent SQL injection
- Payment updates require valid milestone ID
- No sensitive data exposed to frontend
- CORS headers configured in config.php

⚠️ **Production Recommendations**:
1. Store `CRON_SECRET` in `secrets.php` outside public_html
2. Use HTTPS for all API calls
3. Implement session-based authentication for updatePayment.php
4. Rate-limit payment update requests
5. Log all payment status changes for audit trail

---

## 7. Testing Checklist

- [ ] Run SQL schema update in phpMyAdmin
- [ ] Create a test project with 3 milestones
- [ ] Set due dates: one overdue, one in 2 days, one in future
- [ ] Mark first payment as paid via PaymentTracker component
- [ ] Verify `paid_date` is saved in database
- [ ] Test cron job manually via curl
- [ ] Check `novalinkhelp@gmail.com` for reminder emails
- [ ] Verify only unpaid milestones trigger reminders
- [ ] Test "Mark Unpaid" functionality

---

## 8. Dashboard Integration

To show payment status on the main dashboard, add this to `Dashboard.tsx`:

```tsx
// Calculate payment statistics
const paymentStats = useMemo(() => {
  let totalDue = 0;
  let totalReceived = 0;
  let overdueCount = 0;

  projects.forEach(p => {
    p.milestones?.forEach(m => {
      if (m.isPaid) {
        totalReceived += m.amount;
      } else {
        totalDue += m.amount;
        if (new Date(m.dueDate) < new Date()) {
          overdueCount++;
        }
      }
    });
  });

  return { totalDue, totalReceived, overdueCount };
}, [projects]);

// Add KPI Card:
<KPICard
  label="Payments Received"
  value={formatCurrency(paymentStats.totalReceived, currency)}
  growth={`${paymentStats.overdueCount} Overdue`}
  growthColor={paymentStats.overdueCount > 0 ? "text-rose-500" : "text-emerald-500"}
/>
```

---

## 9. Troubleshooting

### Issue: Emails not sending
**Solution**: 
- Check Hostinger email logs
- Verify `mail()` function is enabled
- Test with a simple PHP mail script
- Consider using PHPMailer with SMTP

### Issue: Cron job not running
**Solution**:
- Verify correct PHP path: `which php` in SSH
- Check cron job logs in Hostinger panel
- Ensure CRON_SECRET matches in URL and config

### Issue: Payment status not updating
**Solution**:
- Check browser console for errors
- Verify `updatePayment.php` is accessible
- Ensure `paid_date` column exists in database
- Check PDO error messages

---

## 10. Future Enhancements

- [ ] Send reminders to clients directly (not just admin)
- [ ] SMS reminders via Twilio
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Partial payment tracking
- [ ] Payment receipt generation (PDF)
- [ ] Payment history timeline
- [ ] Customizable reminder schedules per project
- [ ] Multi-currency conversion for reports

---

## Support

For issues or questions:
- Email: novalinkhelp@gmail.com
- Check Hostinger documentation for cron/email setup
- Review PHP error logs: `/home/u123456789/public_html/error_log`

---

**Implementation Complete! 🎉**

All components are ready for deployment. Follow the steps above to activate payment tracking and automated reminders.
