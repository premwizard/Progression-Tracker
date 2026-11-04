import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/heatmap.dart';
import '../network/dio_client.dart';
import '../network/heatmap_repository.dart';

// Repository Provider
final heatmapRepositoryProvider = Provider<HeatmapRepository>((ref) {
  DioClient? client;
  try {
    client = DioClient();
  } catch (_) {
    client = null;
  }
  return HeatmapRepository(client: client);
});

// Selected Year Filter (null = past 365 rolling days)
final heatmapYearFilterProvider = StateProvider<int?>((ref) => null);

// Selected Activity Filter (null = Overall platform progression)
final heatmapSelectedActivityIdProvider = StateProvider<String?>((ref) => null);

// Selected Date for Drilldown Inspector
final heatmapSelectedDateProvider = StateProvider<DateTime?>((ref) => null);

// Heatmap Grid Data Provider (recomputes when year or activity filter changes)
final heatmapGridDataProvider = FutureProvider<HeatmapGridData>((ref) async {
  final repo = ref.watch(heatmapRepositoryProvider);
  final year = ref.watch(heatmapYearFilterProvider);
  final activityId = ref.watch(heatmapSelectedActivityIdProvider);

  if (activityId != null) {
    return repo.getActivityHeatmap(activityId, year: year);
  } else {
    return repo.getOverallHeatmap(year: year);
  }
});

// Drilldown details for currently selected date
final heatmapDrilldownDetailsProvider =
    FutureProvider.autoDispose.family<HeatmapDrilldownResponse, DateTime>((ref, targetDate) async {
  final repo = ref.watch(heatmapRepositoryProvider);
  final activityId = ref.watch(heatmapSelectedActivityIdProvider);
  return repo.getDayDrilldown(targetDate, activityId: activityId);
});
