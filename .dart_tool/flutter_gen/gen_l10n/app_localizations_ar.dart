import 'app_localizations.dart';

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
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
  }

  @override
  String commentsCount(Object count) {
    return '$count تعليق';
  }

  @override
  String get uploadReelNotImplemented => 'لم يتم تنفيذ وظيفة تحميل مقطع ريلز بعد.';
}
