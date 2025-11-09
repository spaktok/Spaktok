import 'dart:developer' as dev;
import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

/// Types of mini apps supported in chats.
enum MiniAppType {
  game,
  poll,
  quiz,
  calculator,
  timer,
  countdown,
  diceRoll,
  coinFlip,
  ticTacToe,
  chess,
  checkers,
  eightBall,
  fortuneTeller,
  custom,
}

/// Immutable mini app metadata model.
class MiniApp {
  final String id;
  final String name;
  final String description;
  final MiniAppType type;
  final String iconUrl;
  final String? webUrl; // For web-based mini apps
  final Map<String, dynamic> config;
  final bool isMultiplayer;
  final int maxPlayers;
  final DateTime createdAt;

  MiniApp({
    required this.id,
    required this.name,
    required this.description,
    required this.type,
    required this.iconUrl,
    this.webUrl,
    required this.config,
    required this.isMultiplayer,
    required this.maxPlayers,
    required this.createdAt,
  });

  factory MiniApp.fromMap(Map<String, dynamic> map, String id) {
    final rawType = map['type'];
    final parsedType = MiniAppType.values.firstWhere(
      (e) => e.name == rawType,
      orElse: () => MiniAppType.custom,
    );
    DateTime created;
    final createdRaw = map['createdAt'];
    if (createdRaw is Timestamp) {
      created = createdRaw.toDate();
    } else if (createdRaw is int) {
      created = DateTime.fromMillisecondsSinceEpoch(createdRaw);
    } else {
      created = DateTime.now();
    }
    return MiniApp(
      id: id,
      name: map['name'] ?? '',
      description: map['description'] ?? '',
      type: parsedType,
      iconUrl: map['iconUrl'] ?? '',
      webUrl: map['webUrl'],
      config: (map['config'] as Map<String, dynamic>?) ?? {},
      isMultiplayer: map['isMultiplayer'] ?? false,
      maxPlayers: map['maxPlayers'] ?? 1,
      createdAt: created,
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'description': description,
        'type': type.name,
        'iconUrl': iconUrl,
        'webUrl': webUrl,
        'config': config,
        'isMultiplayer': isMultiplayer,
        'maxPlayers': maxPlayers,
        'createdAt': Timestamp.fromDate(createdAt),
      };
}

/// Turn-based or realtime game session state.
class GameSession {
  final String id;
  final String appId;
  final String chatId;
  final List<String> playerIds;
  final String currentPlayerId;
  final Map<String, dynamic> gameState;
  final String status; // waiting | active | completed
  final DateTime createdAt;
  final DateTime? completedAt;
  final String? winnerId;

  GameSession({
    required this.id,
    required this.appId,
    required this.chatId,
    required this.playerIds,
    required this.currentPlayerId,
    required this.gameState,
    required this.status,
    required this.createdAt,
    this.completedAt,
    this.winnerId,
  });

  factory GameSession.fromMap(Map<String, dynamic> map, String id) {
    DateTime parseTs(dynamic v) {
      if (v is Timestamp) return v.toDate();
      if (v is int) return DateTime.fromMillisecondsSinceEpoch(v);
      return DateTime.now();
    }

    return GameSession(
      id: id,
      appId: map['appId'] ?? '',
      chatId: map['chatId'] ?? '',
      playerIds: List<String>.from(map['playerIds'] ?? []),
      currentPlayerId: map['currentPlayerId'] ?? '',
      gameState: (map['gameState'] as Map<String, dynamic>?) ?? {},
      status: map['status'] ?? 'waiting',
      createdAt: parseTs(map['createdAt']),
      completedAt:
          map['completedAt'] != null ? parseTs(map['completedAt']) : null,
      winnerId: map['winnerId'],
    );
  }

  Map<String, dynamic> toMap() => {
        'appId': appId,
        'chatId': chatId,
        'playerIds': playerIds,
        'currentPlayerId': currentPlayerId,
        'gameState': gameState,
        'status': status,
        'createdAt': Timestamp.fromDate(createdAt),
        'completedAt':
            completedAt != null ? Timestamp.fromDate(completedAt!) : null,
        'winnerId': winnerId,
      };
}

/// Service exposing mini app & game utilities.
class MiniAppsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final _rand = Random();

  /// Stream all mini apps ordered by name.
  Stream<List<MiniApp>> getMiniApps() => _firestore
      .collection('mini_apps')
      .orderBy('name')
      .snapshots()
      .map((s) => s.docs.map((d) => MiniApp.fromMap(d.data(), d.id)).toList());

  /// Fetch a single mini app.
  Future<MiniApp?> getMiniAppById(String appId) async {
    final doc = await _firestore.collection('mini_apps').doc(appId).get();
    if (!doc.exists) return null;
    return MiniApp.fromMap(doc.data()!, doc.id);
  }

