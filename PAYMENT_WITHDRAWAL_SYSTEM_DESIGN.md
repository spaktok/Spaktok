# Spaktok Payment and Withdrawal System Design

This document outlines the design for a comprehensive global payment and withdrawal system for Spaktok. The system will manage virtual currency, revenue splitting for broadcasters, user wallets, and facilitate withdrawals to external payment methods like PayPal and bank accounts, while also tracking Spaktok's platform revenue.

## 1. Core Concepts

*   **Virtual Currency (Coins):** Users purchase virtual coins within the app. These coins are used to send gifts to broadcasters.
*   **Gifts:** Virtual items purchased with coins and sent to broadcasters during live streams. Each gift has a monetary value.
*   **Broadcaster Earnings:** A percentage of the gift's value that the broadcaster receives.
*   **Spaktok Revenue:** A percentage of the gift's value retained by the platform.
*   **User Wallet:** Stores a user's earned balance (from gifts) and purchased coins.
*   **Payouts:** The process of transferring earned balances from a user's wallet to an external account (PayPal, bank).

## 2. Firestore Data Models

We will utilize several Firestore collections to manage the payment and withdrawal system.

### 2.1. `users` Collection (Existing - Modifications)

Existing user documents will be updated to include wallet-related fields.

**Document ID:** `userId`

| Field Name          | Type      | Description                                                                 |
| :------------------ | :-------- | :-------------------------------------------------------------------------- |
| `balance`           | `number`  | Current withdrawable balance (e.g., from gifts received).                   |
| `coins`             | `number`  | Current virtual currency balance (purchased by user).                       |
| `paypalEmail`       | `string`  | User's linked PayPal email for withdrawals (optional).                      |
| `bankAccountDetails`| `map`     | User's linked bank account details for withdrawals (optional).              |
| `bankAccountDetails.bankName` | `string` | Name of the bank.                                                      |
| `bankAccountDetails.accountNumber` | `string` | User's bank account number.                                            |
| `bankAccountDetails.accountHolderName` | `string` | Name of the account holder.                                            |
| `bankAccountDetails.swiftCode` | `string` | SWIFT/BIC code for international transfers (optional).                     |
| `bankAccountDetails.iban` | `string` | IBAN for European bank transfers (optional).                               |
| `bankAccountDetails.country` | `string` | Country of the bank account.                                               |

### 2.2. `transactions` Collection

Records all financial movements within the system (coin purchases, gift sending, gift receiving, withdrawals).

**Document ID:** Auto-generated

| Field Name          | Type      | Description                                                                 |
| :------------------ | :-------- | :-------------------------------------------------------------------------- |
| `userId`            | `string`  | ID of the user initiating or affected by the transaction.                   |
| `type`              | `string`  | Type of transaction: `coin_purchase`, `gift_sent`, `gift_received`, `withdrawal_request`, `withdrawal_completed`, `platform_fee`. |
| `amount`            | `number`  | The value of the transaction (e.g., coins purchased, gift value, withdrawal amount). |
| `currency`          | `string`  | Currency of the transaction (e.g., `USD`, `coins`).                         |
| `timestamp`         | `timestamp` | Server timestamp of the transaction.                                        |
| `status`            | `string`  | Status of the transaction: `pending`, `completed`, `failed`.                |
| `description`       | `string`  | Human-readable description of the transaction.                              |
| `relatedEntityId`   | `string`  | ID of related entity (e.g., `giftId`, `payoutRequestId`, `receiverId`).     |
| `platformShare`     | `number`  | Amount retained by Spaktok (for `gift_sent` or `gift_received` types).      |
| `broadcasterShare`  | `number`  | Amount received by broadcaster (for `gift_received` type).                  |

### 2.3. `payoutRequests` Collection

Stores requests from users to withdraw their earned balance.

**Document ID:** Auto-generated

| Field Name          | Type      | Description                                                                 |
| :------------------ | :-------- | :-------------------------------------------------------------------------- |\n| `userId`            | `string`  | ID of the user requesting payout.                                           |
| `amount`            | `number`  | Amount requested for withdrawal.                                            |
| `requestDate`       | `timestamp` | Timestamp of the payout request.                                            |
| `status`            | `string`  | Status of the request: `pending`, `approved`, `rejected`, `completed`.      |
| `payoutMethod`      | `string`  | Method of payout: `paypal`, `bank_transfer`.                                |
| `payoutDetails`     | `map`     | Details of the payout method (e.g., `paypalEmail`, `bankAccountDetails`).   |
| `processedBy`       | `string`  | Admin user ID who processed the request (if applicable).                    |
| `processedDate`     | `timestamp` | Timestamp when the request was processed.                                   |
| `transactionId`     | `string`  | ID of the external transaction (e.g., PayPal Payout ID, bank transfer ID).  |
| `notes`             | `string`  | Any notes from admin regarding the payout.                                  |

### 2.4. `platformRevenue` Collection

Tracks Spaktok's accumulated revenue from various sources (e.g., gift commissions, coin sales).

**Document ID:** `summary` (single document)

| Field Name          | Type      | Description                                                                 |
| :------------------ | :-------- | :-------------------------------------------------------------------------- |
| `totalRevenue`      | `number`  | Total accumulated revenue for Spaktok.                                      |
| `lastUpdated`       | `timestamp` | Last time the revenue was updated.                                          |
| `revenueBreakdown`  | `map`     | Optional: Breakdown by source (e.g., `gifts`, `coinSales`).                 |

