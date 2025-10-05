# Gift System Design for Spaktok

This document outlines the design for a gift system similar to TikTok's, to be implemented in the Spaktok application.

## 1. Gift Data Model

A `gifts` collection will be created in Firestore. Each document in this collection will represent a single gift and will have the following structure:

| Field       | Type     | Description                                      |
|-------------|----------|--------------------------------------------------|
| `name`      | `String` | The name of the gift (e.g., "Lion", "Rose").      |
| `cost`      | `Number` | The cost of the gift in coins.                   |
| `imageUrl`  | `String` | The URL to the static image of the gift.         |
| `animationUrl`| `String` | The URL to the animation for the gift (optional).|

## 2. Gift List

The following gifts will be created:

| Gift        | Cost (Coins) |
|-------------|--------------|
| Lion        | 5000         |
| Car         | 2000         |
| Castle      | 10000        |
| Dance       | 500          |
| Rose        | 1            |
| Heart       | 5            |
| Diamond     | 100          |
| Money       | 10           |

## 3. Gift Assets

Images and animations for each gift will be sourced or created and uploaded to Firebase Storage. The URLs will then be added to the corresponding gift documents in Firestore.

## 4. Cloud Functions

The existing `processGiftPayout` Cloud Function will be updated to handle the new gift types. The logic for calculating the payout to the receiver will remain the same.

## 5. Flutter UI

The Flutter application will be updated to:

*   Display the list of available gifts in a bottom sheet during a live stream.
*   Allow users to purchase and send gifts to the streamer.
*   Display gift animations and notifications in the live stream interface when a gift is received.

