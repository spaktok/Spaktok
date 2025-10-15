import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

<<<<<<< HEAD
import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';
=======
import 'app_localizations_aa.dart';
import 'app_localizations_ab.dart';
import 'app_localizations_ae.dart';
import 'app_localizations_af.dart';
import 'app_localizations_ak.dart';
import 'app_localizations_am.dart';
import 'app_localizations_an.dart';
import 'app_localizations_ar.dart';
import 'app_localizations_as.dart';
import 'app_localizations_av.dart';
import 'app_localizations_ay.dart';
import 'app_localizations_az.dart';
import 'app_localizations_ba.dart';
import 'app_localizations_be.dart';
import 'app_localizations_bg.dart';
import 'app_localizations_bh.dart';
import 'app_localizations_bi.dart';
import 'app_localizations_bm.dart';
import 'app_localizations_bn.dart';
import 'app_localizations_bo.dart';
import 'app_localizations_br.dart';
import 'app_localizations_bs.dart';
import 'app_localizations_ca.dart';
import 'app_localizations_ce.dart';
import 'app_localizations_ch.dart';
import 'app_localizations_co.dart';
import 'app_localizations_cr.dart';
import 'app_localizations_cs.dart';
import 'app_localizations_cu.dart';
import 'app_localizations_cv.dart';
import 'app_localizations_cy.dart';
import 'app_localizations_da.dart';
import 'app_localizations_de.dart';
import 'app_localizations_dv.dart';
import 'app_localizations_dz.dart';
import 'app_localizations_ee.dart';
import 'app_localizations_el.dart';
import 'app_localizations_en.dart';
import 'app_localizations_eo.dart';
import 'app_localizations_es.dart';
import 'app_localizations_et.dart';
import 'app_localizations_eu.dart';
import 'app_localizations_fa.dart';
import 'app_localizations_ff.dart';
import 'app_localizations_fi.dart';
import 'app_localizations_fj.dart';
import 'app_localizations_fo.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_fy.dart';
import 'app_localizations_ga.dart';
import 'app_localizations_gd.dart';
import 'app_localizations_gl.dart';
import 'app_localizations_gn.dart';
import 'app_localizations_gu.dart';
import 'app_localizations_gv.dart';
import 'app_localizations_ha.dart';
import 'app_localizations_he.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_ho.dart';
import 'app_localizations_hr.dart';
import 'app_localizations_ht.dart';
import 'app_localizations_hu.dart';
import 'app_localizations_hy.dart';
import 'app_localizations_hz.dart';
import 'app_localizations_ia.dart';
import 'app_localizations_id.dart';
import 'app_localizations_ie.dart';
import 'app_localizations_ig.dart';
import 'app_localizations_ii.dart';
import 'app_localizations_ik.dart';
import 'app_localizations_io.dart';
import 'app_localizations_is.dart';
import 'app_localizations_it.dart';
import 'app_localizations_iu.dart';
import 'app_localizations_ja.dart';
import 'app_localizations_jv.dart';
import 'app_localizations_ka.dart';
import 'app_localizations_kg.dart';
import 'app_localizations_ki.dart';
import 'app_localizations_kj.dart';
import 'app_localizations_kk.dart';
import 'app_localizations_kl.dart';
import 'app_localizations_km.dart';
import 'app_localizations_kn.dart';
import 'app_localizations_ko.dart';
import 'app_localizations_kr.dart';
import 'app_localizations_ks.dart';
import 'app_localizations_ku.dart';
import 'app_localizations_kv.dart';
import 'app_localizations_kw.dart';
import 'app_localizations_ky.dart';
import 'app_localizations_la.dart';
import 'app_localizations_lb.dart';
import 'app_localizations_lg.dart';
import 'app_localizations_li.dart';
import 'app_localizations_ln.dart';
import 'app_localizations_lo.dart';
import 'app_localizations_lt.dart';
import 'app_localizations_lu.dart';
import 'app_localizations_lv.dart';
import 'app_localizations_mg.dart';
import 'app_localizations_mh.dart';
import 'app_localizations_mi.dart';
import 'app_localizations_mk.dart';
import 'app_localizations_ml.dart';
import 'app_localizations_mn.dart';
import 'app_localizations_mr.dart';
import 'app_localizations_ms.dart';
import 'app_localizations_mt.dart';
import 'app_localizations_my.dart';
import 'app_localizations_na.dart';
import 'app_localizations_nb.dart';
import 'app_localizations_nd.dart';
import 'app_localizations_ne.dart';
import 'app_localizations_ng.dart';
import 'app_localizations_nl.dart';
import 'app_localizations_nn.dart';
import 'app_localizations_no.dart';
import 'app_localizations_nr.dart';
import 'app_localizations_nv.dart';
import 'app_localizations_ny.dart';
import 'app_localizations_oc.dart';
import 'app_localizations_oj.dart';
import 'app_localizations_om.dart';
import 'app_localizations_or.dart';
import 'app_localizations_os.dart';
import 'app_localizations_pa.dart';
import 'app_localizations_pi.dart';
import 'app_localizations_pl.dart';
import 'app_localizations_ps.dart';
import 'app_localizations_pt.dart';
import 'app_localizations_qu.dart';
import 'app_localizations_rm.dart';
import 'app_localizations_rn.dart';
import 'app_localizations_ro.dart';
import 'app_localizations_ru.dart';
import 'app_localizations_rw.dart';
import 'app_localizations_sa.dart';
import 'app_localizations_sc.dart';
import 'app_localizations_sd.dart';
import 'app_localizations_se.dart';
import 'app_localizations_sg.dart';
import 'app_localizations_si.dart';
import 'app_localizations_sk.dart';
import 'app_localizations_sl.dart';
import 'app_localizations_sm.dart';
import 'app_localizations_sn.dart';
import 'app_localizations_so.dart';
import 'app_localizations_sq.dart';
import 'app_localizations_sr.dart';
import 'app_localizations_ss.dart';
import 'app_localizations_st.dart';
import 'app_localizations_su.dart';
import 'app_localizations_sv.dart';
import 'app_localizations_sw.dart';
import 'app_localizations_ta.dart';
import 'app_localizations_te.dart';
import 'app_localizations_tg.dart';
import 'app_localizations_th.dart';
import 'app_localizations_ti.dart';
import 'app_localizations_tk.dart';
import 'app_localizations_tl.dart';
import 'app_localizations_tn.dart';
import 'app_localizations_to.dart';
import 'app_localizations_tr.dart';
import 'app_localizations_ts.dart';
import 'app_localizations_tt.dart';
import 'app_localizations_tw.dart';
import 'app_localizations_ty.dart';
import 'app_localizations_ug.dart';
import 'app_localizations_uk.dart';
import 'app_localizations_ur.dart';
import 'app_localizations_uz.dart';
import 'app_localizations_ve.dart';
import 'app_localizations_vi.dart';
import 'app_localizations_vo.dart';
import 'app_localizations_wa.dart';
import 'app_localizations_wo.dart';
import 'app_localizations_xh.dart';
import 'app_localizations_yi.dart';
import 'app_localizations_yo.dart';
import 'app_localizations_za.dart';
import 'app_localizations_zh.dart';
import 'app_localizations_zu.dart';
>>>>>>> feature/full-implementation

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'gen_l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale) : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
<<<<<<< HEAD
    Locale('ar'),
    Locale('en')
