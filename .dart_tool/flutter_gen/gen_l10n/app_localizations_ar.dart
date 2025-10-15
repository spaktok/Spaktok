import 'app_localizations.dart';

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
<<<<<<< HEAD
  String get appTitle => 'سباكتوك';

  @override
  String get liveStreamTitle => 'بث سباكتوك المباشر';

  @override
  String get muteUnmuteAudio => 'كتم/إلغاء كتم الصوت';

  @override
  String get stopStartVideo => 'إيقاف/بدء الفيديو';

  @override
  String get leaveStream => 'مغادرة البث';

  @override
  String get waitingForParticipants => 'في انتظار انضمام المشاركين';

  @override
  String chatWith(Object receiverName) {
    return 'الدردشة مع $receiverName';
  }

  @override
  String get enterMessage => 'أدخل رسالة';

  @override
  String get storiesTitle => 'القصص';

  @override
  String get noStoriesAvailable => 'لا توجد قصص متاحة.';

  @override
  String get uploadStoryNotImplemented => 'لم يتم تنفيذ وظيفة تحميل القصة بعد.';

  @override
  String get reelsTitle => 'مقاطع ريلز';

  @override
  String get noReelsAvailable => 'لا توجد مقاطع ريلز متاحة.';

  @override
  String get videoPlayerPlaceholder => 'عنصر نائب لمشغل الفيديو';

  @override
  String likesCount(Object count) {
    return '$count إعجاب';
=======
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
  String get uploadStoryNotImplemented => 'Upload story functionality not yet implemented.';

  @override
  String get reelsTitle => 'Reels';

  @override
  String get noReelsAvailable => 'No reels available.';

  @override
  String get videoPlayerPlaceholder => 'Video Player Placeholder';

  @override
  String likesCount(Object count) {
    return '$count Likes';
>>>>>>> feature/full-implementation
  }

  @override
  String commentsCount(Object count) {
<<<<<<< HEAD
    return '$count تعليق';
  }

  @override
  String get uploadReelNotImplemented => 'لم يتم تنفيذ وظيفة تحميل مقطع ريلز بعد.';
=======
    return '$count Comments';
  }

  @override
  String get uploadReelNotImplemented => 'Upload reel functionality not yet implemented.';

  @override
  String get explore => 'Explore';

  @override
  String get noTrendingContent => 'No trending content available.';

  @override
  String get error => 'Error';
>>>>>>> feature/full-implementation
}
