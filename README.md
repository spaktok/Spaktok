# Spaktok Application

<div align="center">

![Spaktok Logo](https://img.shields.io/badge/Spaktok-v1.0.0-purple?style=for-the-badge&logo=flutter)
![Flutter](https://img.shields.io/badge/Flutter-3.16.0-blue?style=for-the-badge&logo=flutter)
![Firebase](https://img.shields.io/badge/Firebase-Integrated-orange?style=for-the-badge&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A cutting-edge social media platform with live streaming, stories, reels, and advanced camera features**

</div>

---

## 📱 About Spaktok

Spaktok is a modern, feature-rich social media application built with Flutter, offering a unique blend of content creation, live streaming, and social interaction capabilities. Inspired by the best features of TikTok and Snapchat, but with a unique design and innovative features.

### ✨ Key Highlights

- 🎥 **HD Live Streaming** with Agora RTC integration
- 📸 **Advanced Camera** with professional filters and effects
- 🎭 **AR Filters & Stickers** for creative content
- 💝 **Virtual Gifts System** with in-app currency
- 🌍 **Multi-language Support** (Currently disabled due to `AppLocalizations` issues)
- 🔒 **Privacy & Security** focused design
- 📊 **Real-time Analytics** and engagement metrics
- 🎨 **Modern UI/UX** with dark theme

## Project Goal

The primary goal of this project is to develop and implement all features for the Spaktok application, complete Firebase, Agora, and Stripe configurations, and finalize documentation. Android SDK setup has been temporarily deferred.

## Project Status

This project is under active development. The architecture is complex and contains numerous features and systems.

For a detailed and authoritative overview of the project's architecture, feature list, and the implementation status of each system, please refer to the following document:

**[Backend Implementation Summary V2](BACKEND_IMPLEMENTATION_SUMMARY_V2.md)**

This summary serves as the single source of truth for the project's progress.

## 🚀 Getting Started

This guide will help you set up and run the Spaktok project on your local machine.

### Prerequisites

*   [Flutter SDK](https://flutter.dev/docs/get-started/install) installed and configured.
*   [Android Studio](https://developer.android.com/studio) (for Android development) or [Xcode](https://developer.apple.com/xcode/) (for iOS development) - *Note: Android SDK setup is currently deferred.*
*   [Firebase CLI](https://firebase.google.com/docs/cli) installed.
*   Access to a Firebase project.
*   Agora App ID and temporary token.
*   Stripe Secret Key.

### Setup and Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/spaktok/Spaktok.git
    cd Spaktok
    ```

2.  **Install Flutter dependencies**:

    ```bash
    flutter pub get
    ```

3.  **Configure Firebase**: Ensure `firebase_options.dart` is correctly generated and `google-services.json` (for Android) and `GoogleService-Info.plist` (for iOS) are in their respective directories.

4.  **Configure Agora**: The App ID is already set in `lib/screens/live_stream_screen.dart`. Ensure a valid Agora token is used for production.

5.  **Configure Stripe**: Set your Stripe Secret Key as an environment variable in the `backend/.env` file:

    ```
    STRIPE_SECRET_KEY=your_stripe_secret_key_here
    ```

6.  **Build the application** (e.g., for web):

    ```bash
    flutter build web
    ```

### Running the Application

To run the application on a connected device (emulator or physical device):

```bash
flutter run
```

To run the application on the web:

```bash
flutter run -d web
```

To run the application on Linux desktop (after installing prerequisites like `cmake`, `ninja-build`, `clang`, `libgtk-3-dev`):

```bash
flutter run -d linux
```

## Future Work

*   Revisit and resolve Android SDK setup issues.
*   Implement proper internationalization using `AppLocalizations`.
*   Further testing and optimization of all features.
*   Deployment to production environments.

## Contributing

We welcome contributions! Please read `CONTRIBUTING.md` for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

**Author**: M
