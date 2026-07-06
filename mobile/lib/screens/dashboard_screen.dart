import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';
import '../widgets/progress_card.dart';
import '../widgets/progress_ring.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // Mock Data
    final mockData = [
      {'id': '1', 'title': 'React Advanced Patterns', 'category': 'Engineering', 'progress': 68, 'streak': 12},
      {'id': '2', 'title': 'System Design Interview', 'category': 'Career', 'progress': 34, 'streak': 3},
      {'id': '3', 'title': 'Marathon Training', 'category': 'Health', 'progress': 85, 'streak': 24},
      {'id': '4', 'title': 'French A2 Level', 'category': 'Language', 'progress': 15, 'streak': 0},
    ];

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMd, vertical: AppTheme.spacingLg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Icon(LucideIcons.layoutDashboard, size: 20, color: theme.colorScheme.primary),
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
              const SizedBox(height: 8),
              Text(
                'Welcome back, Alex.',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                "You're currently tracking 4 active goals. You have a 24-day streak on Marathon Training. Keep the momentum going.",
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                  height: 1.5,
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingLg),
              
              // Global Progress Widget
              Container(
                padding: const EdgeInsets.all(AppTheme.spacingLg),
                decoration: BoxDecoration(
                  color: theme.cardTheme.color,
                  borderRadius: BorderRadius.circular(AppTheme.radiusXl),
                  border: Border.all(color: theme.colorScheme.outline, width: 1),
                ),
                child: Row(
                  children: [
                    const ProgressRing(progress: 54, size: 80, strokeWidth: 8),
                    const SizedBox(width: AppTheme.spacingLg),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Overall Progress',
                            style: theme.textTheme.titleMedium,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Across all active items',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingXl),
              
              // Main Grid Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Active Tracks',
                    style: theme.textTheme.headlineSmall,
                  ),
                  ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(LucideIcons.plus, size: 16, color: Colors.white),
                    label: const Text('New Track', style: TextStyle(color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: theme.colorScheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                      ),
                      elevation: 4,
                      shadowColor: theme.colorScheme.primary.withOpacity(0.4),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: AppTheme.spacingLg),
              
              // Grid (ListView on mobile)
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: mockData.length,
                separatorBuilder: (context, index) => const SizedBox(height: AppTheme.spacingMd),
                itemBuilder: (context, index) {
                  final item = mockData[index];
                  return SizedBox(
                    height: 200, // Fixed height to match card aspect ratio
                    child: ProgressCard(
                      id: item['id'] as String,
                      title: item['title'] as String,
                      category: item['category'] as String,
                      progress: item['progress'] as int,
                      streak: item['streak'] as int,
                    ),
                  );
                },
              ),
              
              const SizedBox(height: AppTheme.spacingXl),
              
              // Recent Activity Feed
              Text(
                'Recent Activity',
                style: theme.textTheme.headlineSmall,
              ),
              const SizedBox(height: AppTheme.spacingMd),
              
              Container(
                padding: const EdgeInsets.all(4),
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
                    color: theme.colorScheme.outline,
                  ),
                  itemBuilder: (context, index) {
                    return Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () {},
                        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: theme.colorScheme.primary.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(LucideIcons.activity, size: 20, color: theme.colorScheme.primary),
                              ),
                              const SizedBox(width: 16),
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
                                          const TextSpan(text: 'Completed milestone '),
                                          TextSpan(
                                            text: '"Understanding Hooks"',
                                            style: TextStyle(
                                              color: theme.colorScheme.primary,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'in React Advanced Patterns • 2 hours ago',
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(LucideIcons.chevronRight, size: 20, color: theme.textTheme.bodySmall?.color?.withOpacity(0.7)),
                            ],
                          ),
                        ),
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
    );
  }
}
