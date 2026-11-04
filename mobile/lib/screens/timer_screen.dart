import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/models/activity.dart';
import '../core/providers/activity_providers.dart';
import '../core/services/timer_service.dart';
import '../theme/app_theme.dart';

class TimerScreen extends ConsumerStatefulWidget {
  final String? initialActivityId;
  final bool isTab;

  const TimerScreen({
    super.key,
    this.initialActivityId,
    this.isTab = false,
  });

  @override
  ConsumerState<TimerScreen> createState() => _TimerScreenState();
}

class _TimerScreenState extends ConsumerState<TimerScreen> {
  final TextEditingController _notesController = TextEditingController();
  Activity? _selectedActivity;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final timerState = ref.watch(timerProvider);
    final activitiesAsync = ref.watch(activitiesProvider);

    // Auto-select initial activity if specified and idle
    if (widget.initialActivityId != null &&
        _selectedActivity == null &&
        timerState.status == TimerStatus.idle) {
      activitiesAsync.whenData((list) {
        final match = list.where((a) => a.id == widget.initialActivityId).firstOrNull;
        if (match != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) setState(() => _selectedActivity = match);
          });
        }
      });
    }

    // Sync selected activity with timer state if running
    final isRunning = timerState.status == TimerStatus.running;
    final isPaused = timerState.status == TimerStatus.paused;
    final isActive = isRunning || isPaused;

    Color activityColor = AppTheme.darkPrimary;
    if (isActive) {
      activityColor = _parseHexColor(timerState.activityColor);
    } else if (_selectedActivity != null) {
      activityColor = _parseHexColor(_selectedActivity!.color);
    }

    return Scaffold(
      backgroundColor: AppTheme.darkBgBase,
      appBar: AppBar(
        automaticallyImplyLeading: !widget.isTab,
        title: Text(
          'Focus Timer',
          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded),
            tooltip: 'Manual Log',
            onPressed: () => _showManualEntrySheet(context),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // 1. Activity Selector / Active Badge
              if (!isActive) ...[
                activitiesAsync.when(
                  data: (activities) {
                    if (activities.isEmpty) {
                      return _buildEmptyActivityPrompt();
                    }

                    // Default select first activity if none selected
                    _selectedActivity ??= activities.first;

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E2028),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.darkBorderSubtle),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedActivity?.id,
                          dropdownColor: const Color(0xFF262626),
                          isExpanded: false,
                          icon: const Icon(Icons.arrow_drop_down, color: AppTheme.darkTextMuted),
                          items: activities.map((a) {
                            return DropdownMenuItem<String>(
                              value: a.id,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 10,
                                    height: 10,
                                    decoration: BoxDecoration(
                                      color: _parseHexColor(a.color),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    a.name,
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.darkTextMain,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    '(${a.category})',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: AppTheme.darkTextMuted,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                          onChanged: (id) {
                            if (id != null) {
                              setState(() {
                                _selectedActivity =
                                    activities.firstWhere((element) => element.id == id);
                              });
                            }
                          },
                        ),
                      ),
                    );
                  },
                  loading: () => const CircularProgressIndicator(strokeWidth: 2),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ] else ...[
                // Active session badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: activityColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: activityColor.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(color: activityColor, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        timerState.activityName,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkTextMain,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        isPaused ? '• PAUSED' : '• RECORDING',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isPaused ? Colors.amber : activityColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 36),

              // 2. Large Glowing Circular Progress Dial
              _buildTimerDial(timerState, activityColor),

              const SizedBox(height: 36),

              // 3. Daily Target Progress Indicator
              if (_getTargetMinutes(timerState) != null && _getTargetMinutes(timerState)! > 0) ...[
                _buildTargetProgressBar(timerState, activityColor),
                const SizedBox(height: 24),
              ],

              // 4. Session Notes Input
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E2028),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.darkBorderSubtle),
                ),
                child: TextField(
                  controller: _notesController,
                  style: GoogleFonts.inter(fontSize: 13, color: AppTheme.darkTextMain),
                  maxLines: 2,
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    hintText: 'Notes: What are you focusing on today?',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppTheme.darkTextMuted),
                    icon: const Icon(Icons.edit_note_rounded, color: AppTheme.darkTextMuted),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // 5. Action Control Buttons
              _buildControlButtons(context, ref, timerState, activityColor),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTimerDial(TimerState state, Color color) {
    final formattedTime = state.formattedDuration;
    final isPaused = state.status == TimerStatus.paused;

    return Center(
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer ambient glow ring
          Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: isPaused ? 0.1 : 0.25),
                  blurRadius: 40,
                  spreadRadius: 4,
                ),
              ],
            ),
          ),
          // Circular progress track
          SizedBox(
            width: 240,
            height: 240,
            child: CircularProgressIndicator(
              value: state.status == TimerStatus.idle
                  ? 0.0
                  : (state.targetProgressPercent / 100.0).clamp(0.0, 1.0),
              strokeWidth: 8,
              backgroundColor: const Color(0xFF262626),
              valueColor: AlwaysStoppedAnimation<Color>(isPaused ? Colors.amber : color),
            ),
          ),
          // Center digital readout
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                formattedTime,
                style: GoogleFonts.robotoMono(
                  fontSize: 42,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.darkTextMain,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                state.status == TimerStatus.idle
                  ? 'Ready to Start'
                  : isPaused
                      ? 'Paused'
                      : 'Live Wall-Clock',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isPaused ? Colors.amber : AppTheme.darkTextMuted,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTargetProgressBar(TimerState state, Color color) {
    final targetMins = _getTargetMinutes(state)!;
    final currentMins = (state.liveElapsedSeconds / 60).toStringAsFixed(1);
    final pct = state.targetProgressPercent;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E2028),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2E313C)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Daily Goal Progress',
                style: GoogleFonts.inter(fontSize: 12, color: AppTheme.darkTextMuted),
              ),
              Text(
                '$currentMins / ${targetMins.toStringAsFixed(0)}m (${pct.toStringAsFixed(0)}%)',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct / 100.0,
              minHeight: 6,
              backgroundColor: const Color(0xFF2E313C),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlButtons(
    BuildContext context,
    WidgetRef ref,
    TimerState state,
    Color color,
  ) {
    final isIdle = state.status == TimerStatus.idle;
    final isRunning = state.status == TimerStatus.running;
    final isPaused = state.status == TimerStatus.paused;

    if (isIdle) {
      return SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton.icon(
          onPressed: () {
            if (_selectedActivity != null) {
              ref.read(timerProvider.notifier).startTimer(
                    _selectedActivity!,
                    notes: _notesController.text.trim().isNotEmpty
                        ? _notesController.text.trim()
                        : null,
                  );
            }
          },
          icon: const Icon(Icons.play_arrow_rounded, size: 26, color: Colors.white),
          label: Text(
            'START SESSION',
            style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: color,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 4,
            shadowColor: color.withValues(alpha: 0.5),
          ),
        ),
      );
    }

    return Column(
      children: [
        Row(
          children: [
            // Pause / Resume Toggle Button
            Expanded(
              child: SizedBox(
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: () {
                    if (isRunning) {
                      ref.read(timerProvider.notifier).pauseTimer(
                            notes: _notesController.text.trim().isNotEmpty
                                ? _notesController.text.trim()
                                : null,
                          );
                    } else if (isPaused) {
                      ref.read(timerProvider.notifier).resumeTimer();
                    }
                  },
                  icon: Icon(
                    isRunning ? Icons.pause_rounded : Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 24,
                  ),
                  label: Text(
                    isRunning ? 'PAUSE' : 'RESUME',
                    style: GoogleFonts.outfit(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isRunning ? Colors.amber.shade800 : color,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Finish & Save Session Button
            Expanded(
              child: SizedBox(
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final savedSec = await ref.read(timerProvider.notifier).stopAndSaveTimer(
                          notes: _notesController.text.trim().isNotEmpty
                              ? _notesController.text.trim()
                              : null,
                        );
                    _notesController.clear();
                    if (context.mounted) {
                      final mins = (savedSec / 60).round();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('🎉 Completed & saved $mins minutes to your streak!'),
                          backgroundColor: Colors.green.shade700,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.check_circle_rounded, color: Colors.white, size: 22),
                  label: Text(
                    'FINISH & SAVE',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade700,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Discard Button
        TextButton(
          onPressed: () async {
            final confirm = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                backgroundColor: const Color(0xFF1E2028),
                title: const Text('Discard Session?'),
                content: const Text('Are you sure you want to discard this timer without saving?'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: const Text('Discard', style: TextStyle(color: Colors.redAccent)),
                  ),
                ],
              ),
            );
            if (confirm == true) {
              await ref.read(timerProvider.notifier).discardTimer();
              _notesController.clear();
            }
          },
          child: Text(
            'Discard Session',
            style: GoogleFonts.inter(fontSize: 12, color: Colors.redAccent.shade100),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyActivityPrompt() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E2028),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        'Please create an activity first to start tracking time.',
        style: GoogleFonts.inter(fontSize: 13, color: AppTheme.darkTextMuted),
      ),
    );
  }

  double? _getTargetMinutes(TimerState state) {
    if (state.dailyTargetMinutes != null) return state.dailyTargetMinutes;
    return _selectedActivity?.dailyTarget;
  }

  void _showManualEntrySheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ManualSessionSheet(selectedActivity: _selectedActivity),
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

/// BottomSheet for manual past session logging
class _ManualSessionSheet extends ConsumerStatefulWidget {
  final Activity? selectedActivity;
  const _ManualSessionSheet({this.selectedActivity});

  @override
  ConsumerState<_ManualSessionSheet> createState() => _ManualSessionSheetState();
}

class _ManualSessionSheetState extends ConsumerState<_ManualSessionSheet> {
  late Activity? _activity;
  int _minutes = 30;
  final TextEditingController _notesCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _activity = widget.selectedActivity;
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activitiesAsync = ref.watch(activitiesProvider);

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Color(0xFF1E2028),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Log Past Session',
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Activity dropdown
          activitiesAsync.when(
            data: (list) {
              _activity ??= list.isNotEmpty ? list.first : null;
              if (list.isEmpty) return const SizedBox.shrink();

              return DropdownButtonFormField<String>(
                value: _activity?.id,
                decoration: const InputDecoration(labelText: 'Activity'),
                dropdownColor: const Color(0xFF262626),
                items: list.map((a) {
                  return DropdownMenuItem(value: a.id, child: Text(a.name));
                }).toList(),
                onChanged: (id) {
                  setState(() {
                    _activity = list.firstWhere((element) => element.id == id);
                  });
                },
              );
            },
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const SizedBox.shrink(),
          ),
          const SizedBox(height: 16),
          // Duration slider
          Text('Duration: $_minutes minutes', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          Slider(
            value: _minutes.toDouble(),
            min: 5,
            max: 240,
            divisions: 47,
            label: '$_minutes min',
            onChanged: (v) => setState(() => _minutes = v.round()),
          ),
          const SizedBox(height: 12),
          // Notes
          TextField(
            controller: _notesCtrl,
            decoration: const InputDecoration(
              hintText: 'Notes (optional)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () async {
                if (_activity != null) {
                  final now = DateTime.now();
                  final start = now.subtract(Duration(minutes: _minutes));
                  await ref.read(timerProvider.notifier).recordManualSession(
                        activity: _activity!,
                        startTime: start,
                        endTime: now,
                        notes: _notesCtrl.text.trim().isNotEmpty ? _notesCtrl.text.trim() : null,
                      );
                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Logged $_minutes min for ${_activity!.name}!')),
                    );
                  }
                }
              },
              child: const Text('Save Past Session'),
            ),
          ),
        ],
      ),
    );
  }
}

