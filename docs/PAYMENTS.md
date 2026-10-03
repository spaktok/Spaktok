# Payment System Documentation

## Overview

Spaktok's payment system provides comprehensive monetization through multiple payment providers (Stripe, PayPal), integrated wallet, subscription management, and secure transaction handling.

## Supported Payment Methods

### Primary Providers
- **Stripe**: Credit/Debit cards, Apple Pay, Google Pay
- **PayPal**: Wallet, Card, Bank Account
- **In-App Wallet**: Recharge via Stripe/PayPal, spend directly

### Payment Types
- Gift purchases (single transaction)
- Subscriptions (recurring)
- Credit recharge
- Direct wallet transfers
- Creator payouts

## Core Features

### Wallet System
- Instant balance updates
- Transaction history
- Wallet recharge options
- Bonus credit campaigns
- Currency support (USD, EUR, GBP, PKR, etc.)

### Gift Economy
- 200+ collectible gifts with multiple rarity tiers
- Gift animations and display effects
- Gift message attachment
- Sender analytics
- Creator earnings from gifts

### Subscriptions
Three-tier subscription model:

**Premium Tier**
- Price: $4.99/month
- HD video uploads (1080p)
- 100GB storage
- 50 video uploads/month
- 10 live stream hours/month
- Custom filters creation

**Pro Tier**
- Price: $9.99/month
- 4K video uploads
- 500GB storage
- Unlimited uploads
- 100 live stream hours/month
- Advanced analytics

**Elite Tier**
- Price: $19.99/month
- 4K+ video uploads
- 2TB storage
- Priority support
- Unlimited live streaming
- Exclusive features

### Creator Payout System
- Automatic weekly payouts
- Multiple withdrawal methods:
  - Bank transfer
  - PayPal
  - Stripe payout
- Tax document support (1099 for US creators)
- Earnings tracking dashboard
- Revenue breakdown by source

## API Endpoints

### Wallet
```
GET /api/payments/wallet - Get wallet balance
GET /api/payments/wallet/transactions - Get transaction history
POST /api/payments/wallet/recharge - Recharge wallet
```

### Payment Methods
```
GET /api/payments/methods - List payment methods
POST /api/payments/methods - Add payment method
PUT /api/payments/methods/:id - Update payment method
DELETE /api/payments/methods/:id - Remove payment method
POST /api/payments/methods/:id/set-default - Set default method
```

### Transactions
```
POST /api/payments - Create payment
POST /api/payments/process - Process payment
GET /api/payments/:id - Get payment details
GET /api/payments/history - Get payment history
```

### Gifts
```
GET /api/payments/gifts - List available gifts
POST /api/payments/gifts/send - Send gift
GET /api/payments/gifts/history - Get gift sent history
GET /api/payments/gifts/received - Get gifts received
```

### Subscriptions
```
GET /api/payments/subscriptions/plans - Get subscription plans
POST /api/payments/subscriptions - Subscribe to plan
GET /api/payments/subscriptions/current - Get current subscription
POST /api/payments/subscriptions/cancel - Cancel subscription
PUT /api/payments/subscriptions - Upgrade/downgrade subscription
```

### Payouts
```
POST /api/payments/payouts/request - Request payout
GET /api/payments/payouts - Get payout history
GET /api/payments/payouts/stats - Get payout statistics
```

## Security Implementation

### Payment Data Protection
- PCI DSS compliant architecture
- No sensitive data stored locally
- Tokenization for payment methods
- 3D Secure support
- Encryption for all transactions

### Fraud Prevention
- Rate limiting on payment requests
- Anomaly detection
- Velocity checks
- IP whitelisting options
- Manual review thresholds

### User Authentication
- Two-factor authentication for large transactions
- Email confirmation for payment method changes
- Transaction verification

## Integration Examples

### Send a Gift

```typescript
import { paymentService } from '@/services/payment';

const sendGift = async (giftId: string, recipientId: string) => {
  try {
    const gift = await paymentService.sendGift(
      giftId,
      recipientId,
      1, // quantity
      'Nice stream!', // message
      streamId, // optional context
    );
    console.log('Gift sent successfully:', gift);
  } catch (error) {
    console.error('Failed to send gift:', error);
  }
};
```

### Manage Subscription

```typescript
// Get available plans
const plans = await paymentService.getSubscriptionPlans();

// Subscribe to Premium
const subscription = await paymentService.subscribeToplan(
  premiumPlanId,
  paymentMethodId
);

// Upgrade to Pro
const updated = await paymentService.updateSubscription(proPlanId);

// Cancel subscription
const cancelled = await paymentService.cancelSubscription('Too expensive');
```

### Wallet Recharge

```typescript
const recharged = await paymentService.rechargeWallet(
  50, // amount in USD
  paymentMethodId
);

// Now user can send gifts directly from wallet
```

### Request Payout

```typescript
const payout = await paymentService.requestPayout(
  1000, // amount
  'bank_transfer',
  {
    accountNumber: '1234567890',
    routingNumber: '021000021',
    accountHolder: 'John Doe',
  }
);
```

## Pricing & Revenue Sharing

### Gift System
- 100% to creator after platform fees
- Platform takes 30% commission
- Creator gets 70% of gift value

### Subscriptions
- 30% to creators
- 70% retained for platform

### Gift Packages
- Creator gets 5% bonus on purchases above $100
- Tiered rewards for high-value transactions

### Advertising Revenue
- 55% to creators with ad-supported content
- 45% platform revenue

## Compliance

### Tax Compliance
- Automatic 1099 generation for US creators
- Tax withholding calculation
- International tax support
- VAT/GST handling

### Regional Compliance
- GDPR compliant data handling
- PSD2 support for EU payments
- India-specific RBI requirements
- KYC verification for high earners

### Terms of Service
- Clear payment terms
- Refund policies
- Dispute resolution process
- Chargeback protection

## Best Practices

1. **Payment Security**
   - Always use HTTPS
   - Never store card details
   - Validate all inputs
   - Use tokenization

2. **User Experience**
   - Show clear pricing
   - Provide payment confirmations
   - Enable easy payment method management
   - Offer multiple payment options

3. **Fraud Prevention**
   - Monitor unusual patterns
   - Implement velocity checks
   - Use AVS/CVV verification
   - Manual review for high values

4. **Creator Support**
   - Clear earnings reports
   - Timely payouts
   - Multiple withdrawal methods
   - Tax documentation

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Payment declined | Check card details, try different card |
| Gift not sent | Verify wallet balance, check recipient |
| Subscription not activated | Check payment method, try again |
| Payout pending | Wait 5-7 business days, contact support |
| Tax document missing | Submit tax form in settings |

## Contact Support

Payment support: support@spaktok.com
Urgent issues: +1-XXX-XXX-XXXX
