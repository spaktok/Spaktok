import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

const appId = "a41807bba5c144b5b8e1fd5ee711707b"; // استبدل بمعرف تطبيق Agora الخاص بك
const token = "007eJxTYEiJ+bXuRdb2/+r1U3Kus0YXtponyjxlajd7rLFV9PmSjrMKDIkmhhYG5klJiabJhiYmSaZJFqmGaSmmqanmhobmQIn09HsZDYGMDGn7c5gYGSAQxGdl8E3MKy1mYAAAut8gzQ=="; // استبدل بالرمز المميز المؤقت الخاص بك (للاختبار)
const channel = "test_channel";

class LiveStreamScreen extends StatefulWidget {
  const LiveStreamScreen({Key? key}) : super(key: key);

  @override
  State<LiveStreamScreen> createState() => _LiveStreamScreenState();
}

class _LiveStreamScreenState extends State<LiveStreamScreen> {
  int? _localUid = 0; // معرف المستخدم المحلي (يمكن أن يكون أي رقم غير صفري)
  List<int> _remoteUids = []; // قائمة بمعرفات المستخدمين البعيدين
  bool _localUserJoined = false; // ما إذا كان المستخدم المحلي قد انضم
  late RtcEngine _engine; // محرك RTC

  @override
  void initState() {
    super.initState();
    initAgora();
  }

  Future<void> initAgora() async {
    // طلب أذونات الكاميرا والميكروفون
    await [Permission.microphone, Permission.camera].request();

    // إنشاء محرك RTC
    _engine = createAgoraRtcEngine();
    await _engine.initialize(const RtcEngineContext(appId: appId));

    _engine.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          debugPrint("local user ${connection.localUid} joined");
          setState(() {
            _localUserJoined = true;
            _localUid = connection.localUid; // تحديث معرف المستخدم المحلي
          });
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          debugPrint("remote user $remoteUid joined");
          setState(() {
            _remoteUids.add(remoteUid); // إضافة المستخدم البعيد إلى القائمة
          });
        },
        onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
          debugPrint("remote user $remoteUid left channel");
          setState(() {
            _remoteUids.remove(remoteUid); // إزالة المستخدم البعيد من القائمة
          });
        },
        onTokenPrivilegeWillExpire: (RtcConnection connection, String token) {
          debugPrint("[onTokenPrivilegeWillExpire] connection: ${connection.toJson()}, token: $token");
        },
        onError: (ErrorCodeType err, String msg) {
          debugPrint("[onError] err: $err, msg: $msg");
        },
      ),
    );

    await _engine.enableVideo();
    await _engine.startPreview();

    await _engine.joinChannel(
      token: token,
      channelId: channel,
      uid: _localUid, // استخدام معرف المستخدم المحلي
      options: const ChannelMediaOptions(),
    );
  }

  @override
  void dispose() {
    super.dispose();
    _dispose();
  }

  Future<void> _dispose() async {
    await _engine.leaveChannel();
    await _engine.release();
  }

  // عرض الفيديو المحلي
  Widget _localVideoWidget() {
    if (_localUserJoined) {
      return AgoraVideoView(
        controller: VideoViewController(
          rtcEngine: _engine,
          canvas: VideoCanvas(uid: _localUid),
        ),
      );
    } else {
      return const Center(child: CircularProgressIndicator());
    }
  }

  // عرض الفيديو البعيد
  Widget _remoteVideoWidget(int remoteUid) {
    return AgoraVideoView(
      controller: VideoViewController.remote(
        rtcEngine: _engine,
        canvas: VideoCanvas(uid: remoteUid),
        connection: const RtcConnection(channelId: channel),
      ),
    );
  }

  // بناء عرض الفيديو لجميع المشاركين
  Widget _buildVideoLayout() {
    final List<Widget> videoWidgets = [];

    // إضافة الفيديو المحلي
    if (_localUserJoined) {
      videoWidgets.add(Expanded(child: _localVideoWidget()));
    }

    // إضافة الفيديوهات البعيدة
    for (int uid in _remoteUids) {
      videoWidgets.add(Expanded(child: _remoteVideoWidget(uid)));
    }

    if (videoWidgets.isEmpty) {
      return const Center(
        child: Text(
          AppLocalizations.of(context)!.waitingForParticipants,
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white, fontSize: 18),
        ),
      );
    } else if (videoWidgets.length == 1) {
      return videoWidgets.first; // عرض الفيديو الوحيد بملء الشاشة
    } else {
      // عرض متعدد المشاركين (2-4)
      return GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2, // 2 عمود لـ 2 أو 4 مشاركين
          childAspectRatio: 1.0,
          mainAxisSpacing: 10.0,
          crossAxisSpacing: 10.0,
        ),
        itemCount: videoWidgets.length,
        itemBuilder: (BuildContext context, int index) {
          return videoWidgets[index];
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(AppLocalizations.of(context)!.liveStreamTitle)),
      body: Container(
        color: Colors.black, // خلفية سوداء للفيديو
        child: Stack(
          children: [
            Center(
              child: _buildVideoLayout(),
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 20.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: () async {
                        // تبديل كتم الصوت
                        bool muted = await _engine.isLocalAudioMuted();
                        await _engine.muteLocalAudioStream(!muted);
                        setState(() {}); // لتحديث حالة الزر
                      },
                      child: Text(AppLocalizations.of(context)!.muteUnmuteAudio),
                    ),
                    const SizedBox(width: 20),
                    ElevatedButton(
                      onPressed: () async {
                        // تبديل إيقاف/تشغيل الفيديو
                        // Toggle video on/off
                        await _engine.muteLocalVideoStream(!_localUserJoined);
                        setState(() {}); // لتحديث حالة الزر
                      },
                      child: Text(AppLocalizations.of(context)!.stopStartVideo),
                    ),
                    const SizedBox(width: 20),
                    ElevatedButton(
                      onPressed: () async {
                        await _engine.leaveChannel();
                        Navigator.pop(context);
                      },
                      child: Text(AppLocalizations.of(context)!.leaveStream),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

