# Ads System Design for Spaktok

## 1. Overview
This document outlines the design for an integrated advertising system within Spaktok, supporting various ad formats, tracking, and revenue distribution. The system will allow administrators to manage ads via Firestore and integrate ad revenue with the existing payment and withdrawal system.

## 2. Ad Types
Spaktok will support two primary types of ads:

### 2.1. Short Video Ads (Interstitial / Rewarded)
*   **Description:** Full-screen video ads that appear at natural break points (e.g., between short videos in the feed, or as rewarded ads for in-app benefits).
*   **Characteristics:**
    *   Non-skippable or skippable after a few seconds.
    *   Rewarded ads offer in-app currency (e.g., coins) or other benefits upon completion.
*   **Placement:** Interstitial (e.g., every N videos), Rewarded (user-initiated).

### 2.2. In-Feed Ads
*   **Description:** Video ads that appear seamlessly within the main video feed, blending with organic content.
*   **Characteristics:**
    *   Typically short video format.
    *   Can include a call-to-action (CTA) button.
*   **Placement:** Integrated within the main video feed, appearing after a certain number of organic videos.

## 3. Data Models (Firestore)

### 3.1. `ads` Collection
This collection will store information about each advertisement.

| Field Name        | Type           | Description                                                                 | Example Value                                  |
| :---------------- | :------------- | :-------------------------------------------------------------------------- | :--------------------------------------------- |
| `adId`            | String         | Unique ID for the ad (document ID)                                          | `ad_123xyz`                                    |
| `advertiserId`    | String         | ID of the advertiser (if applicable, e.g., user ID or external advertiser)  | `user_abc`                                     |
| `type`            | String         | Type of ad: `interstitial`, `rewarded`, `in_feed`                           | `in_feed`                                      |
| `mediaUrl`        | String         | URL of the ad video/image                                                   | `https://storage.firebase.com/ad_video.mp4`    |
| `thumbnailUrl`    | String         | URL of the ad thumbnail (for in-feed ads)                                   | `https://storage.firebase.com/ad_thumb.jpg`    |
| `callToAction`    | String         | Text for the call-to-action button                                          | `Shop Now`                                     |
| `callToActionUrl` | String         | URL to navigate to when CTA is clicked                                      | `https://www.example.com/product`              |
| `targetAudience`  | Map            | Targeting criteria (e.g., `gender`, `age_range`, `country`)                 | `{ "country": "US", "age_min": 18 }`       |
| `startDate`       | Timestamp      | When the ad campaign starts                                                 | `Timestamp(2025, 1, 1)`                        |
| `endDate`         | Timestamp      | When the ad campaign ends                                                   | `Timestamp(2025, 1, 31)`                       |
| `isActive`        | Boolean        | Whether the ad is currently active                                          | `true`                                         |
| `budget`          | Number         | Total budget for the ad campaign                                            | `1000.00`                                      |
| `cpm`             | Number         | Cost per mille (1000 impressions) for billing (if applicable)               | `5.00`                                         |
| `cpc`             | Number         | Cost per click for billing (if applicable)                                  | `0.50`                                         |
| `rewardCoins`     | Number         | Number of coins rewarded for `rewarded` ads                                 | `10`                                           |
| `createdAt`       | Timestamp      | Timestamp of ad creation                                                    | `Timestamp(2024, 12, 20)`                      |
| `updatedAt`       | Timestamp      | Last update timestamp                                                       | `Timestamp(2024, 12, 25)`                      |

### 3.2. `adImpressions` Collection
This collection will record each time an ad is viewed.

| Field Name        | Type           | Description                                                                 | Example Value                                  |
| :---------------- | :------------- | :-------------------------------------------------------------------------- | :--------------------------------------------- |
| `impressionId`    | String         | Unique ID for the impression (document ID)                                  | `imp_xyz789`                                   |
| `adId`            | String         | ID of the ad that was viewed                                                | `ad_123xyz`                                    |
| `userId`          | String         | ID of the user who viewed the ad                                            | `user_abc`                                     |
| `timestamp`       | Timestamp      | When the ad was viewed                                                      | `Timestamp(2025, 1, 5, 10, 30)`                |
| `duration`        | Number         | Duration of view in seconds (for video ads)                                 | `15`                                           |
| `isRewarded`      | Boolean        | True if it was a rewarded ad and user received reward                       | `true`                                         |