  /// Create a new game session and notify players.
  Future<String> startGameSession(
      String appId, String chatId, List<String> playerIds) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final session = GameSession(
      id: '',
      appId: appId,
      chatId: chatId,
      playerIds: playerIds,
      currentPlayerId: playerIds.first,
      gameState: {},
      status: 'waiting',
      createdAt: DateTime.now(),
    );
    final ref =
        await _firestore.collection('game_sessions').add(session.toMap());
    dev.log('Started game session ${ref.id} for app $appId', name: 'mini_apps');

    for (final pid in playerIds) {
      await _firestore.collection('notifications').add({
        'userId': pid,
        'type': 'game_invitation',
        'sessionId': ref.id,
        'fromUserId': userId,
        'timestamp': Timestamp.now(),
        'read': false,
      });
    }
    return ref.id;
  }

  Stream<GameSession?> getGameSession(String sessionId) => _firestore
      .collection('game_sessions')
      .doc(sessionId)
      .snapshots()
      .map((d) => d.exists ? GameSession.fromMap(d.data()!, d.id) : null);

  Future<void> updateGameState(String sessionId, Map<String, dynamic> newState,
      String nextPlayerId) async {
    await _firestore.collection('game_sessions').doc(sessionId).update({
      'gameState': newState,
      'currentPlayerId': nextPlayerId,
    });
  }

  Future<void> completeGameSession(String sessionId, String? winnerId) async {
    await _firestore.collection('game_sessions').doc(sessionId).update({
      'status': 'completed',
      'completedAt': Timestamp.now(),
      'winnerId': winnerId,
    });
    if (winnerId != null) {
      await _firestore.collection('user_stats').doc(winnerId).set({
        'gamesWon': FieldValue.increment(1),
      }, SetOptions(merge: true));
    }
  }

  Stream<List<GameSession>> getChatGameSessions(String chatId) => _firestore
      .collection('game_sessions')
      .where('chatId', isEqualTo: chatId)
      .where('status', whereIn: ['waiting', 'active'])
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((s) =>
          s.docs.map((d) => GameSession.fromMap(d.data(), d.id)).toList());

  Future<String> createPoll(
      String chatId, String question, List<String> options) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('User not authenticated');
    final ref = await _firestore.collection('polls').add({
      'chatId': chatId,
      'creatorId': uid,
      'question': question,
      'options': options
          .map((o) => {'text': o, 'votes': 0, 'voters': <String>[]})
          .toList(),
      'createdAt': Timestamp.now(),
      'expiresAt':
          Timestamp.fromDate(DateTime.now().add(const Duration(hours: 24))),
    });
    return ref.id;
  }

  Future<void> voteInPoll(String pollId, int optionIndex) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('User not authenticated');
    final doc = await _firestore.collection('polls').doc(pollId).get();
    if (!doc.exists) throw Exception('Poll not found');
    final options =
        List<Map<String, dynamic>>.from(doc.data()?['options'] ?? []);
    for (final option in options) {
      final voters = List<String>.from(option['voters'] ?? []);
      if (voters.remove(uid)) {
        option['voters'] = voters;
        option['votes'] = voters.length;
      }
    }
    final voters = List<String>.from(options[optionIndex]['voters'] ?? []);
    voters.add(uid);
    options[optionIndex]['voters'] = voters;
    options[optionIndex]['votes'] = voters.length;
    await _firestore
        .collection('polls')
        .doc(pollId)
        .update({'options': options});
  }

  Stream<Map<String, dynamic>?> getPoll(String pollId) => _firestore
      .collection('polls')
      .doc(pollId)
      .snapshots()
      .map((d) => d.exists ? {'id': d.id, ...d.data()!} : null);

  Future<int> rollDice(String chatId, int sides) async {
    if (sides <= 1) throw ArgumentError('Dice must have at least 2 sides');
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('User not authenticated');
    final result = _rand.nextInt(sides) + 1;
    await _firestore.collection('dice_rolls').add({
      'chatId': chatId,
      'userId': uid,
      'sides': sides,
      'result': result,
      'timestamp': Timestamp.now(),
    });
    return result;
  }

  Future<String> flipCoin(String chatId) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('User not authenticated');
    final result = _rand.nextBool() ? 'heads' : 'tails';
    await _firestore.collection('coin_flips').add({
      'chatId': chatId,
      'userId': uid,
      'result': result,
      'timestamp': Timestamp.now(),
    });
    return result;
  }

  Future<Map<String, dynamic>> getUserGameStats() async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw Exception('User not authenticated');
    final doc = await _firestore.collection('user_stats').doc(uid).get();
    if (doc.exists) return doc.data() ?? {};
    return {'gamesPlayed': 0, 'gamesWon': 0, 'gamesLost': 0};
  }
}
