import 'package:dio/dio.dart';
import '../models/goal.dart';
import '../storage/hive_storage.dart';
import 'dio_client.dart';

class GoalRepository {
  final DioClient? _client;

  GoalRepository({DioClient? client}) : _client = client;

  static final List<Goal> defaultFallbackGoals = [
    Goal(
      id: 'default-goal-1',
      userId: 'ee8d8906-8a8f-45b9-be84-d9fc46000ea1',
      title: 'React Advanced Patterns',
      description: 'Master component composition, custom hooks, and concurrent features',
      category: 'Engineering',
      priority: 'high',
      status: 'in_progress',
      progressPercent: 68.0,
      createdAt: DateTime.now().subtract(const Duration(days: 30)),
      updatedAt: DateTime.now(),
      tasks: [
        TaskItem(
          id: 'task-1-1',
          goalId: 'default-goal-1',
          title: 'Understanding Compound Components',
          isCompleted: true,
          orderIndex: 0,
          createdAt: DateTime.now().subtract(const Duration(days: 20)),
        ),
        TaskItem(
          id: 'task-1-2',
          goalId: 'default-goal-1',
          title: 'Custom Hooks Architecture & Memory Safety',
          isCompleted: true,
          orderIndex: 1,
          createdAt: DateTime.now().subtract(const Duration(days: 10)),
        ),
        TaskItem(
          id: 'task-1-3',
          goalId: 'default-goal-1',
          title: 'Server Actions and Streaming SSR',
          isCompleted: false,
          orderIndex: 2,
          createdAt: DateTime.now().subtract(const Duration(days: 5)),
        ),
      ],
    ),
    Goal(
      id: 'default-goal-2',
      userId: 'ee8d8906-8a8f-45b9-be84-d9fc46000ea1',
      title: 'System Design Interview Prep',
      description: 'Distributed cache, message queues, and consensus algorithms',
      category: 'Career',
      priority: 'high',
      status: 'in_progress',
      progressPercent: 34.0,
      createdAt: DateTime.now().subtract(const Duration(days: 15)),
      updatedAt: DateTime.now(),
      tasks: [
        TaskItem(
          id: 'task-2-1',
          goalId: 'default-goal-2',
          title: 'Consistent Hashing & Partitioning',
          isCompleted: true,
          orderIndex: 0,
          createdAt: DateTime.now().subtract(const Duration(days: 12)),
        ),
        TaskItem(
          id: 'task-2-2',
          goalId: 'default-goal-2',
          title: 'Raft & Paxos Consensus Deep Dive',
          isCompleted: false,
          orderIndex: 1,
          createdAt: DateTime.now().subtract(const Duration(days: 8)),
        ),
        TaskItem(
          id: 'task-2-3',
          goalId: 'default-goal-2',
          title: 'Rate Limiter & API Gateway Design',
          isCompleted: false,
          orderIndex: 2,
          createdAt: DateTime.now().subtract(const Duration(days: 3)),
        ),
      ],
    ),
    Goal(
      id: 'default-goal-3',
      userId: 'ee8d8906-8a8f-45b9-be84-d9fc46000ea1',
      title: 'Marathon Training',
      description: 'Run 42.2km endurance program with progressive volume',
      category: 'Health',
      priority: 'medium',
      status: 'in_progress',
      progressPercent: 85.0,
      createdAt: DateTime.now().subtract(const Duration(days: 60)),
      updatedAt: DateTime.now(),
      tasks: [
        TaskItem(
          id: 'task-3-1',
          goalId: 'default-goal-3',
          title: 'Base phase: 30km weekly volume',
          isCompleted: true,
          orderIndex: 0,
          createdAt: DateTime.now().subtract(const Duration(days: 50)),
        ),
        TaskItem(
          id: 'task-3-2',
          goalId: 'default-goal-3',
          title: 'Build phase: 25km long weekend run',
          isCompleted: true,
          orderIndex: 1,
          createdAt: DateTime.now().subtract(const Duration(days: 20)),
        ),
        TaskItem(
          id: 'task-3-3',
          goalId: 'default-goal-3',
          title: 'Taper week and race nutrition setup',
          isCompleted: false,
          orderIndex: 2,
          createdAt: DateTime.now().subtract(const Duration(days: 2)),
        ),
      ],
    ),
  ];

