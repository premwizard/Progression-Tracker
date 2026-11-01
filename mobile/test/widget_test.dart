import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/models/activity.dart';
import 'package:mobile/core/models/session.dart';
import 'package:mobile/main.dart';

void main() {
  group('Progression Tracker Model & Math Tests', () {
    test('Activity & TodayProgress serialization', () {
      final json = {
        'id': 'act-101',
        'user_id': 'user-1',
        'name': 'Gym Workout',
        'category': 'Fitness',
        'tracking_methods': ['time', 'quantity'],
        'metric_unit': 'pushups',
        'daily_target': 60.0,
        'status': 'active',
        'created_at': '2026-11-01T10:00:00.000Z',
        'updated_at': '2026-11-01T10:00:00.000Z',
        'today_progress': {
          'duration_seconds': 1800,
          'quantity': 45.0,
          'completed': false,
          'progress_percent': 50.0,
        },
        'current_streak': 5,
      };

      final activity = Activity.fromJson(json);
      expect(activity.id, 'act-101');
      expect(activity.name, 'Gym Workout');
      expect(activity.trackingMethods, contains('time'));
      expect(activity.trackingMethods, contains('quantity'));
      expect(activity.todayProgress.durationSeconds, 1800);
      expect(activity.todayProgress.quantity, 45.0);
      expect(activity.currentStreak, 5);
    });

    test('ActivitySession timestamp-based live duration calculation', () {
      final now = DateTime.now();
      final startTime = now.subtract(const Duration(minutes: 30));

      final session = ActivitySession(
        id: 'session-1',
        activityId: 'act-101',
        userId: 'user-1',
        startTime: startTime,
        pausedDurationSeconds: 300, // 5 minutes paused
        status: 'running',
        createdAt: startTime,
        updatedAt: startTime,
      );

      // Should be approximately 30 min - 5 min = 25 min (1500 sec)
      final elapsed = session.liveElapsedSeconds;
      expect(elapsed, greaterThanOrEqualTo(1495));
      expect(elapsed, lessThanOrEqualTo(1505));
    });
  });

  testWidgets('ProgressionTrackerApp widget smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: ProgressionTrackerApp(),
      ),
    );

    await tester.pump();
    expect(find.text('DASHBOARD'), findsOneWidget);
  });
}
