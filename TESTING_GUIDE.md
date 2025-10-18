# Spaktok Backend Testing Guide

This document provides a comprehensive testing guide for all backend systems implemented in the Spaktok social media platform. It outlines testing strategies, test cases, and procedures to ensure the backend is production-ready, scalable, and secure.

## Table of Contents
1. [Introduction](#1-introduction)
2. [Testing Environment Setup](#2-testing-environment-setup)
3. [Testing Strategies](#3-testing-strategies)
4. [System-Specific Test Cases](#4-system-specific-test-cases)
5. [Integration Testing](#5-integration-testing)
6. [Performance and Load Testing](#6-performance-and-load-testing)
7. [Security Testing](#7-security-testing)
8. [Deployment and Monitoring](#8-deployment-and-monitoring)

## 1. Introduction

The Spaktok backend comprises multiple interconnected systems built on Firebase Cloud Functions and Firestore. Comprehensive testing ensures that each system functions correctly in isolation and integrates seamlessly with others. This guide covers unit testing, integration testing, performance testing, and security testing to guarantee a robust and reliable backend.

## 2. Testing Environment Setup

Before conducting tests, ensure the following setup is complete:

### 2.1. Firebase Project Configuration
- Ensure the Firebase project is properly configured with Firestore, Cloud Functions, Firebase Authentication, and Firebase Cloud Messaging.
- Set up separate Firebase projects for development, staging, and production environments to isolate testing from live data.

### 2.2. Local Development Environment
- Install Node.js (version 18 or higher) and npm.
- Install Firebase CLI: `npm install -g firebase-tools`
- Authenticate with Firebase: `firebase login`
- Initialize Firebase Functions: `cd functions && npm install`

### 2.3. Testing Frameworks
- Install testing frameworks for Cloud Functions:
  - `npm install --save-dev jest @types/jest ts-jest`
  - `npm install --save-dev firebase-functions-test`
- Configure Jest in `functions/package.json`:
  ```json
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node"
  }
  ```

### 2.4. Emulator Suite
- Use Firebase Emulator Suite for local testing:
  - `firebase emulators:start`
- This provides local instances of Firestore, Cloud Functions, and Authentication for testing without affecting production data.

## 3. Testing Strategies

### 3.1. Unit Testing
Unit tests verify the functionality of individual Cloud Functions in isolation. Each function should be tested with various input scenarios, including valid inputs, edge cases, and invalid inputs.

### 3.2. Integration Testing
Integration tests verify that multiple systems work together correctly. For example, testing that sending a gift updates the sender's balance, the receiver's balance, and creates a transaction record.

### 3.3. End-to-End Testing
End-to-end tests simulate real user workflows from the client application to the backend. This ensures that the entire system functions as expected from the user's perspective.

### 3.4. Performance Testing
Performance tests evaluate the backend's ability to handle high loads and concurrent requests. This includes stress testing, load testing, and scalability testing.

### 3.5. Security Testing
Security tests verify that Firebase Security Rules are correctly configured and that sensitive data is protected. This includes testing authentication, authorization, and data access controls.

## 4. System-Specific Test Cases

### 4.1. User Management System

#### Test Cases:
1. **User Profile Update**
   - Test updating user profile fields (displayName, bio, profileImage).
   - Verify that protected fields (balance, coins, isAdmin) cannot be updated by regular users.
   - Verify that admin users can update protected fields.

2. **Block/Unblock User**
   - Test blocking a user and verify that the blocked user is added to the blockedUsers list.
   - Test unblocking a user and verify that the user is removed from the blockedUsers list.

3. **Friend Request System**
   - Test sending a friend request and verify that it is added to the friendRequests collection.
   - Test accepting a friend request and verify that both users are added to each other's friends list.
   - Test declining a friend request and verify that the request is removed.

4. **Location Privacy**
   - Test updating location privacy settings and verify that the settings are saved correctly.
   - Test retrieving nearby users based on location privacy settings.

### 4.2. Profile System

#### Test Cases:
1. **Get User Profile**
   - Test retrieving a user's profile and verify that all fields are returned correctly.
   - Test retrieving a profile with privacy settings and verify that private information is not exposed.

2. **Edit Profile**
   - Test editing profile fields and verify that changes are saved.
   - Test editing protected fields and verify that they are rejected.

3. **Request Verification**
   - Test submitting a verification request and verify that it is added to the verificationRequests collection.

### 4.3. Short Videos (Reels/Feed) System

#### Test Cases:
1. **Upload Video**
   - Test uploading a video and verify that it is added to the videos collection.
   - Test uploading a video with invalid data and verify that it is rejected.

2. **Get Video Feed**
   - Test retrieving a personalized video feed and verify that videos are returned in the correct order.
   - Test pagination and verify that the hasMore flag is set correctly.

3. **Like Video**
   - Test liking a video and verify that the like count is incremented.
   - Test unliking a video and verify that the like count is decremented.

4. **Add Comment**
   - Test adding a comment to a video and verify that it is added to the comments collection.
   - Test adding a comment with invalid data and verify that it is rejected.

### 4.4. Stories System

#### Test Cases:
1. **Upload Story**
   - Test uploading a story and verify that it is added to the stories collection.
   - Test uploading a story with invalid data and verify that it is rejected.

2. **Get Stories Feed**
   - Test retrieving a stories feed and verify that stories are returned in the correct order.
   - Test that expired stories are not included in the feed.

3. **View Story**
   - Test viewing a story and verify that the view count is incremented.
   - Test that the viewer is added to the viewers list.

### 4.5. Live Streaming System

#### Test Cases:
1. **Start Live Stream**
   - Test starting a live stream and verify that it is added to the liveStreams collection.
   - Test that RTMP URL and stream key are generated correctly.

2. **End Live Stream**
   - Test ending a live stream and verify that the status is updated to "ended".
   - Test that the stream duration is calculated correctly.

3. **Get Live Streams**
   - Test retrieving active live streams and verify that only live streams are returned.
   - Test pagination and verify that the hasMore flag is set correctly.

4. **Join Live Stream**
   - Test joining a live stream and verify that the viewer count is incremented.

### 4.6. Gift System

#### Test Cases:
1. **Send Gift**
   - Test sending a gift and verify that the sender's coins are deducted.
   - Test that the receiver's balance is credited with the appropriate amount.
   - Test that a transaction record is created.
   - Test sending a gift with insufficient coins and verify that it is rejected.

2. **Get Gift Catalog**
   - Test retrieving the gift catalog and verify that all gifts are returned.

3. **Get User Gifts**
   - Test retrieving gifts received by a user and verify that all gifts are returned.

### 4.7. Messaging & Snaps System

#### Test Cases:
1. **Create Conversation**
   - Test creating a one-to-one conversation and verify that it is added to the conversations collection.
   - Test creating a group conversation and verify that all participants are added.

2. **Send Message**
   - Test sending a text message and verify that it is added to the messages subcollection.
   - Test sending an ephemeral message and verify that it is marked as ephemeral.

3. **Get Messages**
   - Test retrieving messages from a conversation and verify that they are returned in the correct order.
   - Test pagination and verify that the hasMore flag is set correctly.

4. **Mark Message as Read**
   - Test marking a message as read and verify that the read status is updated.

5. **Typing Indicators**
   - Test starting typing and verify that the typing indicator is set.
   - Test stopping typing and verify that the typing indicator is removed.

6. **Initiate Call**
   - Test initiating a call and verify that a call record is created.
   - Test that the call offer is generated correctly.

7. **Answer Call**
   - Test answering a call and verify that the call status is updated.

8. **End Call**
   - Test ending a call and verify that the call status is updated to "ended".

### 4.8. Ads System

#### Test Cases:
1. **Create Ad (Admin Only)**
   - Test creating an ad and verify that it is added to the ads collection.
   - Test creating an ad with invalid data and verify that it is rejected.

2. **Update Ad (Admin Only)**
   - Test updating an ad and verify that changes are saved.

3. **Get Ads**
   - Test retrieving active ads and verify that only active ads are returned.

4. **Record Ad Impression**
   - Test recording an ad impression and verify that the impression count is incremented.

5. **Record Ad Click**
   - Test recording an ad click and verify that the click count is incremented.

6. **Get Ad Analytics (Admin Only)**
   - Test retrieving ad analytics and verify that all metrics are returned correctly.

### 4.9. Age & Safety Verification System

#### Test Cases:
1. **Set Birth Date**
   - Test setting a birth date and verify that the age is calculated correctly.
   - Test setting a birth date for a user under 13 and verify that it is rejected.
   - Test setting a birth date twice and verify that the second attempt is rejected.

2. **Request ID Verification**
   - Test submitting an ID verification request and verify that it is added to the idVerificationRequests collection.

3. **Approve ID Verification (Admin Only)**
   - Test approving an ID verification request and verify that the user's isIdVerified flag is set to true.

4. **Reject ID Verification (Admin Only)**
   - Test rejecting an ID verification request and verify that the user is notified.

5. **Update Content Filter Level**
   - Test updating the content filter level and verify that the setting is saved.
   - Test that users under 18 cannot turn off content filters.

6. **Check Content Age Restriction**
   - Test checking if a user can view age-restricted content and verify that the correct result is returned.

7. **Set Content Age Restriction**
   - Test setting an age restriction on content and verify that it is saved.

### 4.10. Reports & Penalties System

#### Test Cases:
1. **Report Content**
   - Test submitting a report and verify that it is added to the reports collection.
   - Test submitting a duplicate report and verify that it is rejected.

2. **Review Report (Admin Only)**
   - Test reviewing a report and taking action (dismiss, remove content, warn user, ban user).
   - Verify that the appropriate action is taken based on the decision.

3. **Ban User (Admin Only)**
   - Test banning a user and verify that the isBanned flag is set to true.
   - Test that the user's active live streams are terminated.

4. **Unban User (Admin Only)**
   - Test unbanning a user and verify that the isBanned flag is set to false.

5. **Get Pending Reports (Admin Only)**
   - Test retrieving pending reports and verify that all pending reports are returned.

6. **Get Moderation Stats (Admin Only)**
   - Test retrieving moderation statistics and verify that all metrics are returned correctly.

### 4.11. Notifications System

#### Test Cases:
1. **Register FCM Token**
   - Test registering an FCM token and verify that it is added to the user's fcmTokens list.

2. **Unregister FCM Token**
   - Test unregistering an FCM token and verify that it is removed from the user's fcmTokens list.

3. **Get Notifications**
   - Test retrieving notifications and verify that all notifications are returned in the correct order.
   - Test pagination and verify that the hasMore flag is set correctly.

4. **Mark Notification as Read**
   - Test marking a notification as read and verify that the read status is updated.

5. **Mark All Notifications as Read**
   - Test marking all notifications as read and verify that all unread notifications are updated.

6. **Delete Notification**
   - Test deleting a notification and verify that it is removed from the notifications collection.

7. **Update Notification Settings**
   - Test updating notification settings and verify that the settings are saved.

8. **Notification Triggers**
   - Test that notifications are sent when a video is liked, a comment is added, or a live stream starts.

### 4.12. Admin Dashboard & Internal Economy

#### Test Cases:
1. **Get Platform Statistics (Admin Only)**
   - Test retrieving platform statistics and verify that all metrics are returned correctly.

2. **Get User Analytics (Admin Only)**
   - Test retrieving user analytics and verify that all metrics are returned correctly.

3. **Get Revenue Analytics (Admin Only)**
   - Test retrieving revenue analytics and verify that all metrics are returned correctly.

4. **Get Content Analytics (Admin Only)**
   - Test retrieving content analytics and verify that all metrics are returned correctly.

5. **Manage User (Admin Only)**
   - Test verifying a user and verify that the isVerified flag is set to true.
   - Test granting premium to a user and verify that the isPremiumAccount flag is set to true.
   - Test adjusting a user's balance and coins and verify that the changes are saved.

6. **Get All Users (Admin Only)**
   - Test retrieving all users and verify that pagination works correctly.
   - Test applying filters and verify that only matching users are returned.

7. **Get Economy Insights (Admin Only)**
   - Test retrieving economy insights and verify that all metrics are returned correctly.

8. **Synchronize Internal Economy (Scheduled Function)**
   - Test that the economy synchronization function runs correctly and updates the platformRevenue collection.

## 5. Integration Testing

Integration tests verify that multiple systems work together correctly. The following integration scenarios should be tested:

### 5.1. Gift Sending and Balance Update
- Test that sending a gift deducts coins from the sender, credits the receiver's balance, and creates a transaction record.
- Verify that platform revenue is updated correctly.

### 5.2. Content Reporting and Moderation
- Test that reporting content increments the report count and triggers auto-moderation if the threshold is exceeded.
- Verify that reviewing a report takes the appropriate action (remove content, warn user, ban user).

### 5.3. Notification Triggers
- Test that liking a video sends a notification to the video owner.
- Test that commenting on a video sends a notification to the video owner.
- Test that starting a live stream sends notifications to all followers.

### 5.4. Age Restriction and Content Access
- Test that users under the age restriction cannot view age-restricted content.
- Test that setting an age restriction on content updates the content document correctly.

## 6. Performance and Load Testing

Performance testing ensures that the backend can handle high loads and concurrent requests. The following tests should be conducted:

### 6.1. Load Testing
- Simulate 1000 concurrent users accessing the video feed.
- Simulate 500 concurrent users sending messages.
- Simulate 100 concurrent users starting live streams.
- Measure response times, throughput, and error rates.

### 6.2. Stress Testing
- Gradually increase the load until the system reaches its breaking point.
- Identify bottlenecks and optimize performance.

### 6.3. Scalability Testing
- Test that the system can scale horizontally by adding more Cloud Function instances.
- Verify that Firestore can handle increased read/write operations.

## 7. Security Testing

Security testing verifies that Firebase Security Rules are correctly configured and that sensitive data is protected. The following tests should be conducted:

### 7.1. Authentication Testing
- Test that unauthenticated users cannot access protected resources.
- Test that authenticated users can only access their own data.

### 7.2. Authorization Testing
- Test that regular users cannot access admin-only functions.
- Test that users cannot modify protected fields (balance, coins, isAdmin).

### 7.3. Data Access Control Testing
- Test that users can only read their own notifications.
- Test that users can only read messages in conversations they are part of.
- Test that users cannot read other users' private information.

### 7.4. Input Validation Testing
- Test that invalid inputs are rejected (e.g., negative coin amounts, invalid date formats).
- Test that SQL injection and XSS attacks are prevented.

## 8. Deployment and Monitoring

After testing is complete, deploy the backend to production and set up monitoring to track performance and errors.

### 8.1. Deployment
- Deploy Cloud Functions: `firebase deploy --only functions`
- Deploy Firestore Security Rules: `firebase deploy --only firestore:rules`
- Deploy Firestore Indexes: `firebase deploy --only firestore:indexes`

### 8.2. Monitoring
- Use Firebase Console to monitor Cloud Function execution times, error rates, and invocation counts.
- Set up alerts for critical errors and performance degradation.
- Use Firebase Performance Monitoring to track app performance.

### 8.3. Logging
- Use Cloud Functions logging to track function execution and debug issues.
- Implement structured logging for better analysis.

---

This testing guide ensures that the Spaktok backend is thoroughly tested and ready for production deployment. Regular testing and monitoring will help maintain the platform's reliability and performance as it scales.
