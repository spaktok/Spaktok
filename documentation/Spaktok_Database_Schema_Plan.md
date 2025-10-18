# Spaktok Database Schema Plan

This document outlines the planned database schemas for the Spaktok social media application, leveraging a polyglot persistence strategy with MongoDB, PostgreSQL, and Redis to optimize for different data access patterns and consistency requirements.

## 1. PostgreSQL Schemas (Relational Data)

PostgreSQL will be used for relational data where strong consistency, complex queries, and well-defined relationships are crucial. This includes user profiles, follower/following relationships, and transaction logs.

### 1.1. `users` Table

| Column Name        | Data Type          | Constraints          | Description                                    |
| :----------------- | :----------------- | :------------------- | :--------------------------------------------- |
| `user_id`          | UUID               | PRIMARY KEY          | Unique identifier for the user                 |
| `username`         | VARCHAR(50)        | UNIQUE, NOT NULL     | User's chosen username                         |
| `email`            | VARCHAR(255)       | UNIQUE, NOT NULL     | User's email address                           |
| `password_hash`    | VARCHAR(255)       | NOT NULL             | Hashed password for authentication             |
| `display_name`     | VARCHAR(100)       |                      | User's display name                            |
| `bio`              | TEXT               |                      | User's biography                               |
| `profile_picture_url` | VARCHAR(2048)      |                      | URL to user's profile picture                  |
| `created_at`       | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()        | Timestamp of user creation                     |
| `updated_at`       | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()        | Timestamp of last update                       |
| `is_streamer`      | BOOLEAN            | DEFAULT FALSE        | Indicates if the user is a streamer            |
| `country`          | VARCHAR(100)       |                      | User's country for region-specific features    |
| `language`         | VARCHAR(10)        |                      | User's preferred language                      |

### 1.2. `followers` Table

| Column Name        | Data Type          | Constraints          | Description                                    |
| :----------------- | :----------------- | :------------------- | :--------------------------------------------- |
| `follower_id`      | UUID               | FOREIGN KEY          | ID of the user who is following                |
| `following_id`     | UUID               | FOREIGN KEY          | ID of the user being followed                  |
| `created_at`       | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()        | Timestamp of follow action                     |
| `PRIMARY KEY`      | (follower_id, following_id) |                      | Composite primary key                          |

### 1.3. `transactions` Table

| Column Name        | Data Type          | Constraints          | Description                                    |
| :----------------- | :----------------- | :------------------- | :--------------------------------------------- |
| `transaction_id`   | UUID               | PRIMARY KEY          | Unique identifier for the transaction          |
| `sender_user_id`   | UUID               | FOREIGN KEY          | User who sent the gift/payment                 |
| `receiver_user_id` | UUID               | FOREIGN KEY          | User who received the gift/payment             |
| `gift_id`          | UUID               | FOREIGN KEY          | ID of the gift sent (if applicable)            |
| `amount`           | NUMERIC(10, 2)     | NOT NULL             | Amount of transaction in USD                   |
| `currency`         | VARCHAR(3)         | NOT NULL             | Currency code (e.g., USD, EUR)                 |
| `exchange_rate`    | NUMERIC(10, 4)     |                      | Exchange rate to USD at time of transaction    |
| `platform_fee`     | NUMERIC(10, 2)     |                      | Platform's share of the transaction            |
| `streamer_payout`  | NUMERIC(10, 2)     |                      | Streamer's share of the transaction            |
| `transaction_type` | VARCHAR(50)        | NOT NULL             | e.g., 'gift_sent', 'gift_received', 'payout'   |
| `status`           | VARCHAR(50)        | NOT NULL             | e.g., 'completed', 'pending', 'failed'         |
| `created_at`       | TIMESTAMP WITH TIME ZONE | DEFAULT NOW()        | Timestamp of transaction creation              |

## 2. MongoDB Schemas (Document-Oriented Data)

MongoDB will be used for flexible, schema-less data that benefits from document storage, such as chat messages, content metadata for stories/reels, and potentially live stream metadata.

