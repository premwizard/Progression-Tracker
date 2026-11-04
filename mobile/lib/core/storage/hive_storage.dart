import 'package:hive_flutter/hive_flutter.dart';

class SyncQueueItem {
  final String id;
  final String endpoint;
  final String method; // 'POST', 'PUT', 'DELETE'
  final Map<String, dynamic> payload;
  final DateTime timestamp;
  final int retryCount;

  const SyncQueueItem({
    required this.id,
    required this.endpoint,
    this.method = 'POST',
    required this.payload,
    required this.timestamp,
    this.retryCount = 0,
  });

  factory SyncQueueItem.fromJson(Map<String, dynamic> json) {
    return SyncQueueItem(
      id: json['id'] as String,
      endpoint: json['endpoint'] as String,
      method: json['method'] as String? ?? 'POST',
      payload: Map<String, dynamic>.from(json['payload'] as Map),
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
      retryCount: (json['retry_count'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'endpoint': endpoint,
    'method': method,
    'payload': payload,
    'timestamp': timestamp.toIso8601String(),
    'retry_count': retryCount,
  };

  SyncQueueItem copyWith({int? retryCount}) {
    return SyncQueueItem(
      id: id,
      endpoint: endpoint,
      method: method,
      payload: payload,
      timestamp: timestamp,
      retryCount: retryCount ?? this.retryCount,
    );
  }
}

class HiveStorage {
  static const String authBoxName = 'auth_box';
  static const String timerBoxName = 'timer_box';
  static const String activitiesBoxName = 'activities_box';
  static const String goalsBoxName = 'goals_box';
  static const String syncQueueBoxName = 'sync_queue_box';

  static const String tokenKey = 'jwt_token';
  static const String activeTimerKey = 'active_timer_session';
  static const String cachedActivitiesKey = 'cached_activities';
  static const String cachedGoalsKey = 'cached_goals';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(authBoxName);
    await Hive.openBox(timerBoxName);
    await Hive.openBox(activitiesBoxName);
    await Hive.openBox(goalsBoxName);
    await Hive.openBox(syncQueueBoxName);
  }

  // --- Auth ---
  static Future<void> saveToken(String token) async {
    final box = Hive.box(authBoxName);
    await box.put(tokenKey, token);
  }

  static String? getToken() {
    if (!Hive.isBoxOpen(authBoxName)) return null;
    final box = Hive.box(authBoxName);
    return box.get(tokenKey) as String?;
  }

  static Future<void> deleteToken() async {
    if (!Hive.isBoxOpen(authBoxName)) return;
    final box = Hive.box(authBoxName);
    await box.delete(tokenKey);
  }

  // --- Timer ---
  static Future<void> saveActiveTimer(Map<String, dynamic> data) async {
    if (!Hive.isBoxOpen(timerBoxName)) return;
    final box = Hive.box(timerBoxName);
    await box.put(activeTimerKey, data);
  }

  Map<String, dynamic>? getActiveTimerInstance() => getActiveTimer();

  static Map<String, dynamic>? getActiveTimer() {
    if (!Hive.isBoxOpen(timerBoxName)) return null;
    final box = Hive.box(timerBoxName);
    final raw = box.get(activeTimerKey);
    if (raw is Map) {
      return Map<String, dynamic>.from(raw);
    }
    return null;
  }

  static Future<void> clearActiveTimer() async {
    if (!Hive.isBoxOpen(timerBoxName)) return;
    final box = Hive.box(timerBoxName);
    await box.delete(activeTimerKey);
  }

  // --- Activities Cache ---
  static Future<void> cacheActivities(List<Map<String, dynamic>> activities) async {
    if (!Hive.isBoxOpen(activitiesBoxName)) return;
    final box = Hive.box(activitiesBoxName);
    await box.put(cachedActivitiesKey, activities);
  }

  static List<Map<String, dynamic>> getCachedActivities() {
    if (!Hive.isBoxOpen(activitiesBoxName)) return [];
    final box = Hive.box(activitiesBoxName);
    final raw = box.get(cachedActivitiesKey);
    if (raw is List) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }

  // --- Goals Cache ---
  static Future<void> cacheGoals(List<Map<String, dynamic>> goals) async {
    if (!Hive.isBoxOpen(goalsBoxName)) return;
    final box = Hive.box(goalsBoxName);
    await box.put(cachedGoalsKey, goals);
  }

  static List<Map<String, dynamic>> getCachedGoals() {
    if (!Hive.isBoxOpen(goalsBoxName)) return [];
    final box = Hive.box(goalsBoxName);
    final raw = box.get(cachedGoalsKey);
    if (raw is List) {
      return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }

  // --- Offline Sync Queue ---
  static Future<void> addToSyncQueue(SyncQueueItem item) async {
    if (!Hive.isBoxOpen(syncQueueBoxName)) return;
    final box = Hive.box(syncQueueBoxName);
    await box.put(item.id, item.toJson());
  }

  static List<SyncQueueItem> getPendingSyncItems() {
    if (!Hive.isBoxOpen(syncQueueBoxName)) return [];
    final box = Hive.box(syncQueueBoxName);
    final items = <SyncQueueItem>[];
    for (var key in box.keys) {
      final raw = box.get(key);
      if (raw is Map) {
        try {
          items.add(SyncQueueItem.fromJson(Map<String, dynamic>.from(raw)));
        } catch (_) {}
      }
    }
    items.sort((a, b) => a.timestamp.compareTo(b.timestamp));
    return items;
  }

  static Future<void> removeSyncQueueItem(String id) async {
    if (!Hive.isBoxOpen(syncQueueBoxName)) return;
    final box = Hive.box(syncQueueBoxName);
    await box.delete(id);
  }

  static Future<void> updateSyncQueueItem(SyncQueueItem item) async {
    if (!Hive.isBoxOpen(syncQueueBoxName)) return;
    final box = Hive.box(syncQueueBoxName);
    await box.put(item.id, item.toJson());
  }

  static int getPendingSyncCount() {
    if (!Hive.isBoxOpen(syncQueueBoxName)) return 0;
    return Hive.box(syncQueueBoxName).length;
  }

  static Future<void> clearSyncQueue() async {
    if (!Hive.isBoxOpen(syncQueueBoxName)) return;
    await Hive.box(syncQueueBoxName).clear();
  }

  static Future<void> clear() async {
    if (Hive.isBoxOpen(authBoxName)) await Hive.box(authBoxName).clear();
    if (Hive.isBoxOpen(timerBoxName)) await Hive.box(timerBoxName).clear();
    if (Hive.isBoxOpen(activitiesBoxName)) await Hive.box(activitiesBoxName).clear();
    if (Hive.isBoxOpen(goalsBoxName)) await Hive.box(goalsBoxName).clear();
    if (Hive.isBoxOpen(syncQueueBoxName)) await Hive.box(syncQueueBoxName).clear();
  }
}
