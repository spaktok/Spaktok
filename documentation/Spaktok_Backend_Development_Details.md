# Spaktok Backend Development Details (Node.js with Express)

This document details the backend development plan for the Spaktok social media application, leveraging Node.js with Express. It outlines the microservices architecture, technology choices, and API design for various functionalities.

## 1. Backend Architecture: Microservices

The backend will be composed of several independent microservices, each responsible for a specific domain. This approach enhances scalability, fault isolation, and allows for independent deployment and technology choices where appropriate.

```mermaid
graph TD
    A[Client (Flutter)] --> B(API Gateway)
    B --> C(Auth Service)
    B --> D(User Service)
    B --> E(Live Streaming Service)
    B --> F(Chat Service)
    B --> G(Gift & Payment Service)
    B --> H(Content Service)
    B --> I(Notification Service)

    C --> J[Firebase Admin SDK]
    D --> K[PostgreSQL]
    E --> L[Agora/WebRTC SDK]
    F --> M[MongoDB & Redis]
    G --> N[Stripe/PayPal SDK]
    H --> O[Firebase Storage/AWS S3]
    I --> P[Firebase Admin SDK (FCM)]
```

## 2. Core Technologies

-   **Language**: JavaScript (Node.js)
-   **Framework**: Express.js
-   **Databases**: PostgreSQL (relational), MongoDB (document), Redis (in-memory/caching)
-   **Authentication**: Firebase Admin SDK
-   **Real-time Communication**: WebSockets (Socket.IO or native ws)
-   **Containerization**: Docker

## 3. Microservice Breakdown

### 3.1. API Gateway Service

-   **Purpose**: Acts as a single entry point for all client requests, routing them to the appropriate microservice.
-   **Responsibilities**: Request validation, authentication token verification, rate limiting, logging, load balancing.
-   **Technology**: Node.js with Express.js.

### 3.2. Authentication Service

-   **Purpose**: Manages user authentication and authorization.
-   **Integration**: Firebase Admin SDK to verify Firebase-issued tokens.
-   **Endpoints**: `/auth/verify-token`, `/auth/refresh-token`.

### 3.3. User Service

-   **Purpose**: Manages user profiles, relationships (followers/following), and user-specific data.
-   **Database**: PostgreSQL for user data, ensuring data integrity and complex querying.
-   **Endpoints**: `/users/:id`, `/users/:id/followers`, `/users/:id/following`, `/users/search`.

### 3.4. Live Streaming Service

-   **Purpose**: Manages live stream sessions, participants, and stream metadata.
-   **Integration**: Agora SDK for managing channels, tokens, and webhooks for stream events.
-   **Endpoints**: `/streams/create`, `/streams/:id/join`, `/streams/:id/leave`, `/streams/:id/end`.
-   **Real-time**: WebSockets for signaling and real-time updates on stream status and viewer counts.

### 3.5. Chat Service

-   **Purpose**: Handles real-time messaging, voice/video call signaling, and message persistence.
-   **Databases**: MongoDB for chat history, Redis for real-time message caching and pub/sub.
-   **Endpoints**: `/chat/history/:room_id`, `/chat/message` (via WebSocket).
-   **Real-time**: WebSockets (Socket.IO) for instant message delivery, disappearing message logic.

### 3.6. Gift & Payment Service

-   **Purpose**: Manages virtual gift purchases, sending, revenue sharing, and payment processing.
-   **Integration**: Stripe, PayPal, or other payment gateway SDKs.
-   **Endpoints**: `/gifts/purchase`, `/gifts/send`, `/payments/webhook`, `/transactions`.
-   **Logic**: Implements the 40/60 revenue split logic and multi-currency conversion.

### 3.7. Content Service (Stories & Reels)

-   **Purpose**: Manages the upload, storage, and retrieval of short-form video (Reels) and ephemeral content (Stories).
-   **Storage**: Firebase Storage or AWS S3 for media files.
-   **Database**: MongoDB for content metadata (captions, likes, comments).
-   **Endpoints**: `/content/upload`, `/content/stories`, `/content/reels/:id`, `/content/reels/:id/like`.

### 3.8. Notification Service

-   **Purpose**: Sends push notifications to users for various events.
-   **Integration**: Firebase Cloud Messaging (FCM) via Firebase Admin SDK.
-   **Endpoints**: Internal API for other services to trigger notifications.

## 4. API Design Principles

-   **RESTful APIs**: For most data operations.
-   **WebSockets**: For real-time functionalities (chat, live streaming updates).
-   **JSON**: As the primary data exchange format.
-   **Versioning**: To ensure backward compatibility.
-   **Security**: JWT for stateless authentication, OAuth2 for authorization.

## 5. Development Workflow

-   **Containerization**: Each microservice will be containerized using Docker.
-   **Local Development**: Use `docker-compose` for local setup and testing of interconnected services.
-   **CI/CD**: Automated pipelines for testing, building Docker images, and deploying to a cloud environment.

## 6. Future Considerations

-   **GraphQL**: For more efficient data fetching from the frontend.
-   **Serverless Functions**: For specific, event-driven tasks (e.g., image processing after upload).
-   **Load Balancing & Scaling**: Implement robust load balancing and auto-scaling for high traffic. 