=======
    Locale('aa'),
    Locale('ab'),
    Locale('ae'),
    Locale('af'),
    Locale('ak'),
    Locale('am'),
    Locale('an'),
    Locale('ar'),
    Locale('as'),
    Locale('av'),
    Locale('ay'),
    Locale('az'),
    Locale('ba'),
    Locale('be'),
    Locale('bg'),
    Locale('bh'),
    Locale('bi'),
    Locale('bm'),
    Locale('bn'),
    Locale('bo'),
    Locale('br'),
    Locale('bs'),
    Locale('ca'),
    Locale('ce'),
    Locale('ch'),
    Locale('co'),
    Locale('cr'),
    Locale('cs'),
    Locale('cu'),
    Locale('cv'),
    Locale('cy'),
    Locale('da'),
    Locale('de'),
    Locale('dv'),
    Locale('dz'),
    Locale('ee'),
    Locale('el'),
    Locale('en'),
    Locale('eo'),
    Locale('es'),
    Locale('et'),
    Locale('eu'),
    Locale('fa'),
    Locale('ff'),
    Locale('fi'),
    Locale('fj'),
    Locale('fo'),
    Locale('fr'),
    Locale('fy'),
    Locale('ga'),
    Locale('gd'),
    Locale('gl'),
    Locale('gn'),
    Locale('gu'),
    Locale('gv'),
    Locale('ha'),
    Locale('he'),
    Locale('hi'),
    Locale('ho'),
    Locale('hr'),
    Locale('ht'),
    Locale('hu'),
    Locale('hy'),
    Locale('hz'),
    Locale('ia'),
    Locale('id'),
    Locale('ie'),
    Locale('ig'),
    Locale('ii'),
    Locale('ik'),
    Locale('io'),
    Locale('is'),
    Locale('it'),
    Locale('iu'),
    Locale('ja'),
    Locale('jv'),
    Locale('ka'),
    Locale('kg'),
    Locale('ki'),
    Locale('kj'),
    Locale('kk'),
    Locale('kl'),
    Locale('km'),
    Locale('kn'),
    Locale('ko'),
    Locale('kr'),
    Locale('ks'),
    Locale('ku'),
    Locale('kv'),
    Locale('kw'),
    Locale('ky'),
    Locale('la'),
    Locale('lb'),
    Locale('lg'),
    Locale('li'),
    Locale('ln'),
    Locale('lo'),
    Locale('lt'),
    Locale('lu'),
    Locale('lv'),
    Locale('mg'),
    Locale('mh'),
    Locale('mi'),
    Locale('mk'),
    Locale('ml'),
    Locale('mn'),
    Locale('mr'),
    Locale('ms'),
    Locale('mt'),
    Locale('my'),
    Locale('na'),
    Locale('nb'),
    Locale('nd'),
    Locale('ne'),
    Locale('ng'),
    Locale('nl'),
    Locale('nn'),
    Locale('no'),
    Locale('nr'),
    Locale('nv'),
    Locale('ny'),
    Locale('oc'),
    Locale('oj'),
    Locale('om'),
    Locale('or'),
    Locale('os'),
    Locale('pa'),
    Locale('pi'),
    Locale('pl'),
    Locale('ps'),
    Locale('pt'),
    Locale('qu'),
    Locale('rm'),
    Locale('rn'),
    Locale('ro'),
    Locale('ru'),
    Locale('rw'),
    Locale('sa'),
    Locale('sc'),
    Locale('sd'),
    Locale('se'),
    Locale('sg'),
    Locale('si'),
    Locale('sk'),
    Locale('sl'),
    Locale('sm'),
    Locale('sn'),
    Locale('so'),
    Locale('sq'),
    Locale('sr'),
    Locale('ss'),
    Locale('st'),
    Locale('su'),
    Locale('sv'),
    Locale('sw'),
    Locale('ta'),
    Locale('te'),
    Locale('tg'),
    Locale('th'),
    Locale('ti'),
    Locale('tk'),
    Locale('tl'),
    Locale('tn'),
    Locale('to'),
    Locale('tr'),
    Locale('ts'),
    Locale('tt'),
    Locale('tw'),
    Locale('ty'),
    Locale('ug'),
    Locale('uk'),
    Locale('ur'),
    Locale('uz'),
    Locale('ve'),
    Locale('vi'),
    Locale('vo'),
    Locale('wa'),
    Locale('wo'),
    Locale('xh'),
    Locale('yi'),
    Locale('yo'),
    Locale('za'),
    Locale('zh'),
    Locale('zu')
