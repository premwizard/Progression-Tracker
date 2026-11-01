class ActivityLog {
  final String id;
  final String activityId;
  final String userId;
  final DateTime logDate;
  final String trackingMethod; // 'quantity', 'completion', 'manual_time'
  final double? quantityValue;
  final bool isCompleted;
  final String? notes;
  final DateTime createdAt;

  const ActivityLog({
    required this.id,
    required this.activityId,
    required this.userId,
    required this.logDate,
    required this.trackingMethod,
    this.quantityValue,
    this.isCompleted = false,
    this.notes,
    required this.createdAt,
  });

  factory ActivityLog.fromJson(Map<String, dynamic> json) {
    return ActivityLog(
      id: json['id'] as String,
      activityId: json['activity_id'] as String,
      userId: json['user_id'] as String? ?? '',
      logDate: DateTime.parse(json['log_date'] as String),
      trackingMethod: json['tracking_method'] as String,
      quantityValue: (json['quantity_value'] as num?)?.toDouble(),
      isCompleted: json['is_completed'] as bool? ?? false,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'activity_id': activityId,
    'user_id': userId,
    'log_date': logDate.toIso8601String().substring(0, 10),
    'tracking_method': trackingMethod,
    'quantity_value': quantityValue,
    'is_completed': isCompleted,
    'notes': notes,
    'created_at': createdAt.toIso8601String(),
  };
}

