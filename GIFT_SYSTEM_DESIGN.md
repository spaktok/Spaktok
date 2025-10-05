# Spaktok Gift System Design

This document outlines the comprehensive design for the virtual gifting system in Spaktok, enabling users to send virtual gifts to content creators during live streams and on videos, similar to TikTok's gifting system.

## 1. Core Concepts

**Virtual Gifts** are digital items that users purchase with virtual coins and send to content creators as a form of appreciation and support. Gifts have real monetary value and provide a primary monetization mechanism for creators.

**Key Features:**
- Virtual currency (coins) purchase system
- Diverse gift catalog with varying values
- Real-time gift animations
- Gift combos and multipliers
- Revenue sharing (50% standard, 90% premium)
- Gift leaderboards
- Special event gifts
- Gift history and analytics
- Refund and dispute handling

## 2. Firestore Data Models

### 2.1. `gifts` Collection

Master catalog of all available gifts.

**Document ID:** `giftId` (e.g., `rose`, `lion`, `castle`)

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `giftId` | `string` | Unique gift identifier |
| `name` | `string` | Gift name (e.g., "Rose", "Lion", "Castle") |
| `description` | `string` | Gift description |
| `category` | `string` | Category: `basic`, `premium`, `luxury`, `event`, `seasonal` |
| `coinCost` | `number` | Cost in virtual coins |
| `realValueUSD` | `number` | Real USD value of the gift |
| `imageUrl` | `string` | Static image URL |
| `animationUrl` | `string` | Animation file URL (Lottie JSON or video) |
| `thumbnailUrl` | `string` | Thumbnail for selection UI |
| `duration` | `number` | Animation duration in seconds |
| `rarity` | `string` | Rarity: `common`, `rare`, `epic`, `legendary` |
| `isAvailable` | `boolean` | Whether gift is currently available |
| `isLimited` | `boolean` | Whether gift is limited edition |
| `availableUntil` | `timestamp` | Expiration date for limited gifts |
| `minimumLevel` | `number` | Minimum user level required to send |
| `sortOrder` | `number` | Display order in gift picker |
| `totalSent` | `number` | Total times this gift has been sent |
| `tags` | `array<string>` | Search tags |
| `createdAt` | `timestamp` | When gift was added |
| `updatedAt` | `timestamp` | Last update timestamp |

### 2.2. `giftTransactions` Collection

Records all gift transactions.

**Document ID:** Auto-generated

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `transactionId` | `string` | Unique transaction identifier |
| `giftId` | `string` | ID of the gift sent |
| `giftName` | `string` | Name of the gift (denormalized) |
| `giftImageUrl` | `string` | Gift image URL (denormalized) |
| `giftAnimationUrl` | `string` | Gift animation URL (denormalized) |
| `senderId` | `string` | ID of the user sending the gift |
| `senderUsername` | `string` | Username of sender (denormalized) |
| `senderProfileImage` | `string` | Profile image of sender (denormalized) |
| `receiverId` | `string` | ID of the user receiving the gift |
| `receiverUsername` | `string` | Username of receiver (denormalized) |
| `receiverProfileImage` | `string` | Profile image of receiver (denormalized) |
| `context` | `string` | Context: `live_stream`, `video`, `profile` |
| `contextId` | `string` | ID of stream/video where gift was sent |
| `quantity` | `number` | Number of gifts sent (for combos) |
| `coinCost` | `number` | Total coins spent |
| `realValueUSD` | `number` | Total real USD value |
| `broadcasterShare` | `number` | Amount broadcaster receives (USD) |
| `platformShare` | `number` | Amount platform retains (USD) |
| `isPremiumReceiver` | `boolean` | Whether receiver is premium account |
| `revenueSharePercentage` | `number` | Percentage receiver gets (50 or 90) |
| `message` | `string` | Optional message with gift |
| `isAnonymous` | `boolean` | Whether gift is sent anonymously |
| `status` | `string` | Status: `pending`, `completed`, `refunded`, `disputed` |
| `timestamp` | `timestamp` | When gift was sent |
| `processedAt` | `timestamp` | When transaction was processed |
| `refundedAt` | `timestamp` | When refunded (if applicable) |
| `refundReason` | `string` | Reason for refund |

### 2.3. `userGiftStats` Collection (Subcollection under users)

