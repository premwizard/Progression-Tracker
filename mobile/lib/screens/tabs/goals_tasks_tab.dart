import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/goal.dart';
import '../../core/providers/goal_providers.dart';
import '../../theme/app_theme.dart';

class GoalsTasksTab extends ConsumerStatefulWidget {
  const GoalsTasksTab({super.key});

  @override
  ConsumerState<GoalsTasksTab> createState() => _GoalsTasksTabState();
}

class _GoalsTasksTabState extends ConsumerState<GoalsTasksTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'engineering':
        return const Color(0xFF3B82F6);
      case 'career':
        return const Color(0xFFA855F7);
      case 'health':
        return const Color(0xFF10B981);
      case 'learning':
      case 'language':
        return const Color(0xFFF97316);
      default:
        return const Color(0xFF6366F1);
    }
  }

  void _showCreateGoalDialog(BuildContext context) {
    final theme = Theme.of(context);
    final titleController = TextEditingController();
    final descController = TextEditingController();
    final task1Controller = TextEditingController();
    final task2Controller = TextEditingController();
    String category = 'Engineering';
    String priority = 'high';

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: theme.cardTheme.color,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusXl)),
              title: Text('Create Strategic Goal', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: titleController,
                      decoration: const InputDecoration(
                        labelText: 'Goal Title',
                        hintText: 'e.g., Master Distributed Systems',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descController,
                      decoration: const InputDecoration(
                        labelText: 'Description (optional)',
                        hintText: 'Measurable target or outcome',
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: category,
                      decoration: const InputDecoration(labelText: 'Domain Category'),
                      dropdownColor: theme.cardTheme.color,
                      items: ['Engineering', 'Career', 'Health', 'Learning'].map((c) {
                        return DropdownMenuItem(value: c, child: Text(c));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => category = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: priority,
                      decoration: const InputDecoration(labelText: 'Priority Tier'),
                      dropdownColor: theme.cardTheme.color,
                      items: const [
                        DropdownMenuItem(value: 'high', child: Text('High Priority')),
                        DropdownMenuItem(value: 'medium', child: Text('Medium Priority')),
                        DropdownMenuItem(value: 'low', child: Text('Low Priority')),
                      ],
                      onChanged: (val) {
                        if (val != null) setDialogState(() => priority = val);
                      },
                    ),
                    const SizedBox(height: 16),
                    Text('Initial Milestone Tasks:', style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: task1Controller,
                      decoration: const InputDecoration(
                        hintText: 'Milestone 1 title',
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: task2Controller,
                      decoration: const InputDecoration(
                        hintText: 'Milestone 2 title (optional)',
                        isDense: true,
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () async {
                    if (titleController.text.trim().isEmpty) return;
                    final tasks = <String>[];
                    if (task1Controller.text.trim().isNotEmpty) tasks.add(task1Controller.text.trim());
                    if (task2Controller.text.trim().isNotEmpty) tasks.add(task2Controller.text.trim());

                    await ref.read(goalsProvider.notifier).createGoal(
                      title: titleController.text.trim(),
                      description: descController.text.trim().isNotEmpty ? descController.text.trim() : null,
                      category: category,
                      priority: priority,
                      taskTitles: tasks,
                    );

                    if (context.mounted) Navigator.pop(context);
                  },
                  child: const Text('Create Goal'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final goalsAsync = ref.watch(goalsProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: Colors.white,
        tooltip: 'New Goal',
        onPressed: () => _showCreateGoalDialog(context),
        child: const Icon(Icons.add),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Bar
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTheme.spacingMd,
                vertical: AppTheme.spacingMd,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.track_changes_outlined, size: 20, color: theme.colorScheme.primary),
                      const SizedBox(width: 8),
                      Text(
                        'OBJECTIVES & ROADMAP',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Goals & Execution',
                    style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),

                  // Segmented Tabs Header
                  Container(
                    height: 38,
                    decoration: BoxDecoration(
                      color: theme.cardTheme.color,
                      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                      border: Border.all(color: theme.colorScheme.outline, width: 1),
                    ),
                    child: TabBar(
                      controller: _tabController,
                      indicator: BoxDecoration(
                        color: theme.colorScheme.primary,
                        borderRadius: BorderRadius.circular(AppTheme.radiusMd - 2),
                      ),
                      labelColor: Colors.white,
                      unselectedLabelColor: theme.textTheme.bodyMedium?.color,
                      labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      tabs: const [
                        Tab(text: 'Strategic Goals'),
                        Tab(text: 'Daily Execution Tasks'),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Tab Views
            Expanded(
              child: goalsAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.cloud_off_rounded, size: 48, color: Colors.grey),
                      const SizedBox(height: 12),
                      Text('Offline mode: $err'),
                      TextButton(
                        onPressed: () => ref.read(goalsProvider.notifier).loadGoals(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (goals) {
                  return TabBarView(
                    controller: _tabController,
                    children: [
                      // SUBTAB 1: STRATEGIC GOALS
                      _buildGoalsList(context, theme, goals),

                      // SUBTAB 2: DAILY EXECUTION TASKS
                      _buildTasksList(context, theme, goals),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGoalsList(BuildContext context, ThemeData theme, List<Goal> goals) {
    if (goals.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.flag_outlined, size: 56, color: theme.colorScheme.outline),
            const SizedBox(height: 12),
            const Text('No goals created yet'),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () => _showCreateGoalDialog(context),
              icon: const Icon(Icons.add),
              label: const Text('Create First Goal'),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMd, vertical: AppTheme.spacingSm),
      itemCount: goals.length,
      separatorBuilder: (context, index) => const SizedBox(height: 14),
      itemBuilder: (context, index) {
        final goal = goals[index];
        final catColor = _getCategoryColor(goal.category);
        final completedTasks = goal.tasks.where((t) => t.isCompleted).length;
        final totalTasks = goal.tasks.length;

        return Container(
          decoration: BoxDecoration(
            color: theme.cardTheme.color,
            borderRadius: BorderRadius.circular(AppTheme.radiusXl),
            border: Border.all(color: theme.colorScheme.outline, width: 1),
          ),
          child: Theme(
            data: theme.copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
              tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              childrenPadding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
              leading: Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: catColor,
                  shape: BoxShape.circle,
                ),
              ),
              title: Text(
                goal.title,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: catColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          goal.category,
                          style: TextStyle(color: catColor, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '$completedTasks/$totalTasks tasks completed',
                        style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: (goal.progressPercent / 100.0).clamp(0.0, 1.0),
                      backgroundColor: theme.colorScheme.outline.withValues(alpha: 0.3),
                      valueColor: AlwaysStoppedAnimation<Color>(catColor),
                      minHeight: 5,
                    ),
                  ),
                ],
              ),
              trailing: Text(
                '${goal.progressPercent.round()}%',
                style: TextStyle(fontWeight: FontWeight.bold, color: catColor, fontSize: 14),
              ),
              children: [
                if (goal.description != null && goal.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        goal.description!,
                        style: theme.textTheme.bodySmall?.copyWith(height: 1.4),
                      ),
                    ),
                  ),
                const Divider(height: 1),
                const SizedBox(height: 8),
                if (goal.tasks.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text('No sub-tasks attached to this goal.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  )
                else
                  ...goal.tasks.map((task) {
                    return CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      visualDensity: VisualDensity.compact,
                      title: Text(
                        task.title,
                        style: TextStyle(
                          fontSize: 13,
                          decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                          color: task.isCompleted
                              ? theme.textTheme.bodySmall?.color?.withValues(alpha: 0.5)
                              : theme.textTheme.bodyMedium?.color,
                        ),
                      ),
                      value: task.isCompleted,
                      activeColor: catColor,
                      onChanged: (val) {
                        if (val != null) {
                          ref.read(goalsProvider.notifier).toggleTask(
                            goalId: goal.id,
                            taskId: task.id,
                            isCompleted: val,
                          );
                        }
                      },
                    );
                  }),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTasksList(BuildContext context, ThemeData theme, List<Goal> goals) {
    // Flatten all tasks with their parent goal info
    final allTasks = <Map<String, dynamic>>[];
    for (var g in goals) {
      for (var t in g.tasks) {
        allTasks.add({
          'goal': g,
          'task': t,
        });
      }
    }

    if (allTasks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_box_outlined, size: 56, color: theme.colorScheme.outline),
            const SizedBox(height: 12),
            const Text('No tasks available'),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMd, vertical: AppTheme.spacingSm),
      itemCount: allTasks.length,
      separatorBuilder: (context, index) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final item = allTasks[index];
        final Goal goal = item['goal'] as Goal;
        final TaskItem task = item['task'] as TaskItem;
        final catColor = _getCategoryColor(goal.category);

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: theme.cardTheme.color,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            border: Border.all(color: theme.colorScheme.outline, width: 1),
          ),
          child: Row(
            children: [
              Checkbox(
                value: task.isCompleted,
                activeColor: catColor,
                onChanged: (val) {
                  if (val != null) {
                    ref.read(goalsProvider.notifier).toggleTask(
                      goalId: goal.id,
                      taskId: task.id,
                      isCompleted: val,
                    );
                  }
                },
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.title,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                        color: task.isCompleted
                            ? theme.textTheme.bodySmall?.color?.withValues(alpha: 0.5)
                            : theme.textTheme.bodyMedium?.color,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Goal: ${goal.title}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontSize: 11,
                        color: catColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
