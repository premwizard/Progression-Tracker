import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/models/goal.dart';
import 'package:mobile/core/network/activity_repository.dart';
import 'package:mobile/core/network/goal_repository.dart';
import 'package:mobile/core/network/heatmap_repository.dart';
import 'package:mobile/core/network/tracking_repository.dart';
import 'package:mobile/core/providers/activity_providers.dart';
import 'package:mobile/core/providers/goal_providers.dart';
import 'package:mobile/core/providers/heatmap_providers.dart';
import 'package:mobile/core/services/sync_service.dart';
import 'package:mobile/core/services/timer_service.dart';
import 'package:mobile/core/storage/hive_storage.dart';
import 'package:mobile/screens/main_navigation_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Phase 4: Goal & Task Model Unit Tests', () {
    test('TaskItem serialization and copyWith', () {
      final task = TaskItem(
        id: 'task-1',
        goalId: 'goal-1',
        title: 'Build Sync Queue',
        isCompleted: false,
        orderIndex: 0,
        createdAt: DateTime.parse('2026-11-04T12:00:00.000Z'),
      );

      final json = task.toJson();
      expect(json['id'], 'task-1');
      expect(json['title'], 'Build Sync Queue');
      expect(json['is_completed'], false);

      final parsed = TaskItem.fromJson(json);
      expect(parsed.id, task.id);
      expect(parsed.title, task.title);

      final completed = parsed.copyWith(isCompleted: true);
      expect(completed.isCompleted, true);
      expect(completed.title, task.title);
    });

    test('Goal serialization and progress calculation', () {
      final goal = Goal(
        id: 'goal-101',
        userId: 'user-1',
        title: 'Master Flutter',
        category: 'Engineering',
        priority: 'high',
        progressPercent: 50.0,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        tasks: [
          TaskItem(
            id: 't-1',
            goalId: 'goal-101',
            title: 'Learn Riverpod',
            isCompleted: true,
            createdAt: DateTime.now(),
          ),
          TaskItem(
            id: 't-2',
            goalId: 'goal-101',
            title: 'Offline Sync Queue',
            isCompleted: false,
            createdAt: DateTime.now(),
          ),
        ],
      );

      final json = goal.toJson();
      expect(json['id'], 'goal-101');
      expect((json['tasks'] as List).length, 2);

      final parsed = Goal.fromJson(json);
      expect(parsed.id, 'goal-101');
      expect(parsed.tasks.first.isCompleted, true);
      expect(parsed.tasks.last.isCompleted, false);
    });
  });

  group('Phase 4: SyncQueueItem Model Tests', () {
    test('SyncQueueItem serialization & copyWith retry count', () {
      final item = SyncQueueItem(
        id: 'sync-1',
        endpoint: '/tracking/sessions/start',
        method: 'POST',
        payload: {'activity_id': 'act-1', 'notes': 'Test run'},
        timestamp: DateTime.parse('2026-11-04T12:00:00.000Z'),
        retryCount: 0,
      );

      final json = item.toJson();
      expect(json['id'], 'sync-1');
      expect(json['endpoint'], '/tracking/sessions/start');
      expect(json['payload']['activity_id'], 'act-1');

      final fromJson = SyncQueueItem.fromJson(json);
      expect(fromJson.id, 'sync-1');
      expect(fromJson.retryCount, 0);

      final retried = fromJson.copyWith(retryCount: 1);
      expect(retried.retryCount, 1);
      expect(retried.endpoint, fromJson.endpoint);
    });

    test('SyncNotifier handles queue mutation in offline mock mode', () async {
      final notifier = SyncNotifier(client: null);
      expect(notifier.state.isSyncing, false);

      await notifier.queueMutation(
        endpoint: '/tracking/quantity',
        method: 'POST',
        payload: {'activity_id': 'act-1', 'quantity_value': 10.0},
      );

      // In mock mode without client, sync completes immediately
      expect(notifier.state.isSyncing, false);
      expect(notifier.state.lastSyncTime, isNotNull);
    });
  });

  group('Phase 4: 5-Tab Navigation Widget Tests', () {
    Widget createWidgetTree({TimerState? customTimerState}) {
      return ProviderScope(
        overrides: [
          heatmapRepositoryProvider.overrideWithValue(HeatmapRepository(client: null)),
          activityRepositoryProvider.overrideWithValue(ActivityRepository(client: null)),
          trackingRepositoryProvider.overrideWithValue(TrackingRepository(client: null)),
          goalRepositoryProvider.overrideWithValue(GoalRepository(client: null)),
          if (customTimerState != null)
            timerProvider.overrideWith((ref) => TimerNotifier(initialState: customTimerState)),
        ],
        child: const MaterialApp(
          home: MainNavigationScreen(),
        ),
      );
    }

    testWidgets('MainNavigationScreen displays all 5 tabs and initial dashboard', (tester) async {
      await tester.pumpWidget(createWidgetTree());
      await tester.pumpAndSettle();

      // Tab labels on NavigationBar
      expect(find.text('Dashboard'), findsWidgets);
      expect(find.text('Activities'), findsOneWidget);
      expect(find.text('Timer'), findsOneWidget);
      expect(find.text('Goals'), findsOneWidget);
      expect(find.text('Analytics'), findsOneWidget);

      // Header on Dashboard Tab
      expect(find.text('DASHBOARD'), findsOneWidget);
    });

    testWidgets('Switching tabs updates view to Activities, Goals, and Analytics', (tester) async {
      await tester.pumpWidget(createWidgetTree());
      await tester.pumpAndSettle();

      // Tap Tab 1: Activities
      await tester.tap(find.text('Activities'));
      await tester.pumpAndSettle();
      expect(find.text('ACTIVITIES & TRACKS'), findsOneWidget);

      // Tap Tab 3: Goals
      await tester.tap(find.text('Goals'));
      await tester.pumpAndSettle();
      expect(find.text('OBJECTIVES & ROADMAP'), findsOneWidget);

      // Tap Tab 4: Analytics
      await tester.tap(find.text('Analytics'));
      await tester.pumpAndSettle();
      expect(find.text('INTELLIGENCE & SETTINGS'), findsOneWidget);
      expect(find.text('Offline Resilience & Sync'), findsOneWidget);
    });

    testWidgets('FloatingTimerBar appears when timer is active on dashboard and hides on timer tab', (tester) async {
      final runningTimer = TimerState(
        status: TimerStatus.running,
        activityId: 'act-1',
        activityName: 'Deep Work Focus',
        activityColor: '#3B82F6',
        startTime: DateTime.now().subtract(const Duration(minutes: 15)),
        accumulatedPauseSeconds: 0,
      );

      await tester.pumpWidget(createWidgetTree(customTimerState: runningTimer));
      await tester.pumpAndSettle();

      // On Tab 0 (Dashboard), floating mini-timer bar is visible
      expect(find.text('Deep Work Focus'), findsOneWidget);

      // Switch to Tab 2 (Timer)
      await tester.tap(find.text('Timer'));
      await tester.pumpAndSettle();

      // On Tab 2, FloatingTimerBar is hidden, but full-screen TimerScreen is visible
      expect(find.text('Focus Timer'), findsOneWidget);
      expect(find.byType(FloatingTimerBar), findsNothing);

      // Switch to Tab 4 (Analytics)
      await tester.tap(find.text('Analytics'));
      await tester.pumpAndSettle();

      // FloatingTimerBar reappears
      expect(find.byType(FloatingTimerBar), findsOneWidget);
    });
  });
}
