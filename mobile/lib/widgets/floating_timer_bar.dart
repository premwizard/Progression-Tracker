import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/services/timer_service.dart';
import '../screens/timer_screen.dart';
import '../theme/app_theme.dart';

/// Floating mini-timer bar displayed persistently at the bottom when a timer is running or paused.
class FloatingTimerBar extends ConsumerWidget {
  const FloatingTimerBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timerState = ref.watch(timerProvider);
    final isActive = ref.watch(isTimerActiveProvider);

    if (!isActive) return const SizedBox.shrink();

    final isPaused = timerState.status == TimerStatus.paused;
    final color = _parseHexColor(timerState.activityColor);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const TimerScreen()),
              );
            },
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E2028).withValues(alpha: 0.95),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: color.withValues(alpha: 0.6), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: color.withValues(alpha: 0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Animated pulsing status dot
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: isPaused ? Colors.amber : color,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Activity name & status
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          timerState.activityName.isNotEmpty
                              ? timerState.activityName
                              : 'Active Session',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.darkTextMain,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          isPaused ? 'Paused' : 'Recording effort...',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: isPaused ? Colors.amber : AppTheme.darkTextMuted,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Digital Duration Readout
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black26,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      timerState.formattedDuration,
                      style: GoogleFonts.robotoMono(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.darkTextMain,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Play / Pause Icon Button
                  IconButton(
                    iconSize: 22,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    icon: Icon(
                      isPaused ? Icons.play_arrow_rounded : Icons.pause_rounded,
                      color: AppTheme.darkTextMain,
                    ),
                    onPressed: () {
                      if (isPaused) {
                        ref.read(timerProvider.notifier).resumeTimer();
                      } else {
                        ref.read(timerProvider.notifier).pauseTimer();
                      }
                    },
                  ),
                  const SizedBox(width: 8),

                  // Stop & Save Button
                  IconButton(
                    iconSize: 20,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    icon: const Icon(Icons.check_circle_rounded, color: Colors.greenAccent),
                    onPressed: () async {
                      await ref.read(timerProvider.notifier).stopAndSaveTimer();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Session saved successfully! 🎉'),
                            backgroundColor: Colors.green,
                            duration: Duration(seconds: 2),
                          ),
                        );
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
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

