# Snapchat Chat and Location Features Research

This document summarizes the key chat and location sharing features of Snapchat, which will serve as a reference for implementing similar functionalities in Spaktok.

## 1. Snapchat Chat Features

Snapchat's chat system is designed for ephemeral and engaging communication, offering a rich set of features beyond basic text messaging:

*   **Text Messaging:** Core functionality for one-on-one and group conversations.
*   **Disappearing Messages:** A defining feature where messages (Snaps and Chats) are deleted by default after viewing or a set time, emphasizing privacy and in-the-moment communication. This applies to text, voice, and video chats.
*   **Stickers:** Users can send a variety of stickers to express themselves.
*   **Video Notes/Audio Notes:** Short, looping video or audio messages that can be sent within a chat, offering a quick way to convey emotions or messages.
*   **Voice and Video Calls:** Real-time voice and video communication directly from the chat screen.
*   **Sending Media:** Users can send photos and videos from their Memories or Camera Roll.
*   **Attachments and Links:** Ability to share external links and other content.
*   **Typing Indicators:** Shows when a friend is actively typing a message.
*   **Read Receipts:** Indicates when a message has been viewed by the recipient.
*   **Bitmoji Integration:** Personalized avatars used in chats and on the Snap Map.
*   **Chat Wallpapers:** Customization options for chat backgrounds (Snapchat+ feature).

## 2. Snap Map Location Sharing Features

Snap Map allows users to share their real-time location with friends, fostering a sense of connection and enabling meet-ups. Key features include:

*   **Location Sharing Control:** Users have granular control over who can see their location:
    *   **Ghost Mode:** Location is hidden from everyone.
    *   **My Friends:** Share location with all friends.
    *   **Only These Friends:** Share location with a select group of friends.
    *   **Friends Except...:** Share location with all friends except specific ones.
*   **Live Location Sharing:** Users can share their live location for a limited time (e.g., 15 minutes, 1 hour, 8 hours) with specific friends, which updates even if the app is closed. This is distinct from the general Snap Map location which updates when the app is open.
*   **Bitmoji on Map:** User's Bitmoji appears on the map at their location, often showing their activity (e.g., sleeping, driving).
*   **Location-Based Content:** Discover Snaps from events or popular locations nearby.
*   **Privacy and Safety Reminders:** Snapchat emphasizes user control over location data and provides safety guidelines.

## 3. Implementation Considerations for Spaktok

To achieve 90% similarity with Snapchat's chat and location features, Spaktok should prioritize:

*   **Ephemeral Messaging:** Implementing a mechanism for messages to disappear after viewing or a set duration.
*   **Rich Media Sharing:** Supporting text, images, videos, and potentially audio notes within chat.
*   **Real-time Communication:** Integrating voice and video call capabilities.
*   **Interactive Elements:** Adding support for stickers and potentially custom emojis.
*   **Location Sharing with Controls:** Developing a map feature where users can share their real-time location with friends, with clear privacy settings similar to Snap Map.
*   **Friend-Based Access:** Ensuring that location sharing and chat functionalities are primarily accessible between established friends.

This research will guide the data model design, Firestore security rules, Cloud Functions logic, and Flutter UI development in subsequent phases.
