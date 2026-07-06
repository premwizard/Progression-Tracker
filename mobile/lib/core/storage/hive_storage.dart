import 'package:hive_flutter/hive_flutter.dart';

class HiveStorage {
  static const String authBoxName = 'auth_box';
  static const String tokenKey = 'jwt_token';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(authBoxName);
  }

  static Future<void> saveToken(String token) async {
    final box = Hive.box(authBoxName);
    await box.put(tokenKey, token);
  }

  static String? getToken() {
    final box = Hive.box(authBoxName);
    return box.get(tokenKey) as String?;
  }

  static Future<void> deleteToken() async {
    final box = Hive.box(authBoxName);
    await box.delete(tokenKey);
  }

  static Future<void> clear() async {
    final box = Hive.box(authBoxName);
    await box.clear();
  }
}

