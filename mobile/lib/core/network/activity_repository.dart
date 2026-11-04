import 'package:dio/dio.dart';
import '../models/activity.dart';
import '../storage/hive_storage.dart';
import 'dio_client.dart';

class ActivityRepository {
  final DioClient? _client;

  ActivityRepository({DioClient? client}) : _client = client;

  static final List<Activity> defaultFallbackActivities = [
    Activity(
      id: 'default-deep-work',
      userId: 'ee8d8906-8a8f-45b9-be84-d9fc46000ea1',
      name: 'Deep Work',
      description: 'Focused coding, system design, or engineering work',
      icon: 'code',
      color: '#3B82F6',
      category: 'Engineering',
      trackingMethods: const ['time'],
      metricUnit: 'minutes',
      dailyTarget: 120.0,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      todayProgress: const TodayProgress(durationSeconds: 3600, progressPercent: 50.0),
      currentStreak: 12,
    ),
    Activity(
      id: 'default-reading',
      userId: 'ee8d8906-8a8f-45b9-be84-d9fc46000ea1',
      name: 'Reading & Research',
      description: 'Technical reading, papers, documentation, and books',
      icon: 'book-open',
      color: '#10B981',
      category: 'Learning',
      trackingMethods: const ['time', 'quantity'],
      metricUnit: 'pages',
      dailyTarget: 20.0,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      todayProgress: const TodayProgress(quantity: 15.0, progressPercent: 75.0),
      currentStreak: 7,
    ),
    Activity(
      id: 'default-workout',
      userId: 'ee8d8906-8a8f-45b9-be84-d9fc46000ea1',
      name: 'Workout & Health',
      description: 'Fitness, running, lifting, or mobility training',
      icon: 'activity',
      color: '#F97316',
      category: 'Health',
      trackingMethods: const ['time', 'completion'],
      metricUnit: 'minutes',
      dailyTarget: 45.0,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      todayProgress: const TodayProgress(completed: true, progressPercent: 100.0),
      currentStreak: 24,
    ),
  ];

  Future<List<Activity>> getActivities({String? category, String? status = 'active'}) async {
    if (_client != null) {
      try {
        final query = <String, dynamic>{};
        if (category != null) query['category'] = category;
        if (status != null) query['status'] = status;

        final response = await _client.dio.get('/activities', queryParameters: query);
        final list = response.data as List<dynamic>;
        final activities = list.map((item) => Activity.fromJson(item as Map<String, dynamic>)).toList();

        // Cache in Hive for offline resilience
        await HiveStorage.cacheActivities(list.map((e) => Map<String, dynamic>.from(e as Map)).toList());
        return activities;
      } catch (_) {
        // Fall back to offline storage
      }
    }

    // 1. Try reading from Hive cache
    final cached = HiveStorage.getCachedActivities();
    if (cached.isNotEmpty) {
      var parsed = cached.map((e) => Activity.fromJson(e)).toList();
      if (category != null) {
        parsed = parsed.where((a) => a.category.toLowerCase() == category.toLowerCase()).toList();
      }
      return parsed;
    }

    // 2. Return high-quality default starter activities
    if (category != null) {
      return defaultFallbackActivities
          .where((a) => a.category.toLowerCase() == category.toLowerCase())
          .toList();
    }
    return defaultFallbackActivities;
  }

  Future<Activity> getActivityById(String id) async {
    if (_client != null) {
      try {
        final response = await _client.dio.get('/activities/$id');
        return Activity.fromJson(response.data as Map<String, dynamic>);
      } catch (_) {}
    }

    final activities = await getActivities();
    return activities.firstWhere(
      (a) => a.id == id,
      orElse: () => defaultFallbackActivities.first,
    );
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

    if (_client != null) {
      try {
        final response = await _client.dio.post('/activities', data: payload);
        final created = Activity.fromJson(response.data as Map<String, dynamic>);
        return created;
      } catch (_) {
        // Queue for sync when online
        await HiveStorage.addToSyncQueue(SyncQueueItem(
          id: '${DateTime.now().millisecondsSinceEpoch}_create_activity',
          endpoint: '/activities',
          method: 'POST',
          payload: payload,
          timestamp: DateTime.now(),
        ));
      }
    }

    // Optimistic offline creation
    final optimistic = Activity(
      id: 'local_${DateTime.now().millisecondsSinceEpoch}',
      userId: 'ee8d8906-8a8f-45b9-be84-d9fc46000ea1',
      name: name,
      description: description,
      icon: icon,
      color: color,
      category: category,
      trackingMethods: trackingMethods,
      metricUnit: metricUnit,
      dailyTarget: dailyTarget,
      weeklyTarget: weeklyTarget,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    final currentCached = HiveStorage.getCachedActivities();
    currentCached.insert(0, optimistic.toJson());
    await HiveStorage.cacheActivities(currentCached);

    return optimistic;
  }

  Future<Activity> updateActivity(String id, Map<String, dynamic> updates) async {
    if (_client != null) {
      try {
        final response = await _client.dio.put('/activities/$id', data: updates);
        return Activity.fromJson(response.data as Map<String, dynamic>);
      } catch (_) {
        await HiveStorage.addToSyncQueue(SyncQueueItem(
          id: '${DateTime.now().millisecondsSinceEpoch}_update_$id',
          endpoint: '/activities/$id',
          method: 'PUT',
          payload: updates,
          timestamp: DateTime.now(),
        ));
      }
    }
    return getActivityById(id);
  }
}