Tracks gift statistics for each user.

**Path:** `users/{userId}/giftStats/summary`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `totalGiftsSent` | `number` | Total gifts sent by user |
| `totalGiftsReceived` | `number` | Total gifts received by user |
| `totalCoinsSpent` | `number` | Total coins spent on gifts |
| `totalRevenueEarned` | `number` | Total USD earned from gifts |
| `favoriteGiftSent` | `string` | Most sent gift ID |
| `favoriteGiftReceived` | `string` | Most received gift ID |
| `topRecipient` | `string` | User who received most gifts from this user |
| `topSender` | `string` | User who sent most gifts to this user |
| `lastGiftSent` | `timestamp` | Last time user sent a gift |
| `lastGiftReceived` | `timestamp` | Last time user received a gift |
| `giftingSince` | `timestamp` | First gift transaction date |
| `currentStreak` | `number` | Current daily gifting streak |
| `longestStreak` | `number` | Longest daily gifting streak |
| `updatedAt` | `timestamp` | Last update timestamp |

### 2.4. `giftLeaderboards` Collection

Leaderboards for top gifters and receivers.

**Document ID:** `{period}_{type}` (e.g., `daily_senders`, `weekly_receivers`)

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `period` | `string` | Period: `daily`, `weekly`, `monthly`, `all_time` |
| `type` | `string` | Type: `senders`, `receivers` |
| `rankings` | `array<map>` | Array of ranked users |
| `rankings[].userId` | `string` | User ID |
| `rankings[].username` | `string` | Username |
| `rankings[].profileImage` | `string` | Profile image |
| `rankings[].value` | `number` | Total gifts/revenue value |
| `rankings[].rank` | `number` | Current rank |
| `rankings[].change` | `number` | Rank change from previous period |
| `lastUpdated` | `timestamp` | Last update timestamp |
| `nextUpdate` | `timestamp` | Next scheduled update |

### 2.5. `giftCombos` Collection

Tracks active gift combos during streams.

**Document ID:** `{streamId}_{senderId}_{giftId}`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `streamId` | `string` | ID of the stream |
| `senderId` | `string` | ID of the sender |
| `giftId` | `string` | ID of the gift |
| `count` | `number` | Current combo count |
| `startedAt` | `timestamp` | When combo started |
| `lastGiftAt` | `timestamp` | Last gift in combo |
| `expiresAt` | `timestamp` | When combo expires (5 seconds after last gift) |
| `isActive` | `boolean` | Whether combo is still active |

### 2.6. `coinPackages` Collection

Available coin packages for purchase.

**Document ID:** `packageId`

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `packageId` | `string` | Unique package identifier |
| `name` | `string` | Package name (e.g., "Starter Pack") |
| `coinAmount` | `number` | Number of coins in package |
| `bonusCoins` | `number` | Bonus coins (for promotions) |
| `priceUSD` | `number` | Price in USD |
| `priceLocal` | `map` | Prices in other currencies |
| `discount` | `number` | Discount percentage (0-100) |
| `isPopular` | `boolean` | Whether to highlight as popular |
| `isBestValue` | `boolean` | Whether to highlight as best value |
| `isAvailable` | `boolean` | Whether currently available |
| `sortOrder` | `number` | Display order |
| `imageUrl` | `string` | Package icon/image |
| `createdAt` | `timestamp` | Creation timestamp |

### 2.7. `coinPurchases` Collection

Records coin purchases by users.

**Document ID:** Auto-generated

| Field Name | Type | Description |
|:-----------|:-----|:------------|
| `purchaseId` | `string` | Unique purchase identifier |
| `userId` | `string` | ID of the purchaser |
| `packageId` | `string` | ID of the package purchased |
| `coinAmount` | `number` | Coins purchased |
| `bonusCoins` | `number` | Bonus coins received |
| `totalCoins` | `number` | Total coins received |
| `priceUSD` | `number` | Amount paid in USD |
| `pricePaid` | `number` | Amount paid in user's currency |
| `currency` | `string` | Currency used |
| `paymentMethod` | `string` | Method: `stripe`, `paypal`, `apple_pay`, `google_pay` |
| `paymentIntentId` | `string` | Payment gateway transaction ID |
| `status` | `string` | Status: `pending`, `completed`, `failed`, `refunded` |
| `timestamp` | `timestamp` | Purchase timestamp |
| `completedAt` | `timestamp` | When payment completed |
| `failureReason` | `string` | Reason if failed |

