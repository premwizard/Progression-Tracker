import 'package:dio/dio.dart';
import '../models/activity_log.dart';
import '../models/session.dart';
import 'dio_client.dart';

class TrackingRepository {
  final DioClient _client;

  TrackingRepository({DioClient? client}) : _client = client ?? DioClient();

  // --- Method 1: Time Tracking ---

  Future<ActivitySession> startSession(String activityId, {String? notes}) async {
    final response = await _client.dio.post(
      '/tracking/sessions/start',
      data: {'activity_id': activityId, if (notes != null) 'notes': notes},
    );
    return ActivitySession.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ActivitySession> pauseSession(String sessionId, {String? notes}) async {
    final response = await _client.dio.post(
      '/tracking/sessions/$sessionId/pause',
      data: {if (notes != null) 'notes': notes},
    );
    return ActivitySession.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ActivitySession> resumeSession(String sessionId) async {
    final response = await _client.dio.post('/tracking/sessions/$sessionId/resume');
    return ActivitySession.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ActivitySession> finishSession(String sessionId, {String? notes}) async {
    final response = await _client.dio.post(
      '/tracking/sessions/$sessionId/finish',
      data: {if (notes != null) 'notes': notes},
    );
    return ActivitySession.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ActivitySession> cancelSession(String sessionId) async {
    final response = await _client.dio.post('/tracking/sessions/$sessionId/cancel');
    return ActivitySession.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ActivitySession> manualAddSession({
    required String activityId,
    required DateTime startTime,
    required DateTime endTime,
    String? notes,
  }) async {
    final response = await _client.dio.post(
      '/tracking/sessions/manual',
      data: {
        'activity_id': activityId,
        'start_time': startTime.toIso8601String(),
        'end_time': endTime.toIso8601String(),
        if (notes != null) 'notes': notes,
      },
    );
    return ActivitySession.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ActivitySession?> getActiveSession({String? activityId}) async {
    final response = await _client.dio.get(
      '/tracking/sessions/active',
      queryParameters: {if (activityId != null) 'activity_id': activityId},
    );
    if (response.data == null) return null;
    return ActivitySession.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<ActivitySession>> listSessions({String? activityId, int limit = 50, int offset = 0}) async {
    final response = await _client.dio.get(
      '/tracking/sessions',
      queryParameters: {
        if (activityId != null) 'activity_id': activityId,
        'limit': limit,
        'offset': offset,
      },
    );
    final list = response.data as List<dynamic>;
    return list.map((item) => ActivitySession.fromJson(item as Map<String, dynamic>)).toList();
  }

  // --- Method 2: Quantity Tracking ---

  Future<ActivityLog> logQuantity({
    required String activityId,
    required double quantityValue,
    DateTime? logDate,
    String? notes,
  }) async {
    final response = await _client.dio.post(
      '/tracking/quantity',
      data: {
        'activity_id': activityId,
        'quantity_value': quantityValue,
        if (logDate != null) 'log_date': logDate.toIso8601String().substring(0, 10),
        if (notes != null) 'notes': notes,
      },
    );
    return ActivityLog.fromJson(response.data as Map<String, dynamic>);
  }

  // --- Method 3: Completion Tracking ---

  Future<ActivityLog> setCompletion({
    required String activityId,
    required bool isCompleted,
    DateTime? logDate,
    String? notes,
  }) async {
    final response = await _client.dio.post(
      '/tracking/completion',
      data: {
        'activity_id': activityId,
        'is_completed': isCompleted,
        if (logDate != null) 'log_date': logDate.toIso8601String().substring(0, 10),
        if (notes != null) 'notes': notes,
      },
    );
    return ActivityLog.fromJson(response.data as Map<String, dynamic>);
  }

  // --- Method 4: Automatic Tracking (Screen Time) ---

  Future<void> uploadScreenTimeBatch(List<Map<String, dynamic>> items) async {
    await _client.dio.post('/tracking/screentime/batch', data: {'items': items});
  }
}

