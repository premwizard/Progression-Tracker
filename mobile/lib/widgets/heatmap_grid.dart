import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/models/heatmap.dart';
import '../core/providers/activity_providers.dart';
import '../core/providers/heatmap_providers.dart';
import '../theme/app_theme.dart';

/// GitHub-style 365-day / 52-week progression heatmap widget.
class HeatmapGrid extends StatelessWidget {
  final HeatmapGridData data;
  final Color? baseColor;
  final ValueChanged<HeatmapDayCell>? onCellTap;

  const HeatmapGrid({
    super.key,
    required this.data,
    this.baseColor,
    this.onCellTap,
  });

  @override
  Widget build(BuildContext context) {
    if (data.cells.isEmpty) {
      return const SizedBox(
        height: 140,
        child: Center(
          child: Text(
            'No heatmap data available',
            style: TextStyle(color: AppTheme.darkTextMuted, fontSize: 13),
          ),
        ),
      );
    }

    // Determine grid columns and layout
    // Weekday: DateTime.monday = 1, DateTime.sunday = 7
    // Each column is 1 week (7 rows: Mon = 0 to Sun = 6)
    final firstDate = data.cells.first.date;
    final leadingEmptyDays = (firstDate.weekday - 1); // 0 if Mon

    // Group cells into week columns
    final List<List<HeatmapDayCell?>> weeks = [];
    List<HeatmapDayCell?> currentWeek = List.filled(leadingEmptyDays, null, growable: true);

    for (final cell in data.cells) {
      currentWeek.add(cell);
      if (currentWeek.length == 7) {
        weeks.add(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.isNotEmpty) {
      while (currentWeek.length < 7) {
        currentWeek.add(null);
      }
      weeks.add(currentWeek);
    }

    const cellSize = 12.0;
    const cellGap = 3.0;
    final totalWidth = weeks.length * (cellSize + cellGap) + 40.0;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: SizedBox(
        width: totalWidth,
        height: 155,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Month headers row
            _buildMonthHeaders(weeks, cellSize, cellGap),
            const SizedBox(height: 4),
            // Days grid with weekday labels
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildWeekdayLabels(cellSize, cellGap),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Row(
                      children: weeks.map((week) {
                        return Padding(
                          padding: const EdgeInsets.only(right: cellGap),
                          child: Column(
                            children: week.map((cell) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: cellGap),
                                child: _buildDayCell(context, cell, cellSize),
                              );
                            }).toList(),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMonthHeaders(
    List<List<HeatmapDayCell?>> weeks,
    double cellSize,
    double cellGap,
  ) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final labels = <Widget>[
      const SizedBox(width: 24), // Offset for weekday label column
    ];

    int? lastMonth;
    for (int col = 0; col < weeks.length; col++) {
      final firstValidCell = weeks[col].firstWhere((c) => c != null, orElse: () => null);
      if (firstValidCell != null && firstValidCell.date.month != lastMonth) {
        lastMonth = firstValidCell.date.month;
        labels.add(
          SizedBox(
            width: (cellSize + cellGap) * 4,
            child: Text(
              months[lastMonth - 1],
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: AppTheme.darkTextMuted,
              ),
            ),
          ),
        );
      }
    }

    return Row(children: labels);
  }

  Widget _buildWeekdayLabels(double cellSize, double cellGap) {
    const days = ['Mon', '', 'Wed', '', 'Fri', '', ''];
    return Column(
      children: days.map((day) {
        return SizedBox(
          height: cellSize + cellGap,
          width: 22,
          child: Text(
            day,
            style: GoogleFonts.inter(
              fontSize: 9,
              color: AppTheme.darkTextMuted.withValues(alpha: 0.8),
              fontWeight: FontWeight.w500,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDayCell(BuildContext context, HeatmapDayCell? cell, double size) {
    if (cell == null) {
      return SizedBox(width: size, height: size);
    }

    final color = _resolveLevelColor(cell.intensityLevel);

    return InkWell(
      onTap: () => onCellTap?.call(cell),
      borderRadius: BorderRadius.circular(2.5),
      child: Tooltip(
        message:
            '${_formatDate(cell.date)}: Level ${cell.intensityLevel} (${_formatDuration(cell.totalDurationSeconds)})',
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2.5),
            border: cell.intensityLevel == 0
                ? Border.all(color: const Color(0xFF2E313C), width: 0.6)
                : null,
          ),
        ),
      ),
    );
  }

  Color _resolveLevelColor(int level) {
    if (baseColor != null) {
      final base = baseColor!;
      switch (level) {
        case 1:
          return base.withValues(alpha: 0.25);
        case 2:
          return base.withValues(alpha: 0.50);
        case 3:
          return base.withValues(alpha: 0.75);
        case 4:
          return base;
        default:
          return const Color(0xFF1E2028);
      }
    }

    // Default GitHub emerald progression palette
    switch (level) {
      case 1:
        return const Color(0xFF0E4429);
      case 2:
        return const Color(0xFF006D32);
      case 3:
        return const Color(0xFF26A641);
      case 4:
        return const Color(0xFF39D353);
      default:
        return const Color(0xFF1E2028);
    }
  }

  static String _formatDate(DateTime d) {
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  static String _formatDuration(int seconds) {
    if (seconds <= 0) return '0m';
    final hours = seconds ~/ 3600;
    final mins = (seconds % 3600) ~/ 60;
    if (hours > 0) return '${hours}h ${mins}m';
    return '${mins}m';
  }
}

/// Full card container embedding the Heatmap with activity filters, streak metrics, and legend.
class HeatmapCard extends ConsumerWidget {
  const HeatmapCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final heatmapAsync = ref.watch(heatmapGridDataProvider);
    final activitiesAsync = ref.watch(activitiesProvider);
    final selectedActivityId = ref.watch(heatmapSelectedActivityIdProvider);
    final selectedYear = ref.watch(heatmapYearFilterProvider);

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingMd),
      decoration: BoxDecoration(
        color: AppTheme.darkBgSurface.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(AppTheme.radiusXl),
        border: Border.all(color: AppTheme.darkBorderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Title + Activity filter
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text('🔥', style: TextStyle(fontSize: 18)),
                  const SizedBox(width: 8),
                  Text(
                    'Consistency Heatmap',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.darkTextMain,
                    ),
                  ),
                ],
              ),
              // Activity Dropdown Filter
              activitiesAsync.when(
                data: (activities) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E2028),
                      borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                      border: Border.all(color: AppTheme.darkBorderSubtle),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String?>(
                        value: selectedActivityId,
                        dropdownColor: const Color(0xFF262626),
                        style: GoogleFonts.inter(fontSize: 12, color: AppTheme.darkTextMain),
                        isDense: true,
                        icon: const Icon(Icons.arrow_drop_down, color: AppTheme.darkTextMuted, size: 18),
                        items: [
                          const DropdownMenuItem<String?>(
                            value: null,
                            child: Text('All Activities'),
                          ),
                          ...activities.map((a) {
                            return DropdownMenuItem<String?>(
                              value: a.id,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: _parseHexColor(a.color),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    a.name.length > 14 ? '${a.name.substring(0, 14)}...' : a.name,
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                        onChanged: (newVal) {
                          ref.read(heatmapSelectedActivityIdProvider.notifier).state = newVal;
                        },
                      ),
                    ),
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Heatmap Grid body with Async loading
          heatmapAsync.when(
            data: (gridData) {
              Color? activeColor;
              if (gridData.activity != null) {
                activeColor = _parseHexColor(gridData.activity!.color);
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Stats row: Active days, streaks, consistency
                  Row(
                    children: [
                      _buildStatChip(
                        label: 'Active Days',
                        value: '${gridData.activeDays}/${gridData.totalDays}',
                        sub: '(${gridData.consistencyPercentage}%)',
                      ),
                      const SizedBox(width: 10),
                      _buildStatChip(
                        label: 'Current Streak',
                        value: '${gridData.currentStreak}d',
                        isFlame: true,
                      ),
                      const SizedBox(width: 10),
                      _buildStatChip(
                        label: 'Longest',
                        value: '${gridData.longestStreak}d',
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Heatmap interactive canvas
                  HeatmapGrid(
                    data: gridData,
                    baseColor: activeColor,
                    onCellTap: (cell) => _showDayDrilldown(context, cell),
                  ),

                  const SizedBox(height: 10),
                  // Legend row (Less -> More)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        selectedYear == null ? 'Past 365 Days' : 'Year $selectedYear',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppTheme.darkTextMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      _buildLegend(activeColor),
                    ],
                  ),
                ],
              );
            },
            loading: () => const SizedBox(
              height: 160,
              child: Center(
                child: CircularProgressIndicator(color: AppTheme.darkPrimary, strokeWidth: 2),
              ),
            ),
            error: (err, _) => SizedBox(
              height: 100,
              child: Center(
                child: Text('Error: $err', style: const TextStyle(color: Colors.redAccent)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip({
    required String label,
    required String value,
    String? sub,
    bool isFlame = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF1E2028),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF2E313C)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(fontSize: 9, color: AppTheme.darkTextMuted, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 2),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isFlame) ...[
                const Text('🔥 ', style: TextStyle(fontSize: 11)),
              ],
              Text(
                value,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.darkTextMain,
                ),
              ),
              if (sub != null) ...[
                const SizedBox(width: 4),
                Text(
                  sub,
                  style: GoogleFonts.inter(fontSize: 10, color: AppTheme.darkTextMuted),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegend(Color? baseColor) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Less',
          style: GoogleFonts.inter(fontSize: 10, color: AppTheme.darkTextMuted),
        ),
        const SizedBox(width: 6),
        ...List.generate(5, (index) {
          Color c;
          if (index == 0) {
            c = const Color(0xFF1E2028);
          } else if (baseColor != null) {
            c = baseColor.withValues(alpha: index * 0.25);
          } else {
            const greens = [
              Color(0xFF1E2028),
              Color(0xFF0E4429),
              Color(0xFF006D32),
              Color(0xFF26A641),
              Color(0xFF39D353),
            ];
            c = greens[index];
          }
          return Container(
            width: 10,
            height: 10,
            margin: const EdgeInsets.only(right: 3),
            decoration: BoxDecoration(
              color: c,
              borderRadius: BorderRadius.circular(2),
              border: index == 0 ? Border.all(color: const Color(0xFF2E313C), width: 0.5) : null,
            ),
          );
        }),
        const SizedBox(width: 3),
        Text(
          'More',
          style: GoogleFonts.inter(fontSize: 10, color: AppTheme.darkTextMuted),
        ),
      ],
    );
  }

  void _showDayDrilldown(BuildContext context, HeatmapDayCell cell) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _DayDrilldownSheet(cell: cell),
    );
  }

  static Color _parseHexColor(String hex) {
    final clean = hex.replaceAll('#', '');
    if (clean.length == 6) {
      return Color(int.parse('FF$clean', radix: 16));
    }
    return AppTheme.darkPrimary;
  }
}

/// BottomSheet presenting date-specific drilldown inspector
class _DayDrilldownSheet extends ConsumerWidget {
  final HeatmapDayCell cell;

  const _DayDrilldownSheet({required this.cell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final drilldownAsync = ref.watch(heatmapDrilldownDetailsProvider(cell.date));

    final dateStr =
        '${cell.date.year}-${cell.date.month.toString().padLeft(2, '0')}-${cell.date.day.toString().padLeft(2, '0')}';

    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingLg),
      decoration: const BoxDecoration(
        color: Color(0xFF1E2028),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Date title + Intensity badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dateStr,
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.darkTextMain,
                      ),
                    ),
                    Text(
                      _weekdayName(cell.date.weekday),
                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.darkTextMuted),
                    ),
                  ],
                ),
                _buildLevelBadge(cell.intensityLevel),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: Color(0xFF2E313C)),
            const SizedBox(height: 12),

            // Activities breakdown
            drilldownAsync.when(
              data: (drilldown) {
                if (drilldown.activities.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        'No activities logged for this day.',
                        style: TextStyle(color: AppTheme.darkTextMuted, fontSize: 13),
                      ),
                    ),
                  );
                }

                return Column(
                  children: drilldown.activities.map((act) {
                    final color = HeatmapCard._parseHexColor(act.activityColor);
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF262626),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.darkBorderSubtle),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  act.activityName,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.darkTextMain,
                                  ),
                                ),
                              ),
                              if (act.totalDurationSeconds > 0)
                                Text(
                                  HeatmapGrid._formatDuration(act.totalDurationSeconds),
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.darkPrimary,
                                  ),
                                ),
                              if (act.totalQuantity > 0)
                                Text(
                                  '+${act.totalQuantity} ${act.metricUnit ?? ""}',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.greenAccent,
                                  ),
                                ),
                            ],
                          ),
                          // Sessions notes if present
                          if (act.sessions.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            ...act.sessions.map((s) {
                              return s.notes != null
                                  ? Padding(
                                      padding: const EdgeInsets.only(left: 18, top: 2),
                                      child: Text(
                                        '• ${s.notes}',
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          color: AppTheme.darkTextMuted,
                                        ),
                                      ),
                                    )
                                  : const SizedBox.shrink();
                            }),
                          ],
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
              ),
              error: (err, _) => Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Error loading details: $err', style: const TextStyle(color: Colors.red)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLevelBadge(int level) {
    Color bg;
    String text;
    switch (level) {
      case 4:
        bg = const Color(0xFF39D353);
        text = 'Level 4 • Peak';
        break;
      case 3:
        bg = const Color(0xFF26A641);
        text = 'Level 3 • High';
        break;
      case 2:
        bg = const Color(0xFF006D32);
        text = 'Level 2 • Medium';
        break;
      case 1:
        bg = const Color(0xFF0E4429);
        text = 'Level 1 • Low';
        break;
      default:
        bg = const Color(0xFF2E313C);
        text = 'Level 0 • Rest';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: bg),
      ),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: level == 0 ? AppTheme.darkTextMuted : bg,
        ),
      ),
    );
  }

  static String _weekdayName(int weekday) {
    const names = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return names[(weekday - 1) % 7];
  }
}

