import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/activity_providers.dart';
import '../../core/providers/goal_providers.dart';
import '../../core/services/sync_service.dart';
import '../../core/storage/hive_storage.dart';
import '../../theme/app_theme.dart';

class AnalyticsSettingsTab extends ConsumerWidget {
  const AnalyticsSettingsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final syncState = ref.watch(syncProvider);
    final activitiesAsync = ref.watch(activitiesProvider);
    final goalsAsync = ref.watch(goalsProvider);

    final activities = activitiesAsync.asData?.value ?? [];
    final goals = goalsAsync.asData?.value ?? [];

    final bestStreak = activities.isEmpty
        ? 0
        : activities.map((a) => a.currentStreak).reduce((a, b) => a > b ? a : b);

    final totalCompletedTasks = goals.fold<int>(
      0,
      (sum, g) => sum + g.tasks.where((t) => t.isCompleted).length,
    );

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacingMd,
            vertical: AppTheme.spacingMd,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Bar
              Row(
                children: [
                  Icon(Icons.analytics_outlined, size: 20, color: theme.colorScheme.primary),
                  const SizedBox(width: 8),
                  Text(
                    'INTELLIGENCE & SETTINGS',
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
                'Analytics & System',
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: AppTheme.spacingLg),

              // KPI Stats Grid
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      theme: theme,
                      icon: Icons.local_fire_department_rounded,
                      iconColor: AppTheme.primaryOrange,
                      value: '$bestStreak d',
                      label: 'Best Streak',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      theme: theme,
                      icon: Icons.check_circle_outline_rounded,
                      iconColor: Colors.emerald,
                      value: '$totalCompletedTasks',
                      label: 'Tasks Done',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      theme: theme,
                      icon: Icons.track_changes_rounded,
                      iconColor: const Color(0xFF3B82F6),
                      value: '${goals.length}',
                      label: 'Active Goals',
                    ),
                  ),
                ],
              ),

              const SizedBox(height: AppTheme.spacingLg),

              // OFFLINE SYNC STATUS CARD
              Text(
                'Offline Resilience & Sync',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),

              Container(
                padding: const EdgeInsets.all(AppTheme.spacingMd),
                decoration: BoxDecoration(
                  color: theme.cardTheme.color,
                  borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                  border: Border.all(
                    color: syncState.pendingCount > 0
                        ? Colors.amber.withValues(alpha: 0.5)
                        : theme.colorScheme.outline,
                    width: 1,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: syncState.pendingCount > 0
                                ? Colors.amber.withValues(alpha: 0.15)
                                : Colors.emerald.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            syncState.pendingCount > 0
                                ? Icons.sync_problem_rounded
                                : Icons.cloud_done_rounded,
                            color: syncState.pendingCount > 0 ? Colors.amber : Colors.emerald,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                syncState.pendingCount > 0
                                    ? '${syncState.pendingCount} Offline Action(s) Pending'
                                    : 'All Data Synchronized',
                                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                syncState.lastSyncTime != null
                                    ? 'Last sync: ${_formatTime(syncState.lastSyncTime!)}'
                                    : 'Local cache initialized',
                                style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.colorScheme.primary,
                            foregroundColor: Colors.white,
                            visualDensity: VisualDensity.compact,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                            ),
                          ),
                          onPressed: syncState.isSyncing
                              ? null
                              : () async {
                                  final success = await ref.read(syncProvider.notifier).syncNow();
                                  if (success) {
                                    ref.read(activitiesProvider.notifier).loadActivities();
                                    ref.read(goalsProvider.notifier).loadGoals();
                                  }
                                },
                          child: syncState.isSyncing
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Sync Now', style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                    if (syncState.lastError != null) ...[
                      const SizedBox(height: 10),
                      Text(
                        'Sync warning: ${syncState.lastError}',
                        style: const TextStyle(color: Colors.amber, fontSize: 11),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: AppTheme.spacingLg),

              // ACCOUNT & PRIVACY PROFILE CARD
              Text(
                'Personal Identity',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),

              Container(
                padding: const EdgeInsets.all(AppTheme.spacingMd),
                decoration: BoxDecoration(
                  color: theme.cardTheme.color,
                  borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                  border: Border.all(color: theme.colorScheme.outline, width: 1),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.15),
                          child: Icon(Icons.person_rounded, color: theme.colorScheme.primary),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Personal Owner',
                                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                'owner@progressiontracker.local',
                                style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.emerald.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'Active',
                            style: TextStyle(color: Colors.emerald, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Divider(height: 1),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Zero-Auth Single-User Mode', style: TextStyle(fontSize: 12)),
                        Icon(Icons.shield_outlined, size: 16, color: theme.colorScheme.primary),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppTheme.spacingLg),

              // STORAGE / DATA RESET
              Text(
                'Storage Management',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),

              Container(
                decoration: BoxDecoration(
                  color: theme.cardTheme.color,
                  borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                  border: Border.all(color: theme.colorScheme.outline, width: 1),
                ),
                child: ListTile(
                  leading: const Icon(Icons.cleaning_services_rounded, color: Colors.redAccent),
                  title: const Text('Clear Local Offline Cache', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Clears cached Hive boxes without modifying backend database', style: TextStyle(fontSize: 11)),
                  trailing: TextButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Clear Local Cache?'),
                          content: const Text('Cached activities and goals will be wiped and re-fetched on next launch.'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                              onPressed: () async {
                                await HiveStorage.clear();
                                ref.read(activitiesProvider.notifier).loadActivities();
                                ref.read(goalsProvider.notifier).loadGoals();
                                if (ctx.mounted) Navigator.pop(ctx);
                              },
                              child: const Text('Clear Cache', style: TextStyle(color: Colors.white)),
                            ),
                          ],
                        ),
                      );
                    },
                    child: const Text('Clear', style: TextStyle(color: Colors.redAccent)),
                  ),
                ),
              ),

              const SizedBox(height: 50),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required ThemeData theme,
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: theme.cardTheme.color,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: theme.colorScheme.outline, width: 1),
      ),
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 22),
          const SizedBox(height: 8),
          Text(
            value,
            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(fontSize: 10),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
