# Email Notification System - Setup Guide

## Overview
Professional email notification system for assistant invites using Resend API.

## Prerequisites
- Resend account (https://resend.com)
- Verified domain (khaoskontrol.com.br)
- Supabase CLI installed

## Setup Steps

### 1. Resend Configuration

1. Create account at https://resend.com
2. Verify domain `khaoskontrol.com.br`:
   - Add DNS records provided by Resend
   - Wait for verification (usually < 24h)
3. Generate API key in Resend dashboard
4. Add to `.env`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### 2. Database Migration

Run the notification_logs migration:
```bash
# Apply migration
supabase db push

# Or manually:
psql $DATABASE_URL < supabase/migrations/20260209150000_notification_logs.sql
```

### 3. Deploy Edge Function

```bash
# Deploy function
supabase functions deploy send-invite-email

# Set secrets
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 4. Test Email Sending

```bash
# Test locally
supabase functions serve send-invite-email

# Send test request
curl -X POST http://localhost:54321/functions/v1/send-invite-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "to": "test@example.com",
    "makeup_artist_name": "Test Artist",
    "invite_link": "https://khaoskontrol.com.br/assistant/accept/test-token",
    "invite_id": "00000000-0000-0000-0000-000000000000"
  }'
```

## Email Template

The email template follows the Industrial Noir aesthetic:
- Black background (#0a0a0a)
- White text with subtle grays
- Professional typography
- Responsive design
- Clear CTA button

## Monitoring

### Check Notification Logs
```sql
SELECT 
  nl.*,
  ai.assistant_email,
  ai.created_at as invite_created
FROM notification_logs nl
JOIN assistant_invites ai ON ai.id = nl.invite_id
ORDER BY nl.sent_at DESC
LIMIT 50;
```

### Check Failed Emails
```sql
SELECT * FROM notification_logs 
WHERE status = 'failed' 
ORDER BY sent_at DESC;
```

## Troubleshooting

### Email not sending
1. Check Resend API key is set correctly
2. Verify domain is verified in Resend
3. Check Edge Function logs: `supabase functions logs send-invite-email`
4. Verify notification_logs table exists

### Email goes to spam
1. Ensure domain has SPF/DKIM records
2. Use verified "from" address
3. Avoid spam trigger words
4. Test with mail-tester.com

## Rate Limits

- Resend Free: 100 emails/day
- Resend Pro: 50,000 emails/month
- Consider implementing rate limiting per makeup artist

## Next Steps

- [ ] Add WhatsApp notifications (optional)
- [ ] Implement email templates for other events
- [ ] Add email open tracking
- [ ] Create admin dashboard for notification stats
