# Spaktok Payment Integration Plan

This document outlines the strategy for integrating payment systems into the Spaktok application, focusing on global payment gateways, multi-currency support, and the revenue sharing model for the gift system.

## 1. Overview and Objectives

The primary objective is to enable users to purchase virtual gifts and for streamers to receive payouts, ensuring a seamless, secure, and globally accessible payment experience. Key considerations include:

-   **Global Reach**: Support for major international payment methods.
-   **Local Currency Support**: Allow users to pay in their local currency.
-   **Unified Pricing**: Standardize virtual gift pricing based on USD.
-   **Revenue Sharing**: Implement a 40% streamer / 60% platform revenue split.
-   **Security**: Adherence to PCI DSS compliance and best practices for financial transactions.

## 2. Payment Gateway Selection

We will integrate with a robust payment gateway that offers broad international coverage, multi-currency support, and comprehensive APIs for both one-time payments and payouts.

### Recommended Gateway: Stripe

**Stripe** is chosen for its extensive features, developer-friendly APIs, global reach, and strong security measures. It supports:

-   **Credit/Debit Card Processing**: Major card networks (Visa, Mastercard, Amex, etc.).
-   **Local Payment Methods**: Integration with various local payment options (e.g., Alipay, WeChat Pay, SEPA Direct Debit, iDEAL).
-   **Payouts**: Facilitates payouts to streamers in multiple currencies.
-   **Fraud Prevention**: Built-in tools to minimize fraudulent transactions.
-   **Subscription Management**: (Future consideration for premium features).

## 3. Payment Flow for Virtual Gift Purchase

1.  **User Initiates Purchase**: User selects a virtual gift package in the Spaktok app.
2.  **Currency Conversion**: The app displays the price in the user's local currency, converted from the USD base price using real-time exchange rates.
3.  **Payment Method Selection**: User chooses their preferred payment method (e.g., credit card, local payment option).
4.  **Secure Transaction**: The app securely communicates with the Stripe API to process the payment.
5.  **Payment Confirmation**: Stripe processes the payment and sends a confirmation webhook to the Spaktok backend.
6.  **Virtual Currency Allocation**: Upon successful payment, the backend allocates the corresponding virtual currency to the user's account.

## 4. Gift Sending and Revenue Sharing Flow

1.  **User Sends Gift**: A user sends a virtual gift to a streamer during a live stream.
2.  **Gift Value Calculation**: The backend determines the USD value of the gift.
3.  **Revenue Split**: The system calculates the 40% share for the streamer and 60% for the platform.
4.  **Streamer Balance Update**: The streamer's internal balance is updated with their 40% share.
5.  **Transaction Recording**: A detailed transaction record is stored in the PostgreSQL `transactions` table.

## 5. Streamer Payouts

1.  **Payout Request**: Streamers can request a payout once their accumulated balance reaches a minimum threshold.
2.  **Identity Verification (KYC)**: Streamers must complete a Know Your Customer (KYC) process (if required by regulations and Stripe) to receive payouts.
3.  **Payout Processing**: The Spaktok backend initiates a payout via Stripe Connect to the streamer's linked bank account or debit card.
4.  **Currency Conversion for Payout**: Payouts are made in the streamer's local currency, with Stripe handling the conversion.
5.  **Transaction Logging**: Payout transactions are recorded in the `transactions` table.

## 6. Multi-Currency Support and Unified Pricing

-   **Base Currency**: All internal pricing and revenue calculations will be based on **USD**.
-   **Exchange Rates**: Utilize a reliable exchange rate API (e.g., Open Exchange Rates, Fixer.io) to convert USD prices to local currencies for display to users.
-   **Dynamic Pricing**: Prices displayed to users will be dynamically updated based on current exchange rates.
-   **Payment Gateway Handling**: Stripe will handle the actual currency conversion during the payment processing and payout stages, minimizing complexity for the Spaktok backend.

## 7. Security and Compliance

-   **PCI DSS Compliance**: Leverage Stripe's hosted payment pages and SDKs to minimize the Spaktok application's PCI DSS scope.
-   **Data Encryption**: All sensitive payment information will be encrypted in transit and at rest.
-   **Fraud Detection**: Implement Stripe's Radar for fraud prevention and integrate custom fraud detection logic.
-   **Regulatory Compliance**: Ensure compliance with local financial regulations in all operating regions (e.g., AML, KYC).

## 8. API Endpoints (Backend - Gift & Payment Service)

-   `POST /api/payments/create-checkout-session`: Initiates a payment for virtual currency.
-   `POST /api/payments/webhook`: Endpoint for Stripe to send payment event notifications.
-   `POST /api/gifts/send`: Records a gift sent from one user to another.
-   `GET /api/wallet/balance`: Retrieves a user's virtual currency balance.
-   `GET /api/transactions`: Retrieves a user's transaction history.
-   `POST /api/payouts/request`: Allows streamers to request a payout.
-   `POST /api/payouts/webhook`: Endpoint for Stripe to send payout event notifications.