  Future<List<Goal>> getGoals() async {
    if (_client != null) {
      try {
        final response = await _client.dio.get('/goals');
        final list = response.data as List<dynamic>;
        final goals = list.map((item) => Goal.fromJson(item as Map<String, dynamic>)).toList();

        await HiveStorage.cacheGoals(list.map((e) => Map<String, dynamic>.from(e as Map)).toList());
        return goals;
      } catch (_) {
        // Fall back to offline Hive cache
      }
    }

    final cached = HiveStorage.getCachedGoals();
    if (cached.isNotEmpty) {
      return cached.map((e) => Goal.fromJson(e)).toList();
    }

    return defaultFallbackGoals;
  }

  Future<Goal> createGoal({
    required String title,
    String? description,
    String category = 'Engineering',
    String priority = 'medium',
    DateTime? targetDate,
    List<String> taskTitles = const [],
  }) async {
    final payload = {
      'title': title,
      'description': description,
      'category': category,
      'priority': priority,
      if (targetDate != null) 'target_date': targetDate.toIso8601String(),
      'tasks': taskTitles.asMap().entries.map((e) => {
        'title': e.value,
        'order_index': e.key,
        'is_completed': false,
      }).toList(),
    };

    if (_client != null) {
      try {
        final response = await _client.dio.post('/goals', data: payload);
        return Goal.fromJson(response.data as Map<String, dynamic>);
      } catch (_) {
        await HiveStorage.addToSyncQueue(SyncQueueItem(
          id: '${DateTime.now().millisecondsSinceEpoch}_create_goal',
          endpoint: '/goals',
          method: 'POST',
          payload: payload,
          timestamp: DateTime.now(),
        ));
      }
    }

    // Optimistic offline goal creation
    final goalId = 'local_${DateTime.now().millisecondsSinceEpoch}';
    final createdTasks = taskTitles.asMap().entries.map((e) {
      return TaskItem(
        id: 'localtask_${e.key}_${DateTime.now().millisecondsSinceEpoch}',
        goalId: goalId,
        title: e.value,
        orderIndex: e.key,
        createdAt: DateTime.now(),
      );
    }).toList();

    final optimistic = Goal(
      id: goalId,
      userId: 'ee8d8906-8a8f-45b9-be84-d9fc46000ea1',
      title: title,
      description: description,
      category: category,
      priority: priority,
      targetDate: targetDate,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      tasks: createdTasks,
    );

    final currentCached = HiveStorage.getCachedGoals();
    currentCached.insert(0, optimistic.toJson());
    await HiveStorage.cacheGoals(currentCached);

    return optimistic;
  }

  Future<TaskItem> toggleTask({
    required String goalId,
    required String taskId,
    required bool isCompleted,
  }) async {
    final payload = {'is_completed': isCompleted};

    if (_client != null) {
      try {
        final response = await _client.dio.put('/tasks/$taskId', data: payload);
        return TaskItem.fromJson(response.data as Map<String, dynamic>);
      } catch (_) {
        await HiveStorage.addToSyncQueue(SyncQueueItem(
          id: '${DateTime.now().millisecondsSinceEpoch}_toggle_task_$taskId',
          endpoint: '/tasks/$taskId',
          method: 'PUT',
          payload: payload,
          timestamp: DateTime.now(),
        ));
      }
    }

    // Optimistically update Hive cache
    final cached = HiveStorage.getCachedGoals();
    for (var g in cached) {
      if (g['id'] == goalId && g['tasks'] is List) {
        final taskList = g['tasks'] as List;
        int completedCount = 0;
        for (var t in taskList) {
          if (t['id'] == taskId) {
            t['is_completed'] = isCompleted;
          }
          if (t['is_completed'] == true) {
            completedCount++;
          }
        }
        if (taskList.isNotEmpty) {
          g['progress_percent'] = (completedCount / taskList.length) * 100.0;
        }
      }
    }
    await HiveStorage.cacheGoals(cached);

    return TaskItem(
      id: taskId,
      goalId: goalId,
      title: 'Task',
      isCompleted: isCompleted,
      createdAt: DateTime.now(),
    );
  }
}
