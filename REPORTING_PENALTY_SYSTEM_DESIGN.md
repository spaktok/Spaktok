# Automatic Reporting and Penalty System Design for Spaktok

## 1. Overview
This document outlines the design for an automatic reporting and penalty system within Spaktok. The system will allow users to report inappropriate content or behavior, automatically process these reports, issue warnings, and apply temporary or permanent bans based on a tiered violation policy.

## 2. Core Features
*   **User Reporting:** Users can report videos, live streams, comments, messages, or other users.
*   **Automated Processing:** Initial processing of reports to categorize and prioritize.
*   **Tiered Warnings:** A system of warnings (e.g., 3 strikes) before a ban is applied.
*   **Automatic Bans:** Temporary and permanent bans based on accumulated violations.
*   **Admin Review:** Critical reports or appeals can be escalated for manual review by administrators.
*   **Monthly Reports:** Automated generation of reports for management.

## 3. Data Models (Firestore)

### 3.1. `reports` Collection
This collection will store details of each report submitted by users.

| Field Name        | Type           | Description                                                                 | Example Value                                  |
| :---------------- | :------------- | :-------------------------------------------------------------------------- | :--------------------------------------------- |
| `reportId`        | String         | Unique ID for the report (document ID)                                      | `rep_xyz123`                                   |
| `reporterId`      | String         | ID of the user who submitted the report                                     | `user_abc`                                     |
| `reportedEntityId`| String         | ID of the entity being reported (video, user, comment, message, stream)     | `vid_def456`                                   |
| `reportedEntityType`| String         | Type of entity being reported (`video`, `user`, `comment`, `message`, `stream`)| `video`                                        |
| `reason`          | String         | Reason for the report (e.g., `hate_speech`, `nudity`, `spam`)               | `hate_speech`                                  |
| `description`     | String         | Optional detailed description from the reporter                             | `User used offensive language in comments.`    |
| `status`          | String         | Current status of the report (`pending`, `under_review`, `resolved`, `rejected`)| `pending`                                      |
| `createdAt`       | Timestamp      | Timestamp of report submission                                              | `Timestamp(2025, 1, 10, 14, 00)`               |
| `resolvedAt`      | Timestamp      | Timestamp when the report was resolved                                      | `Timestamp(2025, 1, 10, 15, 30)`               |
| `resolvedBy`      | String         | ID of admin/system that resolved the report                                 | `system_auto`                                  |
| `actionTaken`     | String         | Action taken (e.g., `warning`, `temporary_ban`, `permanent_ban`, `content_removed`)| `warning`                                      |

### 3.2. `violations` Collection
This collection will track violations for each user.

| Field Name        | Type           | Description                                                                 | Example Value                                  |
| :---------------- | :------------- | :-------------------------------------------------------------------------- | :--------------------------------------------- |
| `violationId`     | String         | Unique ID for the violation (document ID)                                   | `vio_ghi789`                                   |
| `userId`          | String         | ID of the user who committed the violation                                  | `user_abc`                                     |
| `reportId`        | String         | ID of the report that led to this violation                                 | `rep_xyz123`                                   |
| `type`            | String         | Type of violation (e.g., `content_policy`, `community_guidelines`)          | `content_policy`                               |
| `level`           | Number         | Severity level of the violation (e.g., 1, 2, 3)                             | `1`                                            |
| `warningCount`    | Number         | Current warning count for the user                                          | `1`                                            |
| `action`          | String         | Action taken (`warning`, `temporary_ban`, `permanent_ban`)                  | `warning`                                      |
| `banExpiresAt`    | Timestamp      | If temporary ban, when it expires                                           | `Timestamp(2025, 1, 17, 00, 00)`               |
| `createdAt`       | Timestamp      | Timestamp of violation record                                               | `Timestamp(2025, 1, 10, 15, 30)`               |

### 3.3. `users` Collection (Updated Fields)
Additional fields in the existing `users` collection to track penalty status.

| Field Name        | Type           | Description                                                                 | Example Value                                  |
| :---------------- | :------------- | :-------------------------------------------------------------------------- | :--------------------------------------------- |
| `warningCount`    | Number         | Number of active warnings for the user                                      | `1`                                            |
| `isBanned`        | Boolean        | True if the user is currently banned                                        | `true`                                         |
| `banExpiresAt`    | Timestamp      | If banned, when the ban expires                                             | `Timestamp(2025, 1, 17, 00, 00)`               |
| `banReason`       | String         | Reason for the current ban                                                  | `repeated_content_violations`                  |

## 4. Firestore Security Rules

