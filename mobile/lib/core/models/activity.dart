class TodayProgress {
  final int durationSeconds;
  final double quantity;
  final bool completed;
  final double progressPercent;

  const TodayProgress({
    this.durationSeconds = 0,
    this.quantity = 0.0,
    this.completed = false,
    this.progressPercent = 0.0,
  });

  factory TodayProgress.fromJson(Map<String, dynamic> json) {
    return TodayProgress(
      durationSeconds: (json['duration_seconds'] as num?)?.toInt() ?? 0,
      quantity: (json['quantity'] as num?)?.toDouble() ?? 0.0,
      completed: json['completed'] as bool? ?? false,
      progressPercent: (json['progress_percent'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'duration_seconds': durationSeconds,
    'quantity': quantity,
    'completed': completed,
    'progress_percent': progressPercent,
  };
}

class Activity {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final String icon;
  final String color;
  final String category;
  final List<String> trackingMethods;
  final String? metricUnit;
  final double? dailyTarget;
  final double? weeklyTarget;
  final String status;
  final Map<String, dynamic> heatmapConfig;
  final Map<String, dynamic>? reminderConfig;
  final DateTime createdAt;
  final DateTime updatedAt;
  final TodayProgress todayProgress;
  final int currentStreak;

  const Activity({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    this.icon = 'dumbbell',
    this.color = '#F97316',
    this.category = 'Personal',
    this.trackingMethods = const ['time'],
    this.metricUnit,
    this.dailyTarget,
    this.weeklyTarget,
    this.status = 'active',
    this.heatmapConfig = const {},
    this.reminderConfig,
    required this.createdAt,
    required this.updatedAt,
    this.todayProgress = const TodayProgress(),
    this.currentStreak = 0,
  });

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      id: json['id'] as String,
      userId: json['user_id'] as String? ?? '',
      name: json['name'] as String,
      description: json['description'] as String?,
      icon: json['icon'] as String? ?? 'dumbbell',
      color: json['color'] as String? ?? '#F97316',
      category: json['category'] as String? ?? 'Personal',
      trackingMethods: (json['tracking_methods'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const ['time'],
      metricUnit: json['metric_unit'] as String?,
      dailyTarget: (json['daily_target'] as num?)?.toDouble(),
      weeklyTarget: (json['weekly_target'] as num?)?.toDouble(),
      status: json['status'] as String? ?? 'active',
      heatmapConfig: (json['heatmap_config'] as Map<String, dynamic>?) ?? const {},
      reminderConfig: json['reminder_config'] as Map<String, dynamic>?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : DateTime.now(),
      todayProgress: json['today_progress'] != null
          ? TodayProgress.fromJson(json['today_progress'] as Map<String, dynamic>)
          : const TodayProgress(),
      currentStreak: (json['current_streak'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'name': name,
    'description': description,
    'icon': icon,
    'color': color,
    'category': category,
    'tracking_methods': trackingMethods,
    'metric_unit': metricUnit,
    'daily_target': dailyTarget,
    'weekly_target': weeklyTarget,
    'status': status,
    'heatmap_config': heatmapConfig,
    'reminder_config': reminderConfig,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
    'today_progress': todayProgress.toJson(),
    'current_streak': currentStreak,
  };
}

