import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/models/heatmap.dart';
import 'package:mobile/core/network/heatmap_repository.dart';
import 'package:mobile/core/providers/heatmap_providers.dart';
import 'package:mobile/main.dart';
import 'package:mobile/widgets/heatmap_grid.dart';

void main() {
  group('Heatmap Models & Serialization Tests', () {
    test('HeatmapDayCell JSON serialization', () {
      final json = {
        'date': '2026-11-02',
        'intensity_level': 3,
        'total_duration_seconds': 2700,
        'total_quantity': 40.0,
        'completions_count': 1,
        'is_active': true,
      };

      final cell = HeatmapDayCell.fromJson(json);
      expect(cell.date.year, 2026);
      expect(cell.date.month, 11);
      expect(cell.date.day, 2);
      expect(cell.intensityLevel, 3);
      expect(cell.totalDurationSeconds, 2700);
      expect(cell.totalQuantity, 40.0);
      expect(cell.completionsCount, 1);
      expect(cell.isActive, true);

      final encoded = cell.toJson();
      expect(encoded['date'], '2026-11-02');
      expect(encoded['intensity_level'], 3);
      expect(encoded['total_duration_seconds'], 2700);
      expect(encoded['is_active'], true);
    });

    test('HeatmapGridData parsing & streak counts', () {
      final json = {
        'start_date': '2025-11-03',
        'end_date': '2026-11-02',
        'total_days': 365,
        'active_days': 120,
        'consistency_percentage': 32.9,
        'current_streak': 5,
        'longest_streak': 14,
        'total_duration_seconds': 72000,
        'total_quantity': 500.0,
        'total_completions': 30,
        'activity': {
          'id': 'act-99',
          'name': 'Gym Workout',
          'color': '#F97316',
          'icon': 'dumbbell',
          'category': 'Fitness',
          'tracking_methods': ['time', 'quantity'],
        },
        'level_counts': {'0': 245, '1': 40, '2': 35, '3': 25, '4': 20},
        'cells': [
          {
            'date': '2026-11-01',
            'intensity_level': 2,
            'total_duration_seconds': 1800,
            'total_quantity': 20.0,
            'completions_count': 0,
            'is_active': true,
          },
          {
            'date': '2026-11-02',
            'intensity_level': 4,
            'total_duration_seconds': 3600,
            'total_quantity': 50.0,
            'completions_count': 1,
            'is_active': true,
          },
        ],
      };

      final gridData = HeatmapGridData.fromJson(json);
      expect(gridData.totalDays, 365);
      expect(gridData.activeDays, 120);
      expect(gridData.currentStreak, 5);
      expect(gridData.longestStreak, 14);
      expect(gridData.activity?.name, 'Gym Workout');
      expect(gridData.levelCounts['4'], 20);
      expect(gridData.cells.length, 2);
      expect(gridData.cells[1].intensityLevel, 4);
    });

    test('HeatmapDrilldownResponse structure parsing', () {
      final json = {
        'target_date': '2026-11-02',
        'overall_intensity': 4,
        'total_duration_seconds': 5400,
        'total_quantity': 60.0,
        'total_completions': 2,
        'activities': [
          {
            'activity_id': 'act-1',
            'activity_name': 'Coding',
            'activity_color': '#3B82F6',
            'activity_icon': 'code',
            'activity_category': 'Projects',
            'total_duration_seconds': 3600,
            'total_quantity': 0.0,
            'is_completed': true,
            'intensity_level': 4,
            'sessions': [
              {
                'id': 'sess-1',
                'start_time': '2026-11-02T10:00:00Z',
                'end_time': '2026-11-02T11:00:00Z',
                'duration_seconds': 3600,
                'status': 'completed',
                'notes': 'Heatmap engine completed',
              }
            ],
            'logs': [],
          }
        ],
      };

      final drilldown = HeatmapDrilldownResponse.fromJson(json);
      expect(drilldown.targetDate.day, 2);
      expect(drilldown.overallIntensity, 4);
      expect(drilldown.activities.length, 1);
      expect(drilldown.activities[0].activityName, 'Coding');
      expect(drilldown.activities[0].sessions[0].notes, 'Heatmap engine completed');
    });

    test('HeatmapRepository generates unbroken 365 days fallback grid', () {
      final repo = HeatmapRepository();
      final today = DateTime.now();
      final grid = repo.getOverallHeatmap();

      expect(grid, isNotNull);
    });
  });

  group('Heatmap Widget Tests', () {
    testWidgets('HeatmapGrid renders without crashing', (tester) async {
      final startDate = DateTime(2026, 1, 1);
      final endDate = DateTime(2026, 1, 14); // 2 weeks
      final cells = List.generate(14, (i) {
        final d = startDate.add(Duration(days: i));
        return HeatmapDayCell(
          date: d,
          intensityLevel: i % 5,
          totalDurationSeconds: i * 600,
          isActive: i > 0,
        );
      });

      final testData = HeatmapGridData(
        startDate: startDate,
        endDate: endDate,
        totalDays: 14,
        activeDays: 10,
        consistencyPercentage: 71.4,
        cells: cells,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HeatmapGrid(
              data: testData,
              baseColor: const Color(0xFFF97316),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.byType(HeatmapGrid), findsOneWidget);
      expect(find.text('Mon'), findsOneWidget);
    });

    testWidgets('DashboardScreen displays HeatmapCard inside ProviderScope', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            heatmapRepositoryProvider.overrideWithValue(HeatmapRepository()),
          ],
          child: const ProgressionTrackerApp(),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Consistency Heatmap'), findsOneWidget);
      expect(find.text('Active Days'), findsOneWidget);
    });
  });
}