### 2.5. `gifts` Collection (Existing - Modifications)

Existing gift documents will be updated to include `value` in real currency.

**Document ID:** `giftId` (e.g., `lion`, `car`)

| Field Name          | Type      | Description                                                                 |
| :------------------ | :-------- | :-------------------------------------------------------------------------- |
| `name`              | `string`  | Name of the gift.                                                           |
| `imageUrl`          | `string`  | URL to the gift's image/animation asset.                                    |
| `coinCost`          | `number`  | Number of virtual coins required to send this gift.                         |
| `realValueUSD`      | `number`  | The real-world USD value of the gift.                                       |

## 3. Revenue Splitting Logic

When a user sends a gift:

1.  **Deduct Coins:** The `coinCost` is deducted from the sender's `coins` balance.
2.  **Calculate Real Value:** The `realValueUSD` of the gift is determined.
3.  **Broadcaster Share:**
    *   If the broadcaster is a **premium account**, they receive **90%** of `realValueUSD`.
    *   If the broadcaster is a **standard account**, they receive **50%** of `realValueUSD`.
    *   This amount is added to the broadcaster's `balance` field in their `users` document.
4.  **Spaktok Share:**
    *   The remaining percentage (10% for premium broadcasters, 50% for standard broadcasters) is retained by Spaktok.
    *   This amount is added to the `totalRevenue` in the `platformRevenue/summary` document.
5.  **Record Transactions:** Separate `gift_sent`, `gift_received`, and `platform_fee` transactions are recorded in the `transactions` collection.

## 4. Withdrawal Process Flow

1.  **User Request:** A user (broadcaster) requests a withdrawal of their `balance` via the Flutter app.
2.  **Payout Request Creation:** A new document is created in the `payoutRequests` collection with `status: 'pending'`, `userId`, `amount`, `payoutMethod`, and `payoutDetails`.
3.  **Admin Review:** An admin reviews the `pending` payout requests.
4.  **Admin Action:**
    *   **Approve:** If approved, the admin initiates the payout via the chosen payment gateway (PayPal Payouts API or Stripe Connect). The user's `balance` is debited. The `payoutRequest` status is updated to `approved` and then `completed` upon successful external transaction. `transactionId` is recorded.
    *   **Reject:** If rejected, the `payoutRequest` status is updated to `rejected`, and the `balance` is credited back to the user. `notes` explain the rejection reason.
5.  **Transaction Recording:** A `withdrawal_request` and `withdrawal_completed` (or `withdrawal_rejected`) transaction is recorded in the `transactions` collection.

## 5. Integration with Payment Gateways

Firebase Cloud Functions will serve as the backend for interacting with external payment gateways.

### 5.1. PayPal Payouts

*   **API:** Use PayPal Payouts REST API.
*   **Function:** A Cloud Function (e.g., `processPayPalPayout`) will be responsible for calling the PayPal API to send funds to a user's PayPal email.
*   **Credentials:** PayPal API credentials (Client ID, Secret) will be stored securely (e.g., Firebase Environment Configuration).

### 5.2. Stripe Connect

*   **API:** Use Stripe Connect API.
*   **Function:** Cloud Functions (e.g., `createStripeAccount`, `processStripePayout`) will manage connected accounts for broadcasters and initiate payouts to their bank accounts.
*   **Onboarding:** Broadcasters will be redirected to Stripe to complete their onboarding and link their bank accounts. Spaktok will store the `StripeAccountId` for each broadcaster.
*   **Credentials:** Stripe API keys will be stored securely.

## 6. Flutter Services (No UI)

Flutter services will interact with the Cloud Functions to:

*   **Purchase Coins:** Call a Cloud Function (e.g., `purchaseCoins`) to process in-app purchases and update user's `coins` balance.
*   **Send Gifts:** Call a Cloud Function (e.g., `sendGift`) to deduct coins, calculate shares, update balances, and record transactions.
*   **Request Withdrawal:** Call a Cloud Function (e.g., `requestPayout`) to create a `payoutRequest` document.
*   **Link Payment Methods:** Call Cloud Functions (e.g., `linkPayPal`, `linkBankAccount`) to securely store payment details or initiate Stripe onboarding.
*   **Fetch Wallet Data:** Read user's `balance` and `coins` from their `users` document.
*   **Fetch Transaction History:** Read from the `transactions` collection.
*   **Fetch Payout Request Status:** Read from the `payoutRequests` collection.

## 7. Security and Compliance

*   **Firestore Security Rules:** Strict rules will be implemented to ensure only authenticated users can access/modify their own wallet data and only admins can manage payout requests and platform revenue.
*   **Cloud Functions:** All sensitive operations (e.g., interacting with payment gateways, updating balances) will be handled server-side via Cloud Functions to protect API keys and ensure data integrity.
*   **Data Encryption:** Sensitive user data (e.g., bank account details) will be encrypted at rest in Firestore (Firebase handles this automatically) and handled securely in transit.
*   **KYC/AML:** Integrate with Stripe Connect or PayPal's KYC features for broadcasters receiving payouts.

This design provides a robust foundation for Spaktok's payment and withdrawal system, addressing the requirements for revenue splitting, global payouts, and platform revenue tracking.
