// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Guarani (`gn`).
class AppLocalizationsGn extends AppLocalizations {
  AppLocalizationsGn([String locale = 'gn']) : super(locale);

  @override
  String get appTitle => 'Spaktok';

  @override
  String get liveStreamTitle => 'Spaktok Live Stream';

  @override
  String get muteUnmuteAudio => 'Mute/Unmute Audio';

  @override
  String get stopStartVideo => 'Stop/Start Video';

  @override
  String get leaveStream => 'Leave Stream';

  @override
  String get waitingForParticipants => 'Waiting for participants to join';

  @override
  String chatWith(Object receiverName) {
    return 'Chat with $receiverName';
  }

  @override
  String get enterMessage => 'Enter message';

  @override
  String get storiesTitle => 'Stories';

  @override
  String get noStoriesAvailable => 'No stories available.';

  @override
  String get uploadStoryNotImplemented =>
      'Upload story functionality not yet implemented.';

  @override
  String get reelsTitle => 'Reels';

  @override
  String get noReelsAvailable => 'No reels available.';

  @override
  String get videoPlayerPlaceholder => 'Video Player Placeholder';

  @override
  String likesCount(Object count) {
    return '$count Likes';
  }

  @override
  String commentsCount(Object count) {
    return '$count Comments';
  }

  @override
  String get uploadReelNotImplemented =>
      'Upload reel functionality not yet implemented.';

  @override
  String get explore => 'Explore';

  @override
  String get noTrendingContent => 'No trending content available.';

  @override
  String get error => 'Error';
}
