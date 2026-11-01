import 'package:dio/dio.dart';
import '../models/activity.dart';
import 'dio_client.dart';

class ActivityRepository {
  final DioClient _client;

  ActivityRepository({DioClient? client}) : _client = client ?? DioClient();

  Future<List<Activity>> getActivities({String? category, String? status = 'active'}) async {
    final query = <String, dynamic>{};
    if (category != null) query['category'] = category;
    if (status != null) query['status'] = status;

    final response = await _client.dio.get('/activities', queryParameters: query);
    final list = response.data as List<dynamic>;
    return list.map((item) => Activity.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<Activity> getActivityById(String id) async {
    final response = await _client.dio.get('/activities/$id');
    return Activity.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Activity> createActivity({
    required String name,
    String? description,
    String icon = 'dumbbell',
    String color = '#F97316',
    String category = 'Personal',
    List<String> trackingMethods = const ['time'],
    String? metricUnit,
    double? dailyTarget,
    double? weeklyTarget,
    Map<String, dynamic>? heatmapConfig,
    Map<String, dynamic>? reminderConfig,
  }) async {
    final payload = {
      'name': name,
      'description': description,
      'icon': icon,
      'color': color,
      'category': category,
      'tracking_methods': trackingMethods,
      'metric_unit': metricUnit,
      'daily_target': dailyTarget,
      'weekly_target': weeklyTarget,
      if (heatmapConfig != null) 'heatmap_config': heatmapConfig,
      if (reminderConfig != null) 'reminder_config': reminderConfig,
    };

    final response = await _client.dio.post('/activities', data: payload);
    return Activity.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Activity> updateActivity(String id, Map<String, dynamic> updates) async {
    final response = await _client.dio.put('/activities/$id', data: updates);
    return Activity.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteActivity(String id) async {
    await _client.dio.delete('/activities/$id');
  }
}

