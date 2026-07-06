import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/progress_card.dart';
import '../widgets/progress_ring.dart';

// Dummy Provider for Dashboard Data
final dashboardItemsProvider = Provider((ref) => [
      {
        'id': '1',
        'title': 'React Advanced Patterns',
        'category': 'Engineering',
        'progress': 0.68,
        'streak': 12,
      },
      {
        'id': '2',
        'title': 'System Design Interview',
        'category': 'Career',
        'progress': 0.34,
        'streak': 3,
      },
      {
        'id': '3',
        'title': 'Marathon Training',
        'category': 'Health',
        'progress': 0.85,
        'streak': 24,
      },
      {
        'id': '4',
        'title': 'French A2 Level',
        'category': 'Language',
        'progress': 0.15,
        'streak': 0,
      }
    ]);

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(dashboardItemsProvider);
    final theme = Theme.of(context);
    
    // Calculate overall progress from dummy data
    final overallProgress = items.fold<double>(0, (prev, item) => prev + (item['progress'] as double)) / items.length;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back, Alex.',
                      style: theme.textTheme.headlineLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'You are currently tracking ${items.length} active goals.',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.onBackground.withOpacity(0.6),
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    // Today's Focus Widget
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: theme.colorScheme.outline),
                      ),
                      child: Row(
                        children: [
                          ProgressRing(
                            progress: overallProgress,
                            size: 70,
                            strokeWidth: 8,
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Overall Progress',
                                  style: theme.textTheme.titleLarge,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Across all active items',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: theme.colorScheme.onBackground.withOpacity(0.6),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Active Tracks',
                          style: theme.textTheme.headlineSmall,
                        ),
                        IconButton(
                          onPressed: () {
                            // Add item action
                          },
                          icon: Icon(Icons.add_circle, color: theme.colorScheme.primary, size: 28),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
            
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = items[index];
                    return ProgressCard(
                      id: item['id'] as String,
                      title: item['title'] as String,
                      category: item['category'] as String,
                      progress: item['progress'] as double,
                      streak: item['streak'] as int,
                    );
                  },
                  childCount: items.length,
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }
}