>>>>>>> feature/full-implementation
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Spaktok'**
  String get appTitle;

  /// No description provided for @liveStreamTitle.
  ///
  /// In en, this message translates to:
  /// **'Spaktok Live Stream'**
  String get liveStreamTitle;

  /// No description provided for @muteUnmuteAudio.
  ///
  /// In en, this message translates to:
  /// **'Mute/Unmute Audio'**
  String get muteUnmuteAudio;

  /// No description provided for @stopStartVideo.
  ///
  /// In en, this message translates to:
  /// **'Stop/Start Video'**
  String get stopStartVideo;

  /// No description provided for @leaveStream.
  ///
  /// In en, this message translates to:
  /// **'Leave Stream'**
  String get leaveStream;

  /// No description provided for @waitingForParticipants.
  ///
  /// In en, this message translates to:
  /// **'Waiting for participants to join'**
  String get waitingForParticipants;

  /// No description provided for @chatWith.
  ///
  /// In en, this message translates to:
  /// **'Chat with {receiverName}'**
  String chatWith(Object receiverName);

  /// No description provided for @enterMessage.
  ///
  /// In en, this message translates to:
  /// **'Enter message'**
  String get enterMessage;

  /// No description provided for @storiesTitle.
  ///
  /// In en, this message translates to:
  /// **'Stories'**
  String get storiesTitle;

  /// No description provided for @noStoriesAvailable.
  ///
  /// In en, this message translates to:
  /// **'No stories available.'**
  String get noStoriesAvailable;

  /// No description provided for @uploadStoryNotImplemented.
  ///
  /// In en, this message translates to:
  /// **'Upload story functionality not yet implemented.'**
  String get uploadStoryNotImplemented;

  /// No description provided for @reelsTitle.
  ///
  /// In en, this message translates to:
  /// **'Reels'**
  String get reelsTitle;

  /// No description provided for @noReelsAvailable.
  ///
  /// In en, this message translates to:
  /// **'No reels available.'**
  String get noReelsAvailable;

  /// No description provided for @videoPlayerPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Video Player Placeholder'**
  String get videoPlayerPlaceholder;

  /// No description provided for @likesCount.
  ///
  /// In en, this message translates to:
  /// **'{count} Likes'**
  String likesCount(Object count);

  /// No description provided for @commentsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} Comments'**
  String commentsCount(Object count);

  /// No description provided for @uploadReelNotImplemented.
  ///
  /// In en, this message translates to:
  /// **'Upload reel functionality not yet implemented.'**
  String get uploadReelNotImplemented;