Rules will be updated to:
*   Allow authenticated users to create `reports`.
*   Allow administrators to read, update, and delete `reports` and `violations`.
*   Prevent users from modifying `reports` or `violations` after creation.
*   Allow users to read their own `violations`.

```firestore
match /reports/{reportId} {
  allow create: if request.auth != null && request.resource.data.reporterId == request.auth.uid;
  allow read: if request.auth != null && (request.auth.uid == resource.data.reporterId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
  allow update, delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}

match /violations/{violationId} {
  allow read: if request.auth != null && (request.auth.uid == resource.data.userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
  allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true; // Only admins or system functions can write violations
}
```

## 5. Firebase Cloud Functions

### 5.1. `submitReport` (Callable)
*   **Description:** Allows users to submit a report against an entity.
*   **Input:** `reportedEntityId`, `reportedEntityType`, `reason`, `description`.
*   **Output:** Success status.
*   **Logic:**
    1.  Authenticate user.
    2.  Create a new document in the `reports` collection with `status: 'pending'`.
    3.  Trigger `processReport` (either directly or via Firestore trigger).

### 5.2. `processReport` (Firestore Trigger - `onDocumentCreated` for `reports`)
*   **Description:** Automatically processes new reports, determines severity, and applies penalties.
*   **Trigger:** `onDocumentCreated` for `reports/{reportId}`.
*   **Logic:**
    1.  Read report data.
    2.  (Future AI/ML integration) Analyze content/reason for severity. For now, use a simple mapping (e.g., `hate_speech` = high severity).
    3.  Retrieve `reportedEntityId` (e.g., the user who posted the video, or the reported user).
    4.  Retrieve the `warningCount` for the `reportedUser` from the `users` collection.
    5.  Apply tiered penalty logic:
        *   **1st violation:** Issue a warning. Update `users/{reportedUser}.warningCount`.
        *   **2nd violation:** Issue a second warning. Update `users/{reportedUser}.warningCount`.
        *   **3rd violation:** Issue a temporary ban (e.g., 3 days). Update `users/{reportedUser}.isBanned`, `banExpiresAt`, `banReason`, and reset `warningCount`.
        *   **4th violation:** Issue a permanent ban. Update `users/{reportedUser}.isBanned`, `banReason`, and set `banExpiresAt` to null.
    6.  Record the violation in the `violations` collection.
    7.  Update the `reports/{reportId}.status` to `resolved` and `actionTaken`.
    8.  (Optional) Send a notification to the reported user about the warning/ban.

### 5.3. `checkBanStatus` (Callable - for Flutter to check user status)
*   **Description:** Checks if a user is currently banned and if so, when the ban expires.
*   **Input:** `userId` (optional, defaults to `request.auth.uid`).
*   **Output:** `isBanned`, `banExpiresAt`, `banReason`.

### 5.4. `unbanUser` (Callable - Admin Function)
*   **Description:** Allows administrators to manually unban a user.
*   **Input:** `userId`.
*   **Output:** Success status.
*   **Logic:**
    1.  Authenticate and authorize admin.
    2.  Update `users/{userId}.isBanned` to `false`, `banExpiresAt` to `null`, `banReason` to `null`, and `warningCount` to `0`.

### 5.5. `generateMonthlyReports` (Scheduled - Admin Function)
*   **Description:** Generates a summary of reports and violations for the past month.
*   **Trigger:** Scheduled (e.g., first day of every month).
*   **Logic:**
    1.  Query `reports` and `violations` collections for the previous month.
    2.  Aggregate data (e.g., total reports, reports by reason, total warnings, total bans, active bans).
    3.  Store the summary in a `monthlyReports` collection or send it to an admin email (future).

## 6. Flutter Services (Backend Interaction)

### 6.1. `ReportingService`
*   **Methods:**
    *   `submitReport({required String reportedEntityId, required String reportedEntityType, required String reason, String? description})`: Calls `submitReport` Cloud Function.
    *   `checkBanStatus()`: Calls `checkBanStatus` Cloud Function.
    *   `unbanUser({required String userId})`: Calls `unbanUser` Cloud Function (admin only).

## 7. Integration with Existing Systems
*   **User System:** Updates `users` collection directly for `warningCount`, `isBanned`, `banExpiresAt`, `banReason`.
*   **Notifications System:** (Future) Integrate with notifications to inform users of warnings/bans.
*   **Admin Dashboard:** (Future) UI for viewing reports, violations, and managing bans.

## 8. Future Enhancements
*   AI/ML integration for content moderation and severity assessment.
*   Appeal process for banned users.
*   More granular ban types (e.g., comment ban, live stream ban).
*   Integration with external content moderation services.
