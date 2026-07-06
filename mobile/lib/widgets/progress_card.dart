import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../screens/item_detail_screen.dart';
import 'progress_ring.dart';
import 'streak_badge.dart';

class ProgressCard extends ConsumerWidget {
  final String id;
  final String title;
  final String category;
  final double progress;
  final int streak;
  
  const ProgressCard({
    super.key,
    required this.id,
    required this.title,
    required this.category,
    required this.progress,
    required this.streak,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => ItemDetailScreen(
                id: id,
                title: title,
                progress: progress,
                streak: streak,
              ),
            ),
          );
        },
        splashColor: colorScheme.primary.withOpacity(0.1),
        highlightColor: colorScheme.primary.withOpacity(0.05),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Hero(
                tag: 'progress-ring-$id',
                child: Material(
                  type: MaterialType.transparency,
                  child: ProgressRing(
                    progress: progress,
                    size: 56,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category.toUpperCase(),
                      style: textTheme.labelSmall?.copyWith(
                        color: colorScheme.primary,
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Hero(
                      tag: 'title-$id',
                      child: Material(
                        type: MaterialType.transparency,
                        child: Text(
                          title,
                          style: textTheme.titleMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              if (streak > 0)
                Hero(
                  tag: 'streak-$id',
                  child: Material(
                    type: MaterialType.transparency,
                    child: StreakBadge(streak: streak),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