## 3. Gift Catalog

### 3.1. Basic Gifts (1-100 coins)

| Gift Name | Coins | USD Value | Description |
|:----------|:------|:----------|:------------|
| Rose | 1 | $0.01 | A simple rose |
| Heart | 5 | $0.05 | Show some love |
| Thumbs Up | 10 | $0.10 | Great content! |
| Clap | 20 | $0.20 | Round of applause |
| Fire | 50 | $0.50 | This is fire! |
| Star | 100 | $1.00 | You're a star! |

### 3.2. Premium Gifts (100-1000 coins)

| Gift Name | Coins | USD Value | Description |
|:----------|:------|:----------|:------------|
| Diamond | 100 | $1.00 | Precious diamond |
| Crown | 200 | $2.00 | Royal treatment |
| Trophy | 500 | $5.00 | Champion! |
| Rocket | 800 | $8.00 | To the moon! |
| Unicorn | 1000 | $10.00 | Magical unicorn |

### 3.3. Luxury Gifts (1000-10000 coins)

| Gift Name | Coins | USD Value | Description |
|:----------|:------|:----------|:------------|
| Sports Car | 2000 | $20.00 | Luxury sports car |
| Yacht | 5000 | $50.00 | Private yacht |
| Lion | 5000 | $50.00 | King of the jungle |
| Castle | 10000 | $100.00 | Your own castle |
| Private Jet | 15000 | $150.00 | Fly in style |

### 3.4. Legendary Gifts (10000+ coins)

| Gift Name | Coins | USD Value | Description |
|:----------|:------|:----------|:------------|
| Island | 20000 | $200.00 | Private island |
| Planet | 50000 | $500.00 | Out of this world |
| Galaxy | 100000 | $1000.00 | The ultimate gift |

### 3.5. Seasonal/Event Gifts

- **Valentine's Day:** Cupid's Arrow, Love Letter, Chocolate Box
- **Halloween:** Pumpkin, Ghost, Witch Hat
- **Christmas:** Santa, Snowman, Christmas Tree
- **New Year:** Fireworks, Champagne, Party Popper

## 4. Cloud Functions

### 4.1. Gift Sending Functions

**Function:** `sendGift`
- **Trigger:** HTTPS Callable
- **Purpose:** Send a gift to a content creator
- **Process:**
  1. Verify user authentication
  2. Get gift details from catalog
  3. Check user has sufficient coins
  4. Verify receiver exists and can receive gifts
  5. Check for active combo
  6. Deduct coins from sender's balance
  7. Calculate broadcaster and platform shares
  8. Update receiver's balance
  9. Create gift transaction record
  10. Update user gift statistics
  11. Create notification for receiver
  12. If in live stream, broadcast gift animation
  13. Update leaderboards
  14. Return gift animation data and combo info

**Function:** `sendGiftCombo`
- **Trigger:** HTTPS Callable
- **Purpose:** Send multiple gifts in a combo
- **Process:**
  1. Verify user authentication
  2. Get gift details
  3. Check user has sufficient coins for quantity
  4. Process each gift in batch
  5. Create/update combo record
  6. Calculate total revenue
  7. Broadcast combo animation
  8. Update statistics
  9. Return combo data

**Function:** `processGiftPayout`
- **Trigger:** Background (on gift transaction)
- **Purpose:** Process gift revenue distribution
- **Process:**
  1. Get receiver's account type (standard/premium)
  2. Calculate shares:
     - Premium: 90% to broadcaster, 10% to platform
     - Standard: 50% to broadcaster, 50% to platform
  3. Add broadcaster share to user balance
  4. Add platform share to platform revenue
  5. Record transaction in transactions collection
  6. Update receiver's earnings statistics
  7. Send earnings notification

**Function:** `refundGift`
- **Trigger:** HTTPS Callable (admin only)
- **Purpose:** Refund a gift transaction
- **Process:**
  1. Verify admin privileges
  2. Get transaction details
  3. Reverse coin deduction (refund sender)
  4. Reverse balance addition (deduct from receiver)
  5. Reverse platform revenue
  6. Update transaction status to refunded
  7. Record refund reason
  8. Send notifications to both parties
  9. Return success status

