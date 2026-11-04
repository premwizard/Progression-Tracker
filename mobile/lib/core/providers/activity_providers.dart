import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/activity.dart';
import '../models/session.dart';
import '../network/activity_repository.dart';
import '../network/tracking_repository.dart';

// --- Repositories ---
final activityRepositoryProvider = Provider<ActivityRepository>((ref) {
  DioClient? client;
  try {
    client = DioClient();
  } catch (_) {
    client = null;
  }
  return ActivityRepository(client: client);
});

final trackingRepositoryProvider = Provider<TrackingRepository>((ref) {
  DioClient? client;
  try {
    client = DioClient();
  } catch (_) {
    client = null;
  }
  return TrackingRepository(client: client);
});

// --- Activities State ---
class ActivitiesNotifier extends StateNotifier<AsyncValue<List<Activity>>> {
  final ActivityRepository _repo;

  ActivitiesNotifier(this._repo) : super(const AsyncValue.loading()) {
    loadActivities();
  }

  Future<void> loadActivities({String? category, String? status = 'active'}) async {
    state = const AsyncValue.loading();
    try {
      final list = await _repo.getActivities(category: category, status: status);
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<Activity?> createActivity({
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
  }) async {
    try {
      final created = await _repo.createActivity(
        name: name,
        description: description,
        icon: icon,
        color: color,
        category: category,
        trackingMethods: trackingMethods,
        metricUnit: metricUnit,
        dailyTarget: dailyTarget,
        weeklyTarget: weeklyTarget,
        heatmapConfig: heatmapConfig,
      );
      await loadActivities();
      return created;
    } catch (e) {
      return null;
    }
  }

  Future<void> deleteActivity(String id) async {
    try {
      await _repo.deleteActivity(id);
      await loadActivities();
    } catch (_) {}
  }
}

final activitiesProvider = StateNotifierProvider<ActivitiesNotifier, AsyncValue<List<Activity>>>((ref) {
  final repo = ref.watch(activityRepositoryProvider);
  return ActivitiesNotifier(repo);
});

// --- Active Session State ---
class ActiveSessionNotifier extends StateNotifier<AsyncValue<ActivitySession?>> {
  final TrackingRepository _repo;

  ActiveSessionNotifier(this._repo) : super(const AsyncValue.loading()) {
    checkActiveSession();
  }

  Future<void> checkActiveSession() async {
    try {
      final session = await _repo.getActiveSession();
      state = AsyncValue.data(session);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> startSession(String activityId, {String? notes}) async {
    state = const AsyncValue.loading();
    try {
      final session = await _repo.startSession(activityId, notes: notes);
      state = AsyncValue.data(session);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> pauseSession() async {
    final current = state.value;
    if (current == null) return;
    try {
      final paused = await _repo.pauseSession(current.id);
      state = AsyncValue.data(paused);
    } catch (_) {}
  }

  Future<void> resumeSession() async {
    final current = state.value;
    if (current == null) return;
    try {
      final resumed = await _repo.resumeSession(current.id);
      state = AsyncValue.data(resumed);
    } catch (_) {}
  }

  Future<ActivitySession?> finishSession({String? notes}) async {
    final current = state.value;
    if (current == null) return null;
    try {
      final finished = await _repo.finishSession(current.id, notes: notes);
      state = const AsyncValue.data(null);
      return finished;
    } catch (_) {
      return null;
    }
  }

  Future<void> cancelSession() async {
    final current = state.value;
    if (current == null) return;
    try {
      await _repo.cancelSession(current.id);
      state = const AsyncValue.data(null);
    } catch (_) {}
  }
}

final activeSessionProvider = StateNotifierProvider<ActiveSessionNotifier, AsyncValue<ActivitySession?>>((ref) {
  final repo = ref.watch(trackingRepositoryProvider);
  return ActiveSessionNotifier(repo);
});

