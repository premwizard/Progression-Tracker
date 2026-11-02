import 'package:hive_flutter/hive_flutter.dart';

class HiveStorage {
  static const String authBoxName = 'auth_box';
  static const String timerBoxName = 'timer_box';
  static const String tokenKey = 'jwt_token';
  static const String activeTimerKey = 'active_timer_session';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(authBoxName);
    await Hive.openBox(timerBoxName);
  }

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

  static Future<void> saveActiveTimer(Map<String, dynamic> data) async {
    if (!Hive.isBoxOpen(timerBoxName)) return;
    final box = Hive.box(timerBoxName);
    await box.put(activeTimerKey, data);
  }

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

  static Future<void> clear() async {
    if (Hive.isBoxOpen(authBoxName)) {
      await Hive.box(authBoxName).clear();
    }
    if (Hive.isBoxOpen(timerBoxName)) {
      await Hive.box(timerBoxName).clear();
    }
  }
}