### 3.3. `adClicks` Collection
This collection will record each time an ad's call-to-action is clicked.

| Field Name        | Type           | Description                                                                 | Example Value                                  |
| :---------------- | :------------- | :-------------------------------------------------------------------------- | :--------------------------------------------- |\n| `clickId`         | String         | Unique ID for the click (document ID)                                       | `click_def456`                                 |
| `adId`            | String         | ID of the ad that was clicked                                               | `ad_123xyz`                                    |
| `userId`          | String         | ID of the user who clicked the ad                                           | `user_abc`                                     |
| `timestamp`       | Timestamp      | When the ad was clicked                                                     | `Timestamp(2025, 1, 5, 10, 35)`                |

## 4. Firestore Security Rules

Rules will be updated to:
*   Allow authenticated users to read `ads` collection.
*   Allow authenticated users to create `adImpressions` and `adClicks` (for tracking).
*   Allow administrators to create, read, update, and delete `ads`.
*   Prevent users from modifying `adImpressions` or `adClicks` after creation.

```firestore
match /ads/{adId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}

match /adImpressions/{impressionId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow write: if false; // Impressions should not be modified after creation
}

match /adClicks/{clickId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow write: if false; // Clicks should not be modified after creation
}
```

## 5. Firebase Cloud Functions

### 5.1. `getAds` (Callable)
*   **Description:** Retrieves a list of active ads based on type and targeting criteria.
*   **Input:** `type` (optional, e.g., `interstitial`, `in_feed`), `userId` (for targeting).
*   **Output:** Array of ad objects.

### 5.2. `recordAdImpression` (Callable)
*   **Description:** Records an ad impression and, for rewarded ads, credits coins to the user.
*   **Input:** `adId`, `duration` (for video ads), `isRewarded` (boolean).
*   **Output:** Success status.
*   **Logic:**
    1.  Authenticate user.
    2.  Record impression in `adImpressions` collection.
    3.  If `isRewarded` is true, retrieve `rewardCoins` from the `ads` collection for the given `adId`.
    4.  Credit `rewardCoins` to the user's `coins` balance in the `users` collection.
    5.  Record a transaction for the rewarded coins.

### 5.3. `recordAdClick` (Callable)
*   **Description:** Records an ad click.
*   **Input:** `adId`.
*   **Output:** Success status.
*   **Logic:**
    1.  Authenticate user.
    2.  Record click in `adClicks` collection.

### 5.4. `processAdRevenue` (Scheduled - Admin Function)
*   **Description:** Periodically calculates ad revenue for Spaktok and potentially for content creators (if applicable).
*   **Trigger:** Scheduled (e.g., daily or weekly).
*   **Logic:**
    1.  Query `adImpressions` and `adClicks` for a specific period.
    2.  Calculate total revenue based on CPM/CPC models defined in `ads` collection.
    3.  Record Spaktok's share of revenue in `platformRevenue` or a dedicated `adRevenue` collection.
    4.  (Future enhancement) Distribute a portion of ad revenue to content creators whose videos host in-feed ads.

## 6. Flutter Services (Backend Interaction)

### 6.1. `AdService`
*   **Methods:**
    *   `fetchAds({String? type})`: Calls `getAds` Cloud Function.
    *   `recordImpression({required String adId, double? duration, bool isRewarded = false})`: Calls `recordAdImpression` Cloud Function.
    *   `recordClick({required String adId})`: Calls `recordAdClick` Cloud Function.

## 7. Integration with Existing Systems
*   **Economy System:** `recordAdImpression` will directly update the user's `coins` balance, integrating with the existing `users` collection and `transactions` collection.
*   **Admin Dashboard:** Future development will include UI for managing ads and viewing ad performance metrics.

## 8. Future Enhancements
*   Advanced ad targeting (demographics, interests).
*   A/B testing for ad creatives.
*   Detailed analytics and reporting for advertisers.
*   Integration with external ad networks.
*   Revenue sharing with content creators for in-feed ads. 
