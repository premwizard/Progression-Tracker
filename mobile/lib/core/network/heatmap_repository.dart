import 'package:dio/dio.dart';
import '../models/heatmap.dart';
import 'dio_client.dart';

class HeatmapRepository {
  final DioClient? _client;

  HeatmapRepository({DioClient? client}) : _client = client;

  /// Retrieve the overall aggregated progression heatmap grid.
  Future<HeatmapGridData> getOverallHeatmap({
    int? year,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    if (_client == null) {
      return _generateFallbackGrid(startDate: startDate, endDate: endDate, year: year);
    }
    try {
      final query = <String, dynamic>{};
      if (year != null) query['year'] = year;
      if (startDate != null) {
        query['start_date'] =
            '${startDate.year.toString().padLeft(4, '0')}-${startDate.month.toString().padLeft(2, '0')}-${startDate.day.toString().padLeft(2, '0')}';
      }
      if (endDate != null) {
        query['end_date'] =
            '${endDate.year.toString().padLeft(4, '0')}-${endDate.month.toString().padLeft(2, '0')}-${endDate.day.toString().padLeft(2, '0')}';
      }

      final response = await _client!.dio.get('/heatmaps/overall', queryParameters: query);
      return HeatmapGridData.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      // Offline fallback: generate mock continuous 365-day grid
      return _generateFallbackGrid(
        startDate: startDate,
        endDate: endDate,
        year: year,
      );
    }
  }

  /// Retrieve a specific activity's progression heatmap grid with custom thresholds.
  Future<HeatmapGridData> getActivityHeatmap(
    String activityId, {
    int? year,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    if (_client == null) {
      return _generateFallbackGrid(startDate: startDate, endDate: endDate, year: year, activityId: activityId);
    }
    try {
      final query = <String, dynamic>{};
      if (year != null) query['year'] = year;
      if (startDate != null) {
        query['start_date'] =
            '${startDate.year.toString().padLeft(4, '0')}-${startDate.month.toString().padLeft(2, '0')}-${startDate.day.toString().padLeft(2, '0')}';
      }
      if (endDate != null) {
        query['end_date'] =
            '${endDate.year.toString().padLeft(4, '0')}-${endDate.month.toString().padLeft(2, '0')}-${endDate.day.toString().padLeft(2, '0')}';
      }

      final response =
          await _client!.dio.get('/heatmaps/activity/$activityId', queryParameters: query);
      return HeatmapGridData.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return _generateFallbackGrid(
        startDate: startDate,
        endDate: endDate,
        year: year,
        activityId: activityId,
      );
    }
  }

  /// Retrieve drilldown details for a specific date.
  Future<HeatmapDrilldownResponse> getDayDrilldown(
    DateTime date, {
    String? activityId,
  }) async {
    if (_client == null) {
      return _fallbackDrilldown(date, activityId);
    }
    final dateStr =
        '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    try {
      final query = <String, dynamic>{'date': dateStr};
      if (activityId != null) query['activity_id'] = activityId;

      final response = await _client!.dio.get('/heatmaps/drilldown', queryParameters: query);
      return HeatmapDrilldownResponse.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      return _fallbackDrilldown(date, activityId);
    }
  }

  HeatmapDrilldownResponse _fallbackDrilldown(DateTime date, String? activityId) {
    return HeatmapDrilldownResponse(
      targetDate: date,
      overallIntensity: 2,
      totalDurationSeconds: 3600,
      totalQuantity: 25.0,
      totalCompletions: 1,
      activities: [
        DayActivityDrilldown(
          activityId: activityId ?? 'offline-act-1',
          activityName: 'Focus Session',
          activityColor: '#F97316',
          activityIcon: 'code',
          activityCategory: 'Projects',
          totalDurationSeconds: 3600,
          intensityLevel: 2,
          isCompleted: true,
          sessions: [
            DaySessionDrilldown(
              id: 'sess-1',
              startTime: DateTime(date.year, date.month, date.day, 10, 0),
              endTime: DateTime(date.year, date.month, date.day, 11, 0),
              durationSeconds: 3600,
              status: 'completed',
              notes: 'Deep focus architecture work',
            ),
          ],
        ),
      ],
    );
  }

  /// Generates a realistic 365-day grid for offline demo or preview.
  HeatmapGridData _generateFallbackGrid({
    DateTime? startDate,
    DateTime? endDate,
    int? year,
    String? activityId,
  }) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    DateTime end = endDate != null ? DateTime(endDate.year, endDate.month, endDate.day) : today;
    DateTime start = startDate != null
        ? DateTime(startDate.year, startDate.month, startDate.day)
        : end.subtract(const Duration(days: 364));

    if (year != null) {
      start = DateTime(year, 1, 1);
      end = DateTime(year, 12, 31);
    }

    final cells = <HeatmapDayCell>[];
    final levelCounts = {'0': 0, '1': 0, '2': 0, '3': 0, '4': 0};
    int activeDays = 0;
    int totalDuration = 0;
    double totalQty = 0.0;
    int totalComps = 0;

    DateTime curr = start;
    int dayIndex = 0;
    while (!curr.isAfter(end)) {
      // Deterministic synthetic activity pattern for demo
      final weekday = curr.weekday; // 1 = Mon, 7 = Sun
      final isWeekend = weekday == 6 || weekday == 7;
      final seed = (curr.millisecondsSinceEpoch ~/ 86400000) % 10;
      
      int level = 0;
      if (!isWeekend) {
        if (seed >= 2 && seed <= 4) level = 1;
        if (seed >= 5 && seed <= 7) level = 2;
        if (seed == 8) level = 3;
        if (seed == 9) level = 4;
      } else if (seed >= 6) {
        level = 1;
      }

      final isActive = level > 0;
      final dur = level * 1800;
      final qty = level * 15.0;
      final comp = level >= 2 ? 1 : 0;

      cells.add(HeatmapDayCell(
        date: curr,
        intensityLevel: level,
        totalDurationSeconds: dur,
        totalQuantity: qty,
        completionsCount: comp,
        isActive: isActive,
      ));

      levelCounts[level.toString()] = (levelCounts[level.toString()] ?? 0) + 1;
      if (isActive) activeDays++;
      totalDuration += dur;
      totalQty += qty;
      totalComps += comp;

      curr = curr.add(const Duration(days: 1));
      dayIndex++;
    }

    final consistency = cells.isNotEmpty ? (activeDays / cells.length) * 100.0 : 0.0;

    return HeatmapGridData(
      startDate: start,
      endDate: end,
      totalDays: cells.length,
      activeDays: activeDays,
      consistencyPercentage: double.parse(consistency.toStringAsFixed(1)),
      currentStreak: 4,
      longestStreak: 16,
      totalDurationSeconds: totalDuration,
      totalQuantity: totalQty,
      totalCompletions: totalComps,
      levelCounts: levelCounts,
      cells: cells,
    );
  }
}