### 4.2. Coin Purchase Functions

**Function:** `purchaseCoins`
- **Trigger:** HTTPS Callable
- **Purpose:** Purchase coin package
- **Process:**
  1. Verify user authentication
  2. Get package details
  3. Create payment intent with Stripe/PayPal
  4. Return client secret for payment
  5. Create pending purchase record
  6. Wait for payment confirmation webhook

**Function:** `confirmCoinPurchase`
- **Trigger:** Webhook from payment gateway
- **Purpose:** Confirm coin purchase after payment
- **Process:**
  1. Verify webhook signature
  2. Get purchase record
  3. Verify payment status
  4. Add coins to user balance
  5. Update purchase status to completed
  6. Record transaction
  7. Send confirmation notification
  8. Return success

**Function:** `getCoinPackages`
- **Trigger:** HTTPS Callable
- **Purpose:** Get available coin packages
- **Process:**
  1. Query available packages
  2. Sort by sortOrder
  3. Apply any active promotions
  4. Return packages with localized prices

### 4.3. Gift Catalog Functions

**Function:** `getGiftCatalog`
- **Trigger:** HTTPS Callable
- **Purpose:** Get available gifts
- **Process:**
  1. Query available gifts
  2. Filter by user level if applicable
  3. Sort by category and sortOrder
  4. Return gift catalog with animations

**Function:** `addGift`
- **Trigger:** HTTPS Callable (admin only)
- **Purpose:** Add new gift to catalog
- **Process:**
  1. Verify admin privileges
  2. Validate gift data
  3. Upload animation assets to Storage
  4. Create gift document
  5. Return gift details

**Function:** `updateGift`
- **Trigger:** HTTPS Callable (admin only)
- **Purpose:** Update gift details
- **Process:**
  1. Verify admin privileges
  2. Update gift document
  3. Return updated gift data

**Function:** `removeGift`
- **Trigger:** HTTPS Callable (admin only)
- **Purpose:** Remove gift from catalog
- **Process:**
  1. Verify admin privileges
  2. Set gift as unavailable
  3. Return success status

### 4.4. Leaderboard Functions

**Function:** `updateGiftLeaderboards`
- **Trigger:** Scheduled (every 1 hour)
- **Purpose:** Update gift leaderboards
- **Process:**
  1. Calculate daily, weekly, monthly rankings
  2. Top senders by coins spent
  3. Top receivers by revenue earned
  4. Update leaderboard documents
  5. Send notifications to top rankers

**Function:** `getGiftLeaderboard`
- **Trigger:** HTTPS Callable
- **Purpose:** Get gift leaderboard
- **Process:**
  1. Get leaderboard for specified period and type
  2. Return rankings with user details

### 4.5. Analytics Functions

**Function:** `getUserGiftStats`
- **Trigger:** HTTPS Callable
- **Purpose:** Get user's gift statistics
- **Process:**
  1. Verify user authentication
  2. Get user's gift stats
  3. Calculate additional metrics
  4. Return comprehensive statistics

**Function:** `getGiftAnalytics`
- **Trigger:** HTTPS Callable (creator only)
- **Purpose:** Get detailed gift analytics for creator
- **Process:**
  1. Verify user is content creator
  2. Aggregate gift transactions
  3. Calculate revenue over time
  4. Get top gifters
  5. Get popular gifts received
  6. Return analytics report

**Function:** `updateGiftStats`
- **Trigger:** Background (on gift transaction)
- **Purpose:** Update user gift statistics
- **Process:**
  1. Update sender's stats (gifts sent, coins spent)
  2. Update receiver's stats (gifts received, revenue earned)
  3. Update gift's total sent count
  4. Update streaks
  5. Check for achievements

## 5. Gift Animations

### 5.1. Animation Types

**Lottie Animations:**
- Lightweight JSON format
- Smooth vector animations
- Easy to customize
- Supported on mobile and web

**Video Animations:**
- High-quality effects
- Larger file size
- Used for luxury gifts
- Pre-rendered effects

**Particle Effects:**
- Real-time generated
- Interactive animations
- Used for combos
- GPU-accelerated

