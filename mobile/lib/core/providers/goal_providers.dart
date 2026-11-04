import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/goal.dart';
import '../network/dio_client.dart';
import '../network/goal_repository.dart';

final goalRepositoryProvider = Provider<GoalRepository>((ref) {
  DioClient? client;
  try {
    client = DioClient();
  } catch (_) {
    client = null;
  }
  return GoalRepository(client: client);
});

class GoalsNotifier extends StateNotifier<AsyncValue<List<Goal>>> {
  final GoalRepository _repo;

  GoalsNotifier(this._repo) : super(const AsyncValue.loading()) {
    loadGoals();
  }

  Future<void> loadGoals() async {
    state = const AsyncValue.loading();
    try {
      final list = await _repo.getGoals();
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<Goal?> createGoal({
    required String title,
    String? description,
    String category = 'Engineering',
    String priority = 'medium',
    DateTime? targetDate,
    List<String> taskTitles = const [],
  }) async {
    try {
      final created = await _repo.createGoal(
        title: title,
        description: description,
        category: category,
        priority: priority,
        targetDate: targetDate,
        taskTitles: taskTitles,
      );
      await loadGoals();
      return created;
    } catch (_) {
      return null;
    }
  }

  Future<void> toggleTask({
    required String goalId,
    required String taskId,
    required bool isCompleted,
  }) async {
    // Optimistic state update
    state.whenData((goals) {
      final updatedGoals = goals.map((goal) {
        if (goal.id != goalId) return goal;

        final updatedTasks = goal.tasks.map((task) {
          if (task.id == taskId) {
            return task.copyWith(isCompleted: isCompleted);
          }
          return task;
        }).toList();

        final completedCount = updatedTasks.where((t) => t.isCompleted).length;
        final newProgress = updatedTasks.isNotEmpty
            ? (completedCount / updatedTasks.length) * 100.0
            : 0.0;

        return goal.copyWith(
          tasks: updatedTasks,
          progressPercent: newProgress,
        );
      }).toList();

      state = AsyncValue.data(updatedGoals);
    });

    try {
      await _repo.toggleTask(
        goalId: goalId,
        taskId: taskId,
        isCompleted: isCompleted,
      );
    } catch (_) {}
  }
}

final goalsProvider = StateNotifierProvider<GoalsNotifier, AsyncValue<List<Goal>>>((ref) {
  final repo = ref.watch(goalRepositoryProvider);
  return GoalsNotifier(repo);
});
