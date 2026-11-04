import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/activity_providers.dart';
import '../../core/providers/goal_providers.dart';
import '../../theme/app_theme.dart';
import '../../widgets/heatmap_grid.dart';
import '../../widgets/progress_ring.dart';

class DashboardTab extends ConsumerWidget {
  final VoidCallback? onNavigateToTimer;
  final VoidCallback? onNavigateToActivities;
  final VoidCallback? onNavigateToGoals;

  const DashboardTab({
    super.key,
    this.onNavigateToTimer,
    this.onNavigateToActivities,
    this.onNavigateToGoals,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final activitiesAsync = ref.watch(activitiesProvider);
    final goalsAsync = ref.watch(goalsProvider);

    final activities = activitiesAsync.asData?.value ?? [];
    final goals = goalsAsync.asData?.value ?? [];

    final activeActivitiesCount = activities.length;
    final bestStreak = activities.isEmpty
        ? 0
        : activities.map((a) => a.currentStreak).reduce((a, b) => a > b ? a : b);

    final overallProgress = goals.isEmpty
        ? 54.0
        : (goals.map((g) => g.progressPercent).reduce((a, b) => a + b) / goals.length);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.read(activitiesProvider.notifier).loadActivities();
            ref.read(goalsProvider.notifier).loadGoals();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingMd,
              vertical: AppTheme.spacingLg,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Label
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.dashboard_outlined, size: 20, color: theme.colorScheme.primary),
                        const SizedBox(width: 8),
                        Text(
                          'DASHBOARD',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                    if (onNavigateToTimer != null)
                      IconButton(
                        tooltip: 'Focus Timer',
                        icon: Icon(Icons.timer_outlined, color: theme.colorScheme.primary),
                        onPressed: onNavigateToTimer,
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Welcome back, Alex.',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "You're currently tracking $activeActivitiesCount active activities with a best streak of $bestStreak days 🔥. Keep the momentum going.",
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                    height: 1.5,
                  ),
                ),

                const SizedBox(height: AppTheme.spacingLg),

                // Global Progress Ring Card
                Container(
                  padding: const EdgeInsets.all(AppTheme.spacingLg),
                  decoration: BoxDecoration(
                    color: theme.cardTheme.color,
                    borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                    border: Border.all(color: theme.colorScheme.outline, width: 1),
                  ),
                  child: Row(
                    children: [
                      ProgressRing(progress: overallProgress.toDouble(), size: 80, strokeWidth: 8),
                      const SizedBox(width: AppTheme.spacingLg),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Overall Progress',
                              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${overallProgress.round()}% across all active goals & tracks',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppTheme.spacingLg),

                // Consistency Progression Heatmap
                const HeatmapCard(),

                const SizedBox(height: AppTheme.spacingLg),

                // Quick Launch Action Row
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                          ),
                          side: BorderSide(color: theme.colorScheme.primary.withValues(alpha: 0.4)),
                        ),
                        onPressed: onNavigateToTimer,
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: const Text('Start Focus'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                          ),
                        ),
                        onPressed: onNavigateToActivities,
                        icon: const Icon(Icons.add_task_rounded),
                        label: const Text('Track Activity'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AppTheme.spacingLg),

                // Recent Activities Highlights
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Recent Momentum',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    if (onNavigateToGoals != null)
                      TextButton(
                        onPressed: onNavigateToGoals,
                        child: const Text('View Goals'),
                      ),
                  ],
                ),
                const SizedBox(height: AppTheme.spacingSm),

                Container(
                  decoration: BoxDecoration(
                    color: theme.cardTheme.color,
                    borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                    border: Border.all(color: theme.colorScheme.outline, width: 1),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: 3,
                    separatorBuilder: (context, index) => Divider(
                      height: 1,
                      color: theme.colorScheme.outline.withValues(alpha: 0.4),
                    ),
                    itemBuilder: (context, index) {
                      final items = [
                        {'title': 'Completed milestone', 'target': '"Custom Hooks Architecture"', 'sub': 'React Advanced Patterns • 2 hours ago'},
                        {'title': 'Logged 10km run', 'target': '32m tempo pace', 'sub': 'Marathon Training • 5 hours ago'},
                        {'title': 'Started reading', 'target': '"Designing Data-Intensive Apps"', 'sub': 'System Design • 1 day ago'},
                      ];
                      final item = items[index];

                      return Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary.withValues(alpha: 0.12),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(Icons.show_chart_rounded, size: 20, color: theme.colorScheme.primary),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  RichText(
                                    text: TextSpan(
                                      style: theme.textTheme.bodyMedium?.copyWith(
                                        color: theme.colorScheme.onSurface,
                                        fontWeight: FontWeight.w500,
                                      ),
                                      children: [
                                        TextSpan(text: '${item['title']} '),
                                        TextSpan(
                                          text: item['target']!,
                                          style: TextStyle(
                                            color: theme.colorScheme.primary,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    item['sub']!,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.65),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
