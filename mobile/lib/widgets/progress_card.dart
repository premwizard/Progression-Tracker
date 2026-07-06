import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_theme.dart';

class ProgressCard extends StatefulWidget {
  final String id;
  final String title;
  final String category;
  final int progress;
  final int streak;
  final bool isCompleted;
  final VoidCallback? onTap;

  const ProgressCard({
    super.key,
    required this.id,
    required this.title,
    required this.category,
    required this.progress,
    required this.streak,
    this.isCompleted = false,
    this.onTap,
  });

  @override
  State<ProgressCard> createState() => _ProgressCardState();
}

class _ProgressCardState extends State<ProgressCard> with SingleTickerProviderStateMixin {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
          transform: Matrix4.translationValues(0, _isHovered ? -4 : 0, 0),
          decoration: BoxDecoration(
            color: theme.cardTheme.color,
            borderRadius: BorderRadius.circular(AppTheme.radiusXl),
            border: Border.all(
              color: _isHovered ? theme.colorScheme.primary.withOpacity(0.3) : theme.colorScheme.outline,
              width: 1,
            ),
            boxShadow: _isHovered
                ? [
                    BoxShadow(
                      color: theme.colorScheme.primary.withOpacity(0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    )
                  ]
                : [],
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppTheme.spacingLg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header (Category & Target Icon)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                            margin: const EdgeInsets.bottom(8),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.outline.withOpacity(0.5),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              widget.category,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                              ),
                            ),
                          ),
                          AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 200),
                            style: theme.textTheme.titleLarge!.copyWith(
                              color: _isHovered ? theme.colorScheme.primary : theme.colorScheme.onSurface,
                              height: 1.2,
                            ),
                            child: Text(widget.title),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: _isHovered ? theme.colorScheme.primary.withOpacity(0.05) : theme.scaffoldBackgroundColor,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _isHovered ? theme.colorScheme.primary.withOpacity(0.3) : theme.colorScheme.outline,
                        ),
                      ),
                      child: Icon(
                        LucideIcons.target,
                        size: 20,
                        color: _isHovered ? theme.colorScheme.primary : theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
                
                const Spacer(),
                const SizedBox(height: AppTheme.spacingLg),
                
                // Footer (Streak & Progress)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Streak & Status
                    Row(
                      children: [
                        if (widget.streak > 0) ...[
                          Icon(LucideIcons.flame, size: 16, color: theme.colorScheme.secondary),
                          const SizedBox(width: 6),
                          Text(
                            '${widget.streak} Days',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: theme.colorScheme.secondary,
                            ),
                          ),
                          const SizedBox(width: 16),
                        ],
                        Text(
                          widget.isCompleted ? 'Completed' : 'In Progress',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                          ),
                        ),
                      ],
                    ),
                    
                    // Progress Bar
                    Row(
                      children: [
                        Container(
                          width: 96, // w-24 equivalent
                          height: 8, // h-2 equivalent
                          decoration: BoxDecoration(
                            color: theme.colorScheme.outline.withOpacity(0.5),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: (widget.progress.clamp(0, 100)) / 100.0,
                            child: AnimatedContainer(
                              duration: const Duration(seconds: 1),
                              curve: Curves.easeOut,
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '${widget.progress}%',
                          style: theme.textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