### 2.1. `chats` Collection

| Field Name         | Data Type          | Description                                    |
| :----------------- | :----------------- | :--------------------------------------------- |
| `_id`              | ObjectId           | Unique identifier for the chat message         |
| `sender_id`        | UUID               | ID of the user who sent the message            |
| `receiver_id`      | UUID               | ID of the user who received the message (for 1:1) |
| `room_id`          | UUID               | ID of the chat room (for group/stream chat)    |
| `message_type`     | String             | e.g., 'text', 'image', 'voice', 'video_call'   |
| `content`          | String             | Message text or URL to media content           |
| `timestamp`        | Date               | Timestamp of message creation                  |
| `is_disappearing`  | Boolean            | Indicates if the message should disappear      |
| `disappear_after_seconds` | Number             | Time in seconds after which message disappears |
| `read_by`          | Array of UUIDs     | List of user IDs who have read the message     |

### 2.2. `live_streams` Collection

| Field Name         | Data Type          | Description                                    |
| :----------------- | :----------------- | :--------------------------------------------- |
| `_id`              | ObjectId           | Unique identifier for the live stream          |
| `streamer_id`      | UUID               | ID of the user hosting the stream              |
| `title`            | String             | Title of the live stream                       |
| `description`      | String             | Description of the live stream                 |
| `start_time`       | Date               | Timestamp when the stream started              |
| `end_time`         | Date               | Timestamp when the stream ended                |
| `status`           | String             | e.g., 'live', 'ended', 'scheduled'             |
| `viewer_count`     | Number             | Current number of viewers                      |
| `participants`     | Array of UUIDs     | IDs of co-streamers in multi-participant rooms |
| `stream_url`       | String             | URL to the live stream (e.g., HLS, RTMP)       |
| `thumbnail_url`    | String             | URL to the stream thumbnail                    |

### 2.3. `stories` Collection

| Field Name         | Data Type          | Description                                    |
| :----------------- | :----------------- | :--------------------------------------------- |
| `_id`              | ObjectId           | Unique identifier for the story                |
| `user_id`          | UUID               | ID of the user who posted the story            |
| `media_url`        | String             | URL to the story media (image/video)           |
| `caption`          | String             | Optional caption for the story                 |
| `created_at`       | Date               | Timestamp of story creation                    |
| `expires_at`       | Date               | Timestamp when the story expires               |
| `views`            | Array of UUIDs     | List of user IDs who viewed the story          |

### 2.4. `reels` Collection

| Field Name         | Data Type          | Description                                    |
| :----------------- | :----------------- | :--------------------------------------------- |
| `_id`              | ObjectId           | Unique identifier for the reel                 |
| `user_id`          | UUID               | ID of the user who posted the reel             |
| `video_url`        | String             | URL to the reel video                          |
| `caption`          | String             | Optional caption for the reel                  |
| `created_at`       | Date               | Timestamp of reel creation                     |
| `likes`            | Array of UUIDs     | List of user IDs who liked the reel            |
| `comments`         | Array of Objects   | Embedded comments (see `comments` sub-schema)  |

#### `comments` Sub-schema

| Field Name         | Data Type          | Description                                    |
| :----------------- | :----------------- | :--------------------------------------------- |
| `comment_id`       | UUID               | Unique identifier for the comment              |
| `user_id`          | UUID               | ID of the user who commented                   |
| `text`             | String             | Comment text                                   |
| `timestamp`        | Date               | Timestamp of comment creation                  |

## 3. Redis Usage (Caching & Real-time)

Redis will be primarily used for caching frequently accessed data, managing real-time states, and facilitating pub/sub for chat and live streaming.

-   **Session Management**: Storing user session tokens and data.
-   **Real-time Chat**: Pub/sub for instant message delivery and temporary message storage.
-   **Live Stream Viewer Counts**: Incrementing/decrementing viewer counts in real-time.
-   **Leaderboards/Trending**: Caching dynamic leaderboards for gifts or trending streams.
-   **Ephemeral Data**: Storing temporary data like disappearing message content before deletion.
