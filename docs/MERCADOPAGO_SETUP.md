# Mercado Pago Integration - Setup Guide

## Overview
Complete payment integration for assistant upgrades using Mercado Pago.

## Prerequisites
- Mercado Pago account (https://www.mercadopago.com.br)
- Supabase CLI installed
- Database migrations applied

## Setup Steps

### 1. Mercado Pago Configuration

1. Create account at https://www.mercadopago.com.br
2. Access Developer Dashboard
3. Get credentials:
   - **Test credentials** (for development)
   - **Production credentials** (for live)
4. Add to `.env`:
   ```env
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx
   MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxx
   ```

### 2. Database Migration

Apply subscriptions and payments schema:
```bash
# Apply migration
supabase db push

# Or manually:
psql $DATABASE_URL < supabase/migrations/20260209151000_subscriptions_payments.sql
```

### 3. Deploy Edge Functions

```bash
# Deploy checkout function
supabase functions deploy create-checkout

# Deploy webhook function
supabase functions deploy mp-webhook

# Set secrets
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx
```

### 4. Configure Webhook in Mercado Pago

1. Go to Mercado Pago Developer Dashboard
2. Navigate to "Webhooks"
3. Add new webhook:
   - **URL**: `https://YOUR_PROJECT.supabase.co/functions/v1/mp-webhook`
   - **Events**: `payment`
4. Save and test

### 5. Test Checkout Flow

#### Using Test Mode
1. Navigate to `/upgrade`
2. Click "Assinar Agora"
3. Use Mercado Pago test cards:
   - **Approved**: `5031 4332 1540 6351` (CVV: 123, Exp: any future date)
   - **Rejected**: `5031 4332 1540 6353`
4. Complete checkout
5. Verify webhook processing in logs

```bash
# Check webhook logs
supabase functions logs mp-webhook

# Check database
psql $DATABASE_URL -c "SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;"
psql $DATABASE_URL -c "SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;"
```

## Payment Flow

### 1. User Clicks "Assinar"
- Frontend calls `create-checkout` Edge Function
- Function creates Mercado Pago preference
- Returns checkout URL

### 2. User Completes Payment
- Redirected to Mercado Pago
- Completes payment (PIX, card, boleto)
- Redirected back to success/failure/pending page

### 3. Webhook Processes Payment
- Mercado Pago sends webhook to `mp-webhook`
- Function verifies payment status
- If approved:
  - Creates/updates subscription
  - Records payment
  - Upgrades assistant to full user
  - Creates makeup_artist profile

## Monitoring

### Check Active Subscriptions
```sql
SELECT 
  s.*,
  u.email,
  u.user_metadata->>'full_name' as name
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;
```

### Check Recent Payments
```sql
SELECT 
  p.*,
  s.plan_type,
  u.email
FROM payments p
LEFT JOIN subscriptions s ON s.id = p.subscription_id
JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 20;
```

### Check Failed Payments
```sql
SELECT * FROM payments 
WHERE status IN ('rejected', 'failed') 
ORDER BY created_at DESC;
```

## Troubleshooting

### Payment not processing
1. Check webhook logs: `supabase functions logs mp-webhook`
2. Verify webhook URL is configured in MP dashboard
3. Check MP access token is correct
4. Verify database has subscriptions/payments tables

### Webhook not receiving events
1. Test webhook manually:
   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/mp-webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"payment","data":{"id":"12345"}}'
   ```
2. Check MP webhook configuration
3. Verify URL is publicly accessible

### User not upgraded after payment
1. Check webhook logs for errors
2. Verify payment status in MP dashboard
3. Check subscriptions table for user
4. Manually upgrade if needed:
   ```sql
   UPDATE assistants 
   SET is_upgraded = true, upgraded_at = now() 
   WHERE user_id = 'USER_ID';
   ```

## Security

- Never expose `MERCADOPAGO_ACCESS_TOKEN` in frontend
- Always validate webhook signatures (TODO: implement)
- Use HTTPS for all webhook URLs
- Implement rate limiting on checkout creation

## Next Steps

- [ ] Implement webhook signature validation
- [ ] Add subscription renewal logic
- [ ] Create admin dashboard for subscription management
- [ ] Implement refund handling
- [ ] Add email notifications for payment events
