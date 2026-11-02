import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/models/activity.dart';
import 'package:mobile/core/network/heatmap_repository.dart';
import 'package:mobile/core/network/tracking_repository.dart';
import 'package:mobile/core/providers/activity_providers.dart';
import 'package:mobile/core/providers/heatmap_providers.dart';
import 'package:mobile/core/services/timer_service.dart';
import 'package:mobile/screens/timer_screen.dart';
import 'package:mobile/widgets/floating_timer_bar.dart';

void main() {
  group('Resilient Timestamp Timer Engine Mathematical Tests', () {
    test('Initial state math returns 0 elapsed seconds', () {
      final state = TimerState.initial();
      expect(state.status, TimerStatus.idle);
      expect(state.liveElapsedSeconds, 0);
      expect(state.formattedDuration, '00:00');
    });

    test('Live running timer computes deterministic wall-clock elapsed duration', () {
      final now = DateTime.now();
      // Start time was exactly 25 minutes (1500 seconds) ago
      final startTime = now.subtract(const Duration(minutes: 25));

      final state = TimerState(
        status: TimerStatus.running,
        activityId: 'act-1',
        activityName: 'Coding',
        startTime: startTime,
        pausedDurationSeconds: 0,
      );

      final elapsed = state.liveElapsedSeconds;
      expect(elapsed, greaterThanOrEqualTo(1499));
      expect(elapsed, lessThanOrEqualTo(1502));
      expect(state.formattedDuration, '25:00');
    });

    test('Paused timer freezes elapsed time exactly at pause moment', () {
      final startTime = DateTime(2026, 11, 2, 10, 0, 0);
      final pauseTime = DateTime(2026, 11, 2, 10, 35, 0); // Paused after 35 mins

      final state = TimerState(
        status: TimerStatus.paused,
        activityId: 'act-1',
        activityName: 'Deep Work',
        startTime: startTime,
        currentPauseStartTime: pauseTime,
        pausedDurationSeconds: 0,
      );

      expect(state.liveElapsedSeconds, 35 * 60); // exactly 2100 seconds
      expect(state.formattedDuration, '35:00');
    });

    test('Multiple pause intervals deduct correctly from total elapsed duration', () {
      // 60 minutes elapsed since start, but 15 minutes was paused in previous intervals
      final now = DateTime.now();
      final startTime = now.subtract(const Duration(minutes: 60));

      final state = TimerState(
        status: TimerStatus.running,
        activityId: 'act-1',
        activityName: 'Gym',
        startTime: startTime,
        pausedDurationSeconds: 15 * 60, // 15 mins paused
      );

      final elapsed = state.liveElapsedSeconds;
      // Net active time = 60 - 15 = 45 mins (2700 sec)
      expect(elapsed, greaterThanOrEqualTo(2698));
      expect(elapsed, lessThanOrEqualTo(2702));
      expect(state.formattedDuration, '45:00');
    });

    test('Target progress percentage calculates correctly', () {
      final now = DateTime.now();
      final startTime = now.subtract(const Duration(minutes: 30));

      final state = TimerState(
        status: TimerStatus.running,
        activityId: 'act-1',
        activityName: 'Study',
        startTime: startTime,
        dailyTargetMinutes: 60.0, // 60 min target
      );

      // 30 / 60 = 50.0%
      expect(state.targetProgressPercent, closeTo(50.0, 1.0));
    });

    test('Simulated crash / phone reboot recovery via JSON serialization', () {
      final startTime = DateTime(2026, 11, 2, 14, 0, 0);
      final state = TimerState(
        status: TimerStatus.running,
        sessionId: 'sess-abc-123',
        activityId: 'act-99',
        activityName: 'Marathon Training',
        activityColor: '#10B981',
        activityIcon: 'activity',
        startTime: startTime,
        pausedDurationSeconds: 120,
        notes: 'Steady cadence test',
        dailyTargetMinutes: 45.0,
      );

      final json = state.toJson();
      final restored = TimerState.fromJson(json);

      expect(restored.status, TimerStatus.running);
      expect(restored.sessionId, 'sess-abc-123');
      expect(restored.activityName, 'Marathon Training');
      expect(restored.activityColor, '#10B981');
      expect(restored.pausedDurationSeconds, 120);
      expect(restored.notes, 'Steady cadence test');
      expect(restored.dailyTargetMinutes, 45.0);
    });
  });

  group('Timer UI Widget Tests', () {
    testWidgets('TimerScreen renders dial and controls properly', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            heatmapRepositoryProvider.overrideWithValue(HeatmapRepository()),
          ],
          child: const MaterialApp(
            home: TimerScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Focus Timer'), findsOneWidget);
      expect(find.text('START SESSION'), findsOneWidget);
      expect(find.text('Ready to Start'), findsOneWidget);
    });

    testWidgets('FloatingTimerBar appears when timer is active and hides when idle', (tester) async {
      // 1. Idle state -> bar is hidden
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              bottomNavigationBar: FloatingTimerBar(),
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.text('Active Session'), findsNothing);

      // 2. Active state -> bar is visible
      final container = ProviderContainer(
        overrides: [
          trackingRepositoryProvider.overrideWithValue(TrackingRepository()),
        ],
      );
      final dummyCreated = DateTime(2026, 1, 1);
      container.read(timerProvider.notifier).startTimer(
            Activity(
              id: 'test-act',
              userId: 'u1',
              name: 'Deep Focus Test',
              color: '#3B82F6',
              createdAt: dummyCreated,
              updatedAt: dummyCreated,
            ),
          );

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: Scaffold(
              bottomNavigationBar: FloatingTimerBar(),
            ),
          ),
        ),
      );

      await tester.pump();
      expect(find.text('Deep Focus Test'), findsOneWidget);
      expect(find.byIcon(Icons.pause_rounded), findsOneWidget);

      await container.read(timerProvider.notifier).discardTimer();
      container.dispose();
    });
  });
}