<<<<<<< HEAD
=======

  /// No description provided for @explore.
  ///
  /// In en, this message translates to:
  /// **'Explore'**
  String get explore;

  /// No description provided for @noTrendingContent.
  ///
  /// In en, this message translates to:
  /// **'No trending content available.'**
  String get noTrendingContent;

  /// No description provided for @error.
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;
>>>>>>> feature/full-implementation
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
<<<<<<< HEAD
  bool isSupported(Locale locale) => <String>['ar', 'en'].contains(locale.languageCode);
=======
  bool isSupported(Locale locale) => <String>['aa', 'ab', 'ae', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az', 'ba', 'be', 'bg', 'bh', 'bi', 'bm', 'bn', 'bo', 'br', 'bs', 'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy', 'da', 'de', 'dv', 'dz', 'ee', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy', 'ga', 'gd', 'gl', 'gn', 'gu', 'gv', 'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz', 'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu', 'ja', 'jv', 'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky', 'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv', 'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my', 'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny', 'oc', 'oj', 'om', 'or', 'os', 'pa', 'pi', 'pl', 'ps', 'pt', 'qu', 'rm', 'rn', 'ro', 'ru', 'rw', 'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty', 'ug', 'uk', 'ur', 'uz', 've', 'vi', 'vo', 'wa', 'wo', 'xh', 'yi', 'yo', 'za', 'zh', 'zu'].contains(locale.languageCode);
