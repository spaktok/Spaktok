import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for macos - ',
        );
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - ',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - ',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform - ',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAxG4sI_RO6IN8kItCTeXJkFb9zFeEnQ_M',
    appId: '1:603021639103:web:111732828caff545ab50a',
    messagingSenderId: '603021639103',
    projectId: 'spaktok-e7866',
    authDomain: 'spaktok-e7866.firebaseapp.com',
    storageBucket: 'spaktok-e7866.appspot.com',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAxG4sI_RO6IN8kItCTeXJkFb9zFeEnQ_M',
    appId: '1:603021639103:android:d911732828caff545ab50a',
    messagingSenderId: '603021639103',
    projectId: 'spaktok-e7866',
    storageBucket: 'spaktok-e7866.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyAxG4sI_RO6IN8kItCTeXJkFb9zFeEnQ_M',
    appId: '1:603021639103:ios:d911732828caff545ab50a',
    messagingSenderId: '603021639103',
    projectId: 'spaktok-e7866',
    storageBucket: 'spaktok-e7866.appspot.com',
    iosBundleId: 'com.example.frontend',
  );
}

