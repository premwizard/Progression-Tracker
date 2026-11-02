class HeatmapDayCell {
  final DateTime date;
  final int intensityLevel; // 0 to 4
  final int totalDurationSeconds;
  final double totalQuantity;
  final int completionsCount;
  final bool isActive;

  const HeatmapDayCell({
    required this.date,
    this.intensityLevel = 0,
    this.totalDurationSeconds = 0,
    this.totalQuantity = 0.0,
    this.completionsCount = 0,
    this.isActive = false,
  });

  factory HeatmapDayCell.fromJson(Map<String, dynamic> json) {
    return HeatmapDayCell(
      date: DateTime.parse(json['date'] as String),
      intensityLevel: (json['intensity_level'] as num?)?.toInt() ?? 0,
      totalDurationSeconds: (json['total_duration_seconds'] as num?)?.toInt() ?? 0,
      totalQuantity: (json['total_quantity'] as num?)?.toDouble() ?? 0.0,
      completionsCount: (json['completions_count'] as num?)?.toInt() ?? 0,
      isActive: json['is_active'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'date': '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}',
    'intensity_level': intensityLevel,
    'total_duration_seconds': totalDurationSeconds,
    'total_quantity': totalQuantity,
    'completions_count': completionsCount,
    'is_active': isActive,
  };
}

class HeatmapActivityInfo {
  final String id;
  final String name;
  final String color;
  final String icon;
  final String category;
  final String? metricUnit;
  final double? dailyTarget;
  final List<String> trackingMethods;
  final Map<String, dynamic> heatmapConfig;

  const HeatmapActivityInfo({
    required this.id,
    required this.name,
    required this.color,
    required this.icon,
    required this.category,
    this.metricUnit,
    this.dailyTarget,
    this.trackingMethods = const [],
    this.heatmapConfig = const {},
  });

  factory HeatmapActivityInfo.fromJson(Map<String, dynamic> json) {
    return HeatmapActivityInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      color: json['color'] as String? ?? '#F97316',
      icon: json['icon'] as String? ?? 'activity',
      category: json['category'] as String? ?? 'Personal',
      metricUnit: json['metric_unit'] as String?,
      dailyTarget: (json['daily_target'] as num?)?.toDouble(),
      trackingMethods: (json['tracking_methods'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      heatmapConfig: json['heatmap_config'] as Map<String, dynamic>? ?? const {},
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'color': color,
    'icon': icon,
    'category': category,
    'metric_unit': metricUnit,
    'daily_target': dailyTarget,
    'tracking_methods': trackingMethods,
    'heatmap_config': heatmapConfig,
  };
}

class HeatmapGridData {
  final DateTime startDate;
  final DateTime endDate;
  final int totalDays;
  final int activeDays;
  final double consistencyPercentage;
  final int currentStreak;
  final int longestStreak;
  final int totalDurationSeconds;
  final double totalQuantity;
  final int totalCompletions;
  final HeatmapActivityInfo? activity;
  final Map<String, int> levelCounts;
  final List<HeatmapDayCell> cells;

  const HeatmapGridData({
    required this.startDate,
    required this.endDate,
    required this.totalDays,
    required this.activeDays,
    required this.consistencyPercentage,
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.totalDurationSeconds = 0,
    this.totalQuantity = 0.0,
    this.totalCompletions = 0,
    this.activity,
    this.levelCounts = const {'0': 0, '1': 0, '2': 0, '3': 0, '4': 0},
    this.cells = const [],
  });

  factory HeatmapGridData.fromJson(Map<String, dynamic> json) {
    final rawLevelCounts = json['level_counts'] as Map<String, dynamic>? ?? {};
    final levelCounts = rawLevelCounts.map((k, v) => MapEntry(k, (v as num).toInt()));

    return HeatmapGridData(
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: DateTime.parse(json['end_date'] as String),
      totalDays: (json['total_days'] as num?)?.toInt() ?? 0,
      activeDays: (json['active_days'] as num?)?.toInt() ?? 0,
      consistencyPercentage: (json['consistency_percentage'] as num?)?.toDouble() ?? 0.0,
      currentStreak: (json['current_streak'] as num?)?.toInt() ?? 0,
      longestStreak: (json['longest_streak'] as num?)?.toInt() ?? 0,
      totalDurationSeconds: (json['total_duration_seconds'] as num?)?.toInt() ?? 0,
      totalQuantity: (json['total_quantity'] as num?)?.toDouble() ?? 0.0,
      totalCompletions: (json['total_completions'] as num?)?.toInt() ?? 0,
      activity: json['activity'] != null
          ? HeatmapActivityInfo.fromJson(json['activity'] as Map<String, dynamic>)
          : null,
      levelCounts: levelCounts,
      cells: (json['cells'] as List<dynamic>?)
              ?.map((e) => HeatmapDayCell.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  Map<String, dynamic> toJson() => {
    'start_date': '${startDate.year.toString().padLeft(4, '0')}-${startDate.month.toString().padLeft(2, '0')}-${startDate.day.toString().padLeft(2, '0')}',
    'end_date': '${endDate.year.toString().padLeft(4, '0')}-${endDate.month.toString().padLeft(2, '0')}-${endDate.day.toString().padLeft(2, '0')}',
    'total_days': totalDays,
    'active_days': activeDays,
    'consistency_percentage': consistencyPercentage,
    'current_streak': currentStreak,
    'longest_streak': longestStreak,
    'total_duration_seconds': totalDurationSeconds,
    'total_quantity': totalQuantity,
    'total_completions': totalCompletions,
    'activity': activity?.toJson(),
    'level_counts': levelCounts,
    'cells': cells.map((c) => c.toJson()).toList(),
  };
}

class DaySessionDrilldown {
  final String id;
  final DateTime startTime;
  final DateTime? endTime;
  final int durationSeconds;
  final String status;
  final String? notes;

  const DaySessionDrilldown({
    required this.id,
    required this.startTime,
    this.endTime,
    this.durationSeconds = 0,
    required this.status,
    this.notes,
  });

  factory DaySessionDrilldown.fromJson(Map<String, dynamic> json) {
    return DaySessionDrilldown(
      id: json['id'] as String,
      startTime: DateTime.parse(json['start_time'] as String),
      endTime: json['end_time'] != null ? DateTime.parse(json['end_time'] as String) : null,
      durationSeconds: (json['duration_seconds'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'completed',
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'start_time': startTime.toIso8601String(),
    'end_time': endTime?.toIso8601String(),
    'duration_seconds': durationSeconds,
    'status': status,
    'notes': notes,
  };
}

class DayLogDrilldown {
  final String id;
  final String trackingMethod;
  final double? quantityValue;
  final bool isCompleted;
  final String? notes;

  const DayLogDrilldown({
    required this.id,
    required this.trackingMethod,
    this.quantityValue,
    this.isCompleted = false,
    this.notes,
  });

  factory DayLogDrilldown.fromJson(Map<String, dynamic> json) {
    return DayLogDrilldown(
      id: json['id'] as String,
      trackingMethod: json['tracking_method'] as String,
      quantityValue: (json['quantity_value'] as num?)?.toDouble(),
      isCompleted: json['is_completed'] as bool? ?? false,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'tracking_method': trackingMethod,
    'quantity_value': quantityValue,
    'is_completed': isCompleted,
    'notes': notes,
  };
}

class DayActivityDrilldown {
  final String activityId;
  final String activityName;
  final String activityColor;
  final String activityIcon;
  final String activityCategory;
  final String? metricUnit;
  final int totalDurationSeconds;
  final double totalQuantity;
  final bool isCompleted;
  final int intensityLevel;
  final List<DaySessionDrilldown> sessions;
  final List<DayLogDrilldown> logs;

  const DayActivityDrilldown({
    required this.activityId,
    required this.activityName,
    required this.activityColor,
    required this.activityIcon,
    required this.activityCategory,
    this.metricUnit,
    this.totalDurationSeconds = 0,
    this.totalQuantity = 0.0,
    this.isCompleted = false,
    this.intensityLevel = 0,
    this.sessions = const [],
    this.logs = const [],
  });

  factory DayActivityDrilldown.fromJson(Map<String, dynamic> json) {
    return DayActivityDrilldown(
      activityId: json['activity_id'] as String,
      activityName: json['activity_name'] as String,
      activityColor: json['activity_color'] as String? ?? '#F97316',
      activityIcon: json['activity_icon'] as String? ?? 'activity',
      activityCategory: json['activity_category'] as String? ?? 'Personal',
      metricUnit: json['metric_unit'] as String?,
      totalDurationSeconds: (json['total_duration_seconds'] as num?)?.toInt() ?? 0,
      totalQuantity: (json['total_quantity'] as num?)?.toDouble() ?? 0.0,
      isCompleted: json['is_completed'] as bool? ?? false,
      intensityLevel: (json['intensity_level'] as num?)?.toInt() ?? 0,
      sessions: (json['sessions'] as List<dynamic>?)
              ?.map((e) => DaySessionDrilldown.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      logs: (json['logs'] as List<dynamic>?)
              ?.map((e) => DayLogDrilldown.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  Map<String, dynamic> toJson() => {
    'activity_id': activityId,
    'activity_name': activityName,
    'activity_color': activityColor,
    'activity_icon': activityIcon,
    'activity_category': activityCategory,
    'metric_unit': metricUnit,
    'total_duration_seconds': totalDurationSeconds,
    'total_quantity': totalQuantity,
    'is_completed': isCompleted,
    'intensity_level': intensityLevel,
    'sessions': sessions.map((s) => s.toJson()).toList(),
    'logs': logs.map((l) => l.toJson()).toList(),
  };
}

class HeatmapDrilldownResponse {
  final DateTime targetDate;
  final int overallIntensity;
  final int totalDurationSeconds;
  final double totalQuantity;
  final int totalCompletions;
  final List<DayActivityDrilldown> activities;

  const HeatmapDrilldownResponse({
    required this.targetDate,
    this.overallIntensity = 0,
    this.totalDurationSeconds = 0,
    this.totalQuantity = 0.0,
    this.totalCompletions = 0,
    this.activities = const [],
  });

  factory HeatmapDrilldownResponse.fromJson(Map<String, dynamic> json) {
    return HeatmapDrilldownResponse(
      targetDate: DateTime.parse(json['target_date'] as String),
      overallIntensity: (json['overall_intensity'] as num?)?.toInt() ?? 0,
      totalDurationSeconds: (json['total_duration_seconds'] as num?)?.toInt() ?? 0,
      totalQuantity: (json['total_quantity'] as num?)?.toDouble() ?? 0.0,
      totalCompletions: (json['total_completions'] as num?)?.toInt() ?? 0,
      activities: (json['activities'] as List<dynamic>?)
              ?.map((e) => DayActivityDrilldown.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }

  Map<String, dynamic> toJson() => {
    'target_date': '${targetDate.year.toString().padLeft(4, '0')}-${targetDate.month.toString().padLeft(2, '0')}-${targetDate.day.toString().padLeft(2, '0')}',
    'overall_intensity': overallIntensity,
    'total_duration_seconds': totalDurationSeconds,
    'total_quantity': totalQuantity,
    'total_completions': totalCompletions,
    'activities': activities.map((a) => a.toJson()).toList(),
  };
}
