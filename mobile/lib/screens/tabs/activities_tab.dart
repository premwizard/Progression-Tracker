import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/activity.dart';
import '../../core/providers/activity_providers.dart';
import '../../core/providers/heatmap_providers.dart';
import '../../core/services/timer_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/heatmap_grid.dart';
import '../../widgets/streak_badge.dart';

class ActivitiesTab extends ConsumerStatefulWidget {
  final void Function(String activityId)? onStartTimerForActivity;

  const ActivitiesTab({super.key, this.onStartTimerForActivity});

  @override
  ConsumerState<ActivitiesTab> createState() => _ActivitiesTabState();
}

class _ActivitiesTabState extends ConsumerState<ActivitiesTab> {
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Engineering',
    'Learning',
    'Health',
    'Personal',
  ];

  Color _parseColor(String hex) {
    try {
      final buffer = StringBuffer();
      if (hex.length == 6 || hex.length == 7) buffer.write('ff');
      buffer.write(hex.replaceFirst('#', ''));
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (_) {
      return AppTheme.primaryOrange;
    }
  }

  IconData _getCategoryIcon(String iconName) {
    switch (iconName.toLowerCase()) {
      case 'code':
      case 'terminal':
        return Icons.code_rounded;
      case 'book-open':
      case 'book':
        return Icons.menu_book_rounded;
      case 'activity':
      case 'fitness':
      case 'dumbbell':
        return Icons.fitness_center_rounded;
      case 'heart':
        return Icons.favorite_rounded;
      default:
        return Icons.stars_rounded;
    }
  }

  void _showActivityDetailSheet(BuildContext context, Activity activity) {
    final theme = Theme.of(context);
    final color = _parseColor(activity.color);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.cardTheme.color,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusXl)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.8,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(AppTheme.spacingLg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.outline,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                        ),
                        child: Icon(_getCategoryIcon(activity.icon), color: color, size: 28),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              activity.name,
                              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              activity.category,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                              ),
                            ),
                          ],
                        ),
                      ),
                      StreakBadge(streak: activity.currentStreak),
                    ],
                  ),
                  if (activity.description != null && activity.description!.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(
                      activity.description!,
                      style: theme.textTheme.bodyMedium?.copyWith(height: 1.4),
                    ),
                  ],
                  const SizedBox(height: 24),
                  Text(
                    'Consistency Heatmap',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  HeatmapGridWidget(selectedActivityId: activity.id),
                  const SizedBox(height: 24),
                  if (activity.trackingMethods.contains('time'))
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: color,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(context);
                          widget.onStartTimerForActivity?.call(activity.id);
                        },
                        icon: const Icon(Icons.timer_outlined),
                        label: const Text('Start Focus Session'),
                      ),
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showCreateActivityDialog(BuildContext context) {
    final theme = Theme.of(context);
    final nameController = TextEditingController();
    final descController = TextEditingController();
    final targetController = TextEditingController(text: '60');
    String chosenCategory = 'Engineering';
    String trackingMethod = 'time';

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: theme.cardTheme.color,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusXl)),
              title: Text('New Activity', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Activity Name',
                        hintText: 'e.g., LeetCode, Piano, Running',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: descController,
                      decoration: const InputDecoration(
                        labelText: 'Description (optional)',
                        hintText: 'What is your goal for this activity?',
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: chosenCategory,
                      decoration: const InputDecoration(labelText: 'Category'),
                      dropdownColor: theme.cardTheme.color,
                      items: ['Engineering', 'Learning', 'Health', 'Personal'].map((c) {
                        return DropdownMenuItem(value: c, child: Text(c));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setDialogState(() => chosenCategory = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: trackingMethod,
                      decoration: const InputDecoration(labelText: 'Tracking Mode'),
                      dropdownColor: theme.cardTheme.color,
                      items: const [
                        DropdownMenuItem(value: 'time', child: Text('Time Duration (Timer)')),
                        DropdownMenuItem(value: 'quantity', child: Text('Quantity (Reps, Pages)')),
                        DropdownMenuItem(value: 'completion', child: Text('Daily Completion Checkbox')),
                      ],
                      onChanged: (val) {
                        if (val != null) setDialogState(() => trackingMethod = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: targetController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: trackingMethod == 'time' ? 'Daily Target (minutes)' : 'Daily Target count',
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () async {
                    if (nameController.text.trim().isEmpty) return;
                    final target = double.tryParse(targetController.text) ?? 60.0;

                    await ref.read(activitiesProvider.notifier).createActivity(
                      name: nameController.text.trim(),
                      description: descController.text.trim().isNotEmpty ? descController.text.trim() : null,
                      category: chosenCategory,
                      trackingMethods: [trackingMethod],
                      dailyTarget: target,
                      metricUnit: trackingMethod == 'time' ? 'minutes' : 'units',
                      color: chosenCategory == 'Engineering' ? '#3B82F6' : chosenCategory == 'Learning' ? '#10B981' : '#F97316',
                      icon: chosenCategory == 'Engineering' ? 'code' : chosenCategory == 'Learning' ? 'book-open' : 'activity',
                    );

                    if (context.mounted) Navigator.pop(context);
                  },
                  child: const Text('Create'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showQuickQuantityDialog(BuildContext context, Activity activity) {
    final theme = Theme.of(context);
    final countController = TextEditingController(text: '10');

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: theme.cardTheme.color,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusXl)),
          title: Text('Log ${activity.name}', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Log quantity progression (${activity.metricUnit ?? "units"}):'),
              const SizedBox(height: 12),
              TextField(
                controller: countController,
                keyboardType: TextInputType.number,
                autofocus: true,
                decoration: InputDecoration(
                  labelText: 'Amount (+)',
                  suffixText: activity.metricUnit ?? 'units',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: theme.colorScheme.primary,
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                final amount = double.tryParse(countController.text) ?? 1.0;
                await ref.read(trackingRepositoryProvider).logQuantity(
                  activityId: activity.id,
                  quantityValue: amount,
                  logDate: DateTime.now(),
                );
                await ref.read(activitiesProvider.notifier).loadActivities();
                ref.invalidate(heatmapOverallProvider);
                if (context.mounted) Navigator.pop(context);
              },
              child: const Text('Log Progress'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activitiesAsync = ref.watch(activitiesProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: Colors.white,
        tooltip: 'New Activity',
        onPressed: () => _showCreateActivityDialog(context),
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
                      Icon(Icons.grid_view_outlined, size: 20, color: theme.colorScheme.primary),
                      const SizedBox(width: 8),
                      Text(
                        'ACTIVITIES & TRACKS',
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
                    'Consistency Portfolio',
                    style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),

            // Category Filter Pills
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMd),
              child: Row(
                children: _categories.map((cat) {
                  final isSelected = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      selected: isSelected,
                      label: Text(cat),
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? Colors.white : theme.textTheme.bodyMedium?.color,
                      ),
                      selectedColor: theme.colorScheme.primary,
                      backgroundColor: theme.cardTheme.color,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                        side: BorderSide(
                          color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outline,
                        ),
                      ),
                      onSelected: (val) {
                        setState(() => _selectedCategory = cat);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 12),

            // Activities List
            Expanded(
              child: activitiesAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.cloud_off_rounded, size: 48, color: Colors.grey),
                      const SizedBox(height: 12),
                      Text('Offline mode: $err'),
                      TextButton(
                        onPressed: () => ref.read(activitiesProvider.notifier).loadActivities(),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (activities) {
                  final filtered = _selectedCategory == 'All'
                      ? activities
                      : activities.where((a) => a.category.toLowerCase() == _selectedCategory.toLowerCase()).toList();

                  if (filtered.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inbox_outlined, size: 56, color: theme.colorScheme.outline),
                          const SizedBox(height: 12),
                          Text('No activities found in $_selectedCategory', style: theme.textTheme.bodyMedium),
                          const SizedBox(height: 8),
                          ElevatedButton.icon(
                            onPressed: () => _showCreateActivityDialog(context),
                            icon: const Icon(Icons.add),
                            label: const Text('Add Activity'),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spacingMd,
                      vertical: AppTheme.spacingSm,
                    ),
                    itemCount: filtered.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final act = filtered[index];
                      final color = _parseColor(act.color);
                      final progressPct = act.todayProgress.progressPercent.clamp(0.0, 100.0);

                      return InkWell(
                        onTap: () => _showActivityDetailSheet(context, act),
                        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                        child: Container(
                          padding: const EdgeInsets.all(AppTheme.spacingMd),
                          decoration: BoxDecoration(
                            color: theme.cardTheme.color,
                            borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                            border: Border.all(color: theme.colorScheme.outline, width: 1),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: color.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                                    ),
                                    child: Icon(_getCategoryIcon(act.icon), color: color, size: 22),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          act.name,
                                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${act.category} • Target: ${act.dailyTarget?.round() ?? 60} ${act.metricUnit ?? "m"}',
                                          style: theme.textTheme.bodySmall?.copyWith(
                                            color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.65),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  StreakBadge(streak: act.currentStreak),
                                ],
                              ),
                              const SizedBox(height: 14),

                              // Progress Bar
                              Row(
                                children: [
                                  Expanded(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                        value: progressPct / 100.0,
                                        backgroundColor: theme.colorScheme.outline.withValues(alpha: 0.3),
                                        valueColor: AlwaysStoppedAnimation<Color>(color),
                                        minHeight: 6,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    '${progressPct.round()}%',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: color,
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),

                              // Action Row
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  if (act.trackingMethods.contains('quantity'))
                                    TextButton.icon(
                                      style: TextButton.styleFrom(
                                        visualDensity: VisualDensity.compact,
                                        foregroundColor: theme.textTheme.bodyMedium?.color,
                                      ),
                                      onPressed: () => _showQuickQuantityDialog(context, act),
                                      icon: const Icon(Icons.add_circle_outline, size: 16),
                                      label: const Text('Log Qty', style: TextStyle(fontSize: 12)),
                                    ),
                                  if (act.trackingMethods.contains('completion'))
                                    TextButton.icon(
                                      style: TextButton.styleFrom(
                                        visualDensity: VisualDensity.compact,
                                        foregroundColor: act.todayProgress.completed ? Colors.emerald : theme.textTheme.bodyMedium?.color,
                                      ),
                                      onPressed: () async {
                                        final newStatus = !act.todayProgress.completed;
                                        await ref.read(trackingRepositoryProvider).setCompletion(
                                          activityId: act.id,
                                          isCompleted: newStatus,
                                          logDate: DateTime.now(),
                                        );
                                        await ref.read(activitiesProvider.notifier).loadActivities();
                                        ref.invalidate(heatmapOverallProvider);
                                      },
                                      icon: Icon(
                                        act.todayProgress.completed ? Icons.check_circle : Icons.radio_button_unchecked,
                                        size: 16,
                                        color: act.todayProgress.completed ? Colors.green : null,
                                      ),
                                      label: Text(
                                        act.todayProgress.completed ? 'Done Today' : 'Mark Done',
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                    ),
                                  if (act.trackingMethods.contains('time'))
                                    ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        visualDensity: VisualDensity.compact,
                                        backgroundColor: color.withValues(alpha: 0.15),
                                        foregroundColor: color,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                                        ),
                                      ),
                                      onPressed: () {
                                        widget.onStartTimerForActivity?.call(act.id);
                                      },
                                      icon: const Icon(Icons.play_arrow_rounded, size: 16),
                                      label: const Text('Timer', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
