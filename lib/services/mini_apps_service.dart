import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

/// Mini Apps Service
/// Handles in-chat games and mini-applications
class MiniAppsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Mini app types
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

  /// Mini app model
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
      return MiniApp(
        id: id,
        name: map['name'] ?? '',
        description: map['description'] ?? '',
        type: MiniAppType.values.firstWhere(
          (e) => e.toString() == 'MiniAppType.${map['type']}',
          orElse: () => MiniAppType.custom,
        ),
        iconUrl: map['iconUrl'] ?? '',
        webUrl: map['webUrl'],
        config: map['config'] ?? {},
        isMultiplayer: map['isMultiplayer'] ?? false,
        maxPlayers: map['maxPlayers'] ?? 1,
        createdAt: (map['createdAt'] as Timestamp).toDate(),
      );
    }

    Map<String, dynamic> toMap() {
      return {
        'name': name,
        'description': description,
        'type': type.toString().split('.').last,
        'iconUrl': iconUrl,
        'webUrl': webUrl,
        'config': config,
        'isMultiplayer': isMultiplayer,
        'maxPlayers': maxPlayers,
        'createdAt': Timestamp.fromDate(createdAt),
      };
    }
  }

  /// Game session model
  class GameSession {
    final String id;
    final String appId;
    final String chatId;
    final List<String> playerIds;
    final String currentPlayerId;
    final Map<String, dynamic> gameState;
    final String status; // 'waiting', 'active', 'completed'
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
      return GameSession(
        id: id,
        appId: map['appId'] ?? '',
        chatId: map['chatId'] ?? '',
        playerIds: List<String>.from(map['playerIds'] ?? []),
        currentPlayerId: map['currentPlayerId'] ?? '',
        gameState: map['gameState'] ?? {},
        status: map['status'] ?? 'waiting',
        createdAt: (map['createdAt'] as Timestamp).toDate(),
        completedAt: map['completedAt'] != null
            ? (map['completedAt'] as Timestamp).toDate()
            : null,
        winnerId: map['winnerId'],
      );
    }

    Map<String, dynamic> toMap() {
      return {
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
  }

  /// Get all available mini apps
  Stream<List<MiniApp>> getMiniApps() {
    return _firestore
        .collection('mini_apps')
        .orderBy('name')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => MiniApp.fromMap(doc.data(), doc.id))
            .toList());
  }

  /// Get mini app by ID
  Future<MiniApp?> getMiniAppById(String appId) async {
    final doc = await _firestore.collection('mini_apps').doc(appId).get();
    if (doc.exists) {
      return MiniApp.fromMap(doc.data()!, doc.id);
    }
    return null;
  }

  /// Start a game session
  Future<String> startGameSession(
    String appId,
    String chatId,
    List<String> playerIds,
  ) async {
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

    final sessionRef =
        await _firestore.collection('game_sessions').add(session.toMap());

    // Notify all players
    for (var playerId in playerIds) {
      await _firestore.collection('notifications').add({
        'userId': playerId,
        'type': 'game_invitation',
        'sessionId': sessionRef.id,
        'fromUserId': userId,
        'timestamp': Timestamp.now(),
        'read': false,
      });
    }

    return sessionRef.id;
  }

  /// Get game session
  Stream<GameSession?> getGameSession(String sessionId) {
    return _firestore
        .collection('game_sessions')
        .doc(sessionId)
        .snapshots()
        .map((doc) {
      if (doc.exists) {
        return GameSession.fromMap(doc.data()!, doc.id);
      }
      return null;
    });
  }

  /// Update game state
  Future<void> updateGameState(
    String sessionId,
    Map<String, dynamic> newState,
    String nextPlayerId,
  ) async {
    await _firestore.collection('game_sessions').doc(sessionId).update({
      'gameState': newState,
      'currentPlayerId': nextPlayerId,
    });
  }

  /// Complete game session
  Future<void> completeGameSession(String sessionId, String? winnerId) async {
    await _firestore.collection('game_sessions').doc(sessionId).update({
      'status': 'completed',
      'completedAt': Timestamp.now(),
      'winnerId': winnerId,
    });

    // Update player stats
    if (winnerId != null) {
      await _firestore
          .collection('user_stats')
          .doc(winnerId)
          .set({
        'gamesWon': FieldValue.increment(1),
      }, SetOptions(merge: true));
    }
  }

  /// Get active game sessions for a chat
  Stream<List<GameSession>> getChatGameSessions(String chatId) {
    return _firestore
        .collection('game_sessions')
        .where('chatId', isEqualTo: chatId)
        .where('status', whereIn: ['waiting', 'active'])
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => GameSession.fromMap(doc.data(), doc.id))
            .toList());
  }

  /// Create a poll
  Future<String> createPoll(
    String chatId,
    String question,
    List<String> options,
  ) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final pollRef = await _firestore.collection('polls').add({
      'chatId': chatId,
      'creatorId': userId,
      'question': question,
      'options': options.map((option) => {
        'text': option,
        'votes': 0,
        'voters': [],
      }).toList(),
      'createdAt': Timestamp.now(),
      'expiresAt': Timestamp.fromDate(
        DateTime.now().add(const Duration(hours: 24)),
      ),
    });

    return pollRef.id;
  }

  /// Vote in a poll
  Future<void> voteInPoll(String pollId, int optionIndex) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final pollDoc = await _firestore.collection('polls').doc(pollId).get();
    if (!pollDoc.exists) throw Exception('Poll not found');

    final options = List<Map<String, dynamic>>.from(pollDoc.data()?['options'] ?? []);
    
    // Remove previous vote if exists
    for (var option in options) {
      final voters = List<String>.from(option['voters'] ?? []);
      if (voters.contains(userId)) {
        voters.remove(userId);
        option['voters'] = voters;
        option['votes'] = voters.length;
      }
    }

    // Add new vote
    final voters = List<String>.from(options[optionIndex]['voters'] ?? []);
    voters.add(userId);
    options[optionIndex]['voters'] = voters;
    options[optionIndex]['votes'] = voters.length;

    await _firestore.collection('polls').doc(pollId).update({
      'options': options,
    });
  }

  /// Get poll results
  Stream<Map<String, dynamic>?> getPoll(String pollId) {
    return _firestore.collection('polls').doc(pollId).snapshots().map((doc) {
      if (doc.exists) {
        return {'id': doc.id, ...doc.data()!};
      }
      return null;
    });
  }

  /// Roll dice
  Future<int> rollDice(String chatId, int sides) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final result = DateTime.now().millisecondsSinceEpoch % sides + 1;

    await _firestore.collection('dice_rolls').add({
      'chatId': chatId,
      'userId': userId,
      'sides': sides,
      'result': result,
      'timestamp': Timestamp.now(),
    });

    return result;
  }

  /// Flip coin
  Future<String> flipCoin(String chatId) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final result = DateTime.now().millisecondsSinceEpoch % 2 == 0 ? 'heads' : 'tails';

    await _firestore.collection('coin_flips').add({
      'chatId': chatId,
      'userId': userId,
      'result': result,
      'timestamp': Timestamp.now(),
    });

    return result;
  }

  /// Get user's game stats
  Future<Map<String, dynamic>> getUserGameStats() async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final doc = await _firestore.collection('user_stats').doc(userId).get();
    if (doc.exists) {
      return doc.data() ?? {};
    }
    return {
      'gamesPlayed': 0,
      'gamesWon': 0,
      'gamesLost': 0,
    };
  }
}
