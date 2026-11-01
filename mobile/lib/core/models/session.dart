class ActivitySession {
  final String id;
  final String activityId;
  final String userId;
  final DateTime startTime;
  final DateTime? endTime;
  final int pausedDurationSeconds;
  final int durationSeconds;
  final String status; // 'running', 'paused', 'completed', 'cancelled'
  final List<dynamic>? pauseIntervals;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ActivitySession({
    required this.id,
    required this.activityId,
    required this.userId,
    required this.startTime,
    this.endTime,
    this.pausedDurationSeconds = 0,
    this.durationSeconds = 0,
    required this.status,
    this.pauseIntervals,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ActivitySession.fromJson(Map<String, dynamic> json) {
    return ActivitySession(
      id: json['id'] as String,
      activityId: json['activity_id'] as String,
      userId: json['user_id'] as String? ?? '',
      startTime: DateTime.parse(json['start_time'] as String),
      endTime: json['end_time'] != null ? DateTime.parse(json['end_time'] as String) : null,
      pausedDurationSeconds: (json['paused_duration_seconds'] as num?)?.toInt() ?? 0,
      durationSeconds: (json['duration_seconds'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'running',
      pauseIntervals: json['pause_intervals'] as List<dynamic>?,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : DateTime.now(),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at'] as String) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'activity_id': activityId,
    'user_id': userId,
    'start_time': startTime.toIso8601String(),
    'end_time': endTime?.toIso8601String(),
    'paused_duration_seconds': pausedDurationSeconds,
    'duration_seconds': durationSeconds,
    'status': status,
    'pause_intervals': pauseIntervals,
    'notes': notes,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
  };

  /// Compute live elapsed seconds dynamically from timestamps
  int get liveElapsedSeconds {
    if (status == 'completed') return durationSeconds;
    if (status == 'cancelled') return 0;

    final now = DateTime.now();
    var extraPause = 0;
    if (status == 'paused' && pauseIntervals != null && pauseIntervals!.isNotEmpty) {
      final lastInterval = pauseIntervals!.last as Map<String, dynamic>?;
      if (lastInterval != null && lastInterval['pause_end'] == null && lastInterval['pause_start'] != null) {
        final pauseStart = DateTime.parse(lastInterval['pause_start'] as String);
        extraPause = now.difference(pauseStart).inSeconds;
      }
    }

    final totalElapsed = now.difference(startTime).inSeconds;
    final netElapsed = totalElapsed - (pausedDurationSeconds + extraPause);
    return netElapsed > 0 ? netElapsed : 0;
  }
}

