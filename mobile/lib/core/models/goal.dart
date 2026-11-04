class TaskItem {
  final String id;
  final String goalId;
  final String title;
  final String? description;
  final bool isCompleted;
  final int orderIndex;
  final DateTime? dueDate;
  final DateTime createdAt;

  const TaskItem({
    required this.id,
    required this.goalId,
    required this.title,
    this.description,
    this.isCompleted = false,
    this.orderIndex = 0,
    this.dueDate,
    required this.createdAt,
  });

  factory TaskItem.fromJson(Map<String, dynamic> json) {
    return TaskItem(
      id: json['id'] as String,
      goalId: json['goal_id'] as String? ?? '',
      title: json['title'] as String,
      description: json['description'] as String?,
      isCompleted: json['is_completed'] as bool? ?? false,
      orderIndex: (json['order_index'] as num?)?.toInt() ?? 0,
      dueDate: json['due_date'] != null
          ? DateTime.parse(json['due_date'] as String)
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'goal_id': goalId,
    'title': title,
    'description': description,
    'is_completed': isCompleted,
    'order_index': orderIndex,
    if (dueDate != null) 'due_date': dueDate!.toIso8601String(),
    'created_at': createdAt.toIso8601String(),
  };

  TaskItem copyWith({
    String? id,
    String? goalId,
    String? title,
    String? description,
    bool? isCompleted,
    int? orderIndex,
    DateTime? dueDate,
    DateTime? createdAt,
  }) {
    return TaskItem(
      id: id ?? this.id,
      goalId: goalId ?? this.goalId,
      title: title ?? this.title,
      description: description ?? this.description,
      isCompleted: isCompleted ?? this.isCompleted,
      orderIndex: orderIndex ?? this.orderIndex,
      dueDate: dueDate ?? this.dueDate,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class Goal {
  final String id;
  final String userId;
  final String title;
  final String? description;
  final String category;
  final String priority;
  final String status;
  final double progressPercent;
  final DateTime? targetDate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<TaskItem> tasks;

  const Goal({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    this.category = 'Engineering',
    this.priority = 'medium',
    this.status = 'in_progress',
    this.progressPercent = 0.0,
    this.targetDate,
    required this.createdAt,
    required this.updatedAt,
    this.tasks = const [],
  });

  factory Goal.fromJson(Map<String, dynamic> json) {
    return Goal(
      id: json['id'] as String,
      userId: json['user_id'] as String? ?? '',
      title: json['title'] as String,
      description: json['description'] as String?,
      category: json['category'] as String? ?? 'Engineering',
      priority: json['priority'] as String? ?? 'medium',
      status: json['status'] as String? ?? 'in_progress',
      progressPercent: (json['progress_percent'] as num?)?.toDouble() ?? 0.0,
      targetDate: json['target_date'] != null
          ? DateTime.parse(json['target_date'] as String)
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : DateTime.now(),
      tasks: (json['tasks'] as List<dynamic>?)
              ?.map((e) => TaskItem.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList() ??
          const [],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'user_id': userId,
    'title': title,
    'description': description,
    'category': category,
    'priority': priority,
    'status': status,
    'progress_percent': progressPercent,
    if (targetDate != null) 'target_date': targetDate!.toIso8601String(),
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
    'tasks': tasks.map((t) => t.toJson()).toList(),
  };

  Goal copyWith({
    String? id,
    String? userId,
    String? title,
    String? description,
    String? category,
    String? priority,
    String? status,
    double? progressPercent,
    DateTime? targetDate,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<TaskItem>? tasks,
  }) {
    return Goal(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      progressPercent: progressPercent ?? this.progressPercent,
      targetDate: targetDate ?? this.targetDate,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      tasks: tasks ?? this.tasks,
    );
  }
}