>>>>>>> feature/full-implementation

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {


  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
<<<<<<< HEAD
    case 'ar': return AppLocalizationsAr();
    case 'en': return AppLocalizationsEn();
=======
    case 'aa': return AppLocalizationsAa();
    case 'ab': return AppLocalizationsAb();
    case 'ae': return AppLocalizationsAe();
    case 'af': return AppLocalizationsAf();
    case 'ak': return AppLocalizationsAk();
    case 'am': return AppLocalizationsAm();
    case 'an': return AppLocalizationsAn();
    case 'ar': return AppLocalizationsAr();
    case 'as': return AppLocalizationsAs();
    case 'av': return AppLocalizationsAv();
    case 'ay': return AppLocalizationsAy();
    case 'az': return AppLocalizationsAz();
    case 'ba': return AppLocalizationsBa();
    case 'be': return AppLocalizationsBe();
    case 'bg': return AppLocalizationsBg();
    case 'bh': return AppLocalizationsBh();
    case 'bi': return AppLocalizationsBi();
    case 'bm': return AppLocalizationsBm();
    case 'bn': return AppLocalizationsBn();
    case 'bo': return AppLocalizationsBo();
    case 'br': return AppLocalizationsBr();
    case 'bs': return AppLocalizationsBs();
    case 'ca': return AppLocalizationsCa();
    case 'ce': return AppLocalizationsCe();
    case 'ch': return AppLocalizationsCh();
    case 'co': return AppLocalizationsCo();
    case 'cr': return AppLocalizationsCr();
    case 'cs': return AppLocalizationsCs();
    case 'cu': return AppLocalizationsCu();
    case 'cv': return AppLocalizationsCv();
    case 'cy': return AppLocalizationsCy();
    case 'da': return AppLocalizationsDa();
    case 'de': return AppLocalizationsDe();
    case 'dv': return AppLocalizationsDv();
    case 'dz': return AppLocalizationsDz();
    case 'ee': return AppLocalizationsEe();
    case 'el': return AppLocalizationsEl();
    case 'en': return AppLocalizationsEn();
    case 'eo': return AppLocalizationsEo();
    case 'es': return AppLocalizationsEs();
    case 'et': return AppLocalizationsEt();
    case 'eu': return AppLocalizationsEu();
    case 'fa': return AppLocalizationsFa();
    case 'ff': return AppLocalizationsFf();
    case 'fi': return AppLocalizationsFi();
    case 'fj': return AppLocalizationsFj();
    case 'fo': return AppLocalizationsFo();
    case 'fr': return AppLocalizationsFr();
    case 'fy': return AppLocalizationsFy();
    case 'ga': return AppLocalizationsGa();
    case 'gd': return AppLocalizationsGd();
    case 'gl': return AppLocalizationsGl();
    case 'gn': return AppLocalizationsGn();
    case 'gu': return AppLocalizationsGu();
    case 'gv': return AppLocalizationsGv();
    case 'ha': return AppLocalizationsHa();
    case 'he': return AppLocalizationsHe();
    case 'hi': return AppLocalizationsHi();
    case 'ho': return AppLocalizationsHo();
    case 'hr': return AppLocalizationsHr();
    case 'ht': return AppLocalizationsHt();
    case 'hu': return AppLocalizationsHu();
    case 'hy': return AppLocalizationsHy();
    case 'hz': return AppLocalizationsHz();
    case 'ia': return AppLocalizationsIa();
    case 'id': return AppLocalizationsId();
    case 'ie': return AppLocalizationsIe();
    case 'ig': return AppLocalizationsIg();
    case 'ii': return AppLocalizationsIi();
    case 'ik': return AppLocalizationsIk();
    case 'io': return AppLocalizationsIo();
    case 'is': return AppLocalizationsIs();
    case 'it': return AppLocalizationsIt();
    case 'iu': return AppLocalizationsIu();
    case 'ja': return AppLocalizationsJa();
    case 'jv': return AppLocalizationsJv();
    case 'ka': return AppLocalizationsKa();
    case 'kg': return AppLocalizationsKg();
    case 'ki': return AppLocalizationsKi();
    case 'kj': return AppLocalizationsKj();
    case 'kk': return AppLocalizationsKk();
    case 'kl': return AppLocalizationsKl();
    case 'km': return AppLocalizationsKm();
    case 'kn': return AppLocalizationsKn();
    case 'ko': return AppLocalizationsKo();
    case 'kr': return AppLocalizationsKr();
    case 'ks': return AppLocalizationsKs();
    case 'ku': return AppLocalizationsKu();
    case 'kv': return AppLocalizationsKv();
    case 'kw': return AppLocalizationsKw();
    case 'ky': return AppLocalizationsKy();
    case 'la': return AppLocalizationsLa();
    case 'lb': return AppLocalizationsLb();
    case 'lg': return AppLocalizationsLg();
    case 'li': return AppLocalizationsLi();
    case 'ln': return AppLocalizationsLn();
    case 'lo': return AppLocalizationsLo();
    case 'lt': return AppLocalizationsLt();
    case 'lu': return AppLocalizationsLu();
    case 'lv': return AppLocalizationsLv();
    case 'mg': return AppLocalizationsMg();
    case 'mh': return AppLocalizationsMh();
    case 'mi': return AppLocalizationsMi();
    case 'mk': return AppLocalizationsMk();
    case 'ml': return AppLocalizationsMl();
    case 'mn': return AppLocalizationsMn();
    case 'mr': return AppLocalizationsMr();
    case 'ms': return AppLocalizationsMs();
    case 'mt': return AppLocalizationsMt();
    case 'my': return AppLocalizationsMy();
    case 'na': return AppLocalizationsNa();
    case 'nb': return AppLocalizationsNb();
    case 'nd': return AppLocalizationsNd();
    case 'ne': return AppLocalizationsNe();
    case 'ng': return AppLocalizationsNg();
    case 'nl': return AppLocalizationsNl();
    case 'nn': return AppLocalizationsNn();
    case 'no': return AppLocalizationsNo();
    case 'nr': return AppLocalizationsNr();
    case 'nv': return AppLocalizationsNv();
    case 'ny': return AppLocalizationsNy();
    case 'oc': return AppLocalizationsOc();
    case 'oj': return AppLocalizationsOj();
    case 'om': return AppLocalizationsOm();
    case 'or': return AppLocalizationsOr();
    case 'os': return AppLocalizationsOs();
    case 'pa': return AppLocalizationsPa();
    case 'pi': return AppLocalizationsPi();
    case 'pl': return AppLocalizationsPl();
    case 'ps': return AppLocalizationsPs();
    case 'pt': return AppLocalizationsPt();
    case 'qu': return AppLocalizationsQu();
    case 'rm': return AppLocalizationsRm();
    case 'rn': return AppLocalizationsRn();
    case 'ro': return AppLocalizationsRo();
    case 'ru': return AppLocalizationsRu();
    case 'rw': return AppLocalizationsRw();
    case 'sa': return AppLocalizationsSa();
    case 'sc': return AppLocalizationsSc();
    case 'sd': return AppLocalizationsSd();
    case 'se': return AppLocalizationsSe();
    case 'sg': return AppLocalizationsSg();
    case 'si': return AppLocalizationsSi();
    case 'sk': return AppLocalizationsSk();
    case 'sl': return AppLocalizationsSl();
    case 'sm': return AppLocalizationsSm();
    case 'sn': return AppLocalizationsSn();
    case 'so': return AppLocalizationsSo();
    case 'sq': return AppLocalizationsSq();
    case 'sr': return AppLocalizationsSr();
    case 'ss': return AppLocalizationsSs();
    case 'st': return AppLocalizationsSt();
    case 'su': return AppLocalizationsSu();
    case 'sv': return AppLocalizationsSv();
    case 'sw': return AppLocalizationsSw();
    case 'ta': return AppLocalizationsTa();
    case 'te': return AppLocalizationsTe();
    case 'tg': return AppLocalizationsTg();
    case 'th': return AppLocalizationsTh();
    case 'ti': return AppLocalizationsTi();
    case 'tk': return AppLocalizationsTk();
    case 'tl': return AppLocalizationsTl();
    case 'tn': return AppLocalizationsTn();
    case 'to': return AppLocalizationsTo();
    case 'tr': return AppLocalizationsTr();
    case 'ts': return AppLocalizationsTs();
    case 'tt': return AppLocalizationsTt();
    case 'tw': return AppLocalizationsTw();
    case 'ty': return AppLocalizationsTy();
    case 'ug': return AppLocalizationsUg();
    case 'uk': return AppLocalizationsUk();
    case 'ur': return AppLocalizationsUr();
    case 'uz': return AppLocalizationsUz();
    case 've': return AppLocalizationsVe();
    case 'vi': return AppLocalizationsVi();
    case 'vo': return AppLocalizationsVo();
    case 'wa': return AppLocalizationsWa();
    case 'wo': return AppLocalizationsWo();
    case 'xh': return AppLocalizationsXh();
    case 'yi': return AppLocalizationsYi();
    case 'yo': return AppLocalizationsYo();
    case 'za': return AppLocalizationsZa();
    case 'zh': return AppLocalizationsZh();
    case 'zu': return AppLocalizationsZu();
>>>>>>> feature/full-implementation
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.'
  );
}