### 5.2. Animation Triggers

**During Live Streams:**
1. Gift sent by viewer
2. Animation plays full-screen for all viewers
3. Sender name and gift displayed
4. Sound effect plays
5. Animation duration: 3-5 seconds
6. Queue multiple gifts if needed

**On Videos:**
1. Gift sent on video
2. Animation plays on video player
3. Gift counter increments
4. Notification sent to creator

**Combo Animations:**
1. Multiple gifts sent within 5 seconds
2. Combo counter increases
3. Special combo animation plays
4. Larger display for high combos
5. Combo ends after 5 seconds of no gifts

## 6. Revenue Model

### 6.1. Coin Pricing

**1 Coin = $0.01 USD**

**Coin Packages:**
- 100 coins = $0.99 (1% discount)
- 500 coins = $4.99 (0% bonus)
- 1000 coins = $9.99 (+10 bonus coins)
- 2000 coins = $19.99 (+50 bonus coins)
- 5000 coins = $49.99 (+200 bonus coins)
- 10000 coins = $99.99 (+500 bonus coins)

### 6.2. Revenue Sharing

**Standard Creators:**
- Creator receives: 50%
- Platform retains: 50%

**Premium Creators:**
- Creator receives: 90%
- Platform retains: 10%

**Example:**
- Gift costs 1000 coins ($10 USD)
- Standard creator earns: $5
- Premium creator earns: $9

### 6.3. Withdrawal

**Minimum Balance:** $10 USD
**Processing Time:** 3-5 business days
**Methods:** PayPal, Bank Transfer
**Fees:** 
- PayPal: 2% + $0.30
- Bank Transfer: $1 flat fee

## 7. Performance Optimizations

### 7.1. Caching

- Cache gift catalog in memory
- Cache coin packages
- Cache leaderboards (update hourly)
- Preload gift animations

### 7.2. Batch Processing

- Batch gift transactions
- Batch leaderboard updates
- Batch notification sending
- Batch statistics updates

### 7.3. Scalability

- Shard gift counters for popular gifts
- Use Cloud Tasks for background processing
- Implement rate limiting on gift sending
- Queue gift animations during high traffic

## 8. Security Considerations

### 8.1. Fraud Prevention

- Verify payment before adding coins
- Detect suspicious gifting patterns
- Implement daily gift limits
- Monitor for coin farming
- Require verification for large purchases

### 8.2. Transaction Integrity

- Use Firestore transactions for coin operations
- Validate all gift transactions
- Prevent double-spending
- Log all transactions
- Enable refund system for disputes

### 8.3. Rate Limiting

- Limit gifts per minute per user
- Prevent spam gifting
- Throttle API calls
- Detect bot activity

## 9. Integration Points

### 9.1. With Other Systems

- **Live Streaming:** Send gifts during streams
- **Short Videos:** Send gifts on videos
- **Profile:** Display gift statistics
- **Wallet:** Manage coins and earnings
- **Notifications:** Gift received notifications
- **Leaderboards:** Top gifters and receivers
- **Analytics:** Revenue tracking

### 9.2. Payment Gateways

- **Stripe:** Credit card payments
- **PayPal:** PayPal payments
- **Apple Pay:** iOS in-app purchases
- **Google Pay:** Android in-app purchases

## 10. Monitoring and Analytics

### 10.1. Key Metrics

- Total gifts sent per day
- Total revenue generated
- Average gift value
- Conversion rate (viewers to gifters)
- Top performing gifts
- Gift refund rate
- Coin purchase conversion

### 10.2. Creator Metrics

- Total gifts received
- Revenue earned
- Top gifters
- Gift trends over time
- Peak gifting times
- Gift-to-view ratio

## 11. Future Enhancements

- Gift subscriptions (monthly gift packages)
- Custom gifts (users create own gifts)
- Gift reactions (animated responses)
- Gift challenges and events
- Gift NFTs (blockchain-based unique gifts)
- Gift trading marketplace
- Charity gifts (portion goes to charity)
- Group gifting (multiple users contribute)
- Gift wishes (creators request specific gifts)
- Achievement badges for gifting milestones

This comprehensive gift system design provides a robust monetization mechanism for Spaktok, enabling creators to earn revenue while providing viewers with meaningful ways to support their favorite content creators.
