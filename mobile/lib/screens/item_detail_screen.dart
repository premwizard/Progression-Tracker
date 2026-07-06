import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../widgets/progress_ring.dart';
import '../widgets/streak_badge.dart';

class ItemDetailScreen extends StatelessWidget {
  final String id;
  final String title;
  final double progress;
  final int streak;

  const ItemDetailScreen({
    super.key,
    required this.id,
    required this.title,
    required this.progress,
    required this.streak,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 200.0,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                color: colorScheme.surface,
                padding: const EdgeInsets.fromLTRB(24, 100, 24, 24),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Hero(
                      tag: 'progress-ring-$id',
                      child: Material(
                        type: MaterialType.transparency,
                        child: ProgressRing(
                          progress: progress,
                          size: 80,
                          strokeWidth: 8,
                        ),
                      ),
                    ),
                    const SizedBox(width: 24),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (streak > 0) 
                            Hero(
                              tag: 'streak-$id',
                              child: Material(
                                type: MaterialType.transparency,
                                child: StreakBadge(streak: streak),
                              ),
                            ),
                          const SizedBox(height: 8),
                          Hero(
                            tag: 'title-$id',
                            child: Material(
                              type: MaterialType.transparency,
                              child: Text(
                                title,
                                style: theme.textTheme.headlineMedium,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Progress Trend',
                    style: theme.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 16),
                  
                  // Analytics Chart
                  Container(
                    height: 200,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: colorScheme.outline),
                    ),
                    child: LineChart(
                      LineChartData(
                        gridData: FlGridData(show: false),
                        titlesData: FlTitlesData(show: false),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            spots: const [
                              FlSpot(0, 30),
                              FlSpot(1, 40),
                              FlSpot(2, 38),
                              FlSpot(3, 50),
                              FlSpot(4, 60),
                              FlSpot(5, 68),
                            ],
                            isCurved: true,
                            color: colorScheme.primary,
                            barWidth: 4,
                            isStrokeCapRound: true,
                            dotData: FlDotData(show: false),
                            belowBarData: BarAreaData(
                              show: true,
                              color: colorScheme.primary.withValues(alpha: 0.1),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  Text(
                    'Timeline',
                    style: theme.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 16),
                  
                  // Dummy Timeline
                  _buildTimelineItem(context, 'Completed section 3', '2 hours ago', true),
                  _buildTimelineItem(context, 'Read documentation', 'Yesterday', false),
                  _buildTimelineItem(context, 'Watched tutorial video', '2 days ago', false),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Open add progress bottom sheet
        },
        backgroundColor: colorScheme.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Update', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildTimelineItem(BuildContext context, String title, String time, bool isLatest) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: isLatest ? colorScheme.primary : colorScheme.outline,
                  shape: BoxShape.circle,
                ),
              ),
              Container(
                width: 2,
                height: 40,
                color: colorScheme.outline.withValues(alpha: 0.5),
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  time,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

