import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/activity.dart';
import '../models/session.dart';
import '../network/tracking_repository.dart';
import '../providers/activity_providers.dart';
import '../storage/hive_storage.dart';

enum TimerStatus {
  idle,
  running,
  paused,
  completed,
}

class TimerState {
  final TimerStatus status;
  final String? sessionId;
  final String activityId;
  final String activityName;
  final String activityColor;
  final String activityIcon;
  final DateTime startTime;
  final DateTime? endTime;
  final int pausedDurationSeconds;
  final DateTime? currentPauseStartTime;
  final String? notes;
  final double? dailyTargetMinutes;
  final int tick; // Triggers UI re-render on periodic clock ticks

  const TimerState({
    this.status = TimerStatus.idle,
    this.sessionId,
    this.activityId = '',
    this.activityName = '',
    this.activityColor = '#F97316',
    this.activityIcon = 'dumbbell',
    required this.startTime,
    this.endTime,
    this.pausedDurationSeconds = 0,
    this.currentPauseStartTime,
    this.notes,
    this.dailyTargetMinutes,
    this.tick = 0,
  });

  /// The core mathematical invariant:
  /// Elapsed = (Now - StartTime) - TotalPausedDuration
  int get liveElapsedSeconds {
    if (status == TimerStatus.idle) return 0;
    if (status == TimerStatus.completed && endTime != null) {
      final totalSec = endTime!.difference(startTime).inSeconds - pausedDurationSeconds;
      return totalSec > 0 ? totalSec : 0;
    }

    if (status == TimerStatus.paused && currentPauseStartTime != null) {
      final pausedAtSec = currentPauseStartTime!.difference(startTime).inSeconds - pausedDurationSeconds;
      return pausedAtSec > 0 ? pausedAtSec : 0;
    }

    final now = DateTime.now();
    final netSeconds = now.difference(startTime).inSeconds - pausedDurationSeconds;
    return netSeconds > 0 ? netSeconds : 0;
  }

  String get formattedDuration {
    final total = liveElapsedSeconds;
    final hours = total ~/ 3600;
    final minutes = (total % 3600) ~/ 60;
    final seconds = total % 60;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  double get targetProgressPercent {
    if (dailyTargetMinutes == null || dailyTargetMinutes! <= 0) return 0.0;
    final targetSec = (dailyTargetMinutes! * 60).round();
    if (targetSec <= 0) return 0.0;
    final pct = (liveElapsedSeconds / targetSec) * 100.0;
    return pct > 100.0 ? 100.0 : pct;
  }

  TimerState copyWith({
    TimerStatus? status,
    String? sessionId,
    String? activityId,
    String? activityName,
    String? activityColor,
    String? activityIcon,
    DateTime? startTime,
    DateTime? endTime,
    int? pausedDurationSeconds,
    DateTime? currentPauseStartTime,
    String? notes,
    double? dailyTargetMinutes,
    int? tick,
    bool clearPauseStartTime = false,
  }) {
    return TimerState(
      status: status ?? this.status,
      sessionId: sessionId ?? this.sessionId,
      activityId: activityId ?? this.activityId,
      activityName: activityName ?? this.activityName,
      activityColor: activityColor ?? this.activityColor,
      activityIcon: activityIcon ?? this.activityIcon,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      pausedDurationSeconds: pausedDurationSeconds ?? this.pausedDurationSeconds,
      currentPauseStartTime: clearPauseStartTime
          ? null
          : (currentPauseStartTime ?? this.currentPauseStartTime),
      notes: notes ?? this.notes,
      dailyTargetMinutes: dailyTargetMinutes ?? this.dailyTargetMinutes,
      tick: tick ?? this.tick,
    );
  }

  Map<String, dynamic> toJson() => {
    'status': status.name,
    'session_id': sessionId,
    'activity_id': activityId,
    'activity_name': activityName,
    'activity_color': activityColor,
    'activity_icon': activityIcon,
    'start_time': startTime.toIso8601String(),
    'end_time': endTime?.toIso8601String(),
    'paused_duration_seconds': pausedDurationSeconds,
    'current_pause_start_time': currentPauseStartTime?.toIso8601String(),
    'notes': notes,
    'daily_target_minutes': dailyTargetMinutes,
  };

  factory TimerState.fromJson(Map<String, dynamic> json) {
    return TimerState(
      status: TimerStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => TimerStatus.idle,
      ),
      sessionId: json['session_id'] as String?,
      activityId: json['activity_id'] as String? ?? '',
      activityName: json['activity_name'] as String? ?? '',
      activityColor: json['activity_color'] as String? ?? '#F97316',
      activityIcon: json['activity_icon'] as String? ?? 'dumbbell',
      startTime: json['start_time'] != null
          ? DateTime.parse(json['start_time'] as String)
          : DateTime.now(),
      endTime: json['end_time'] != null
          ? DateTime.parse(json['end_time'] as String)
          : null,
      pausedDurationSeconds:
          (json['paused_duration_seconds'] as num?)?.toInt() ?? 0,
      currentPauseStartTime: json['current_pause_start_time'] != null
          ? DateTime.parse(json['current_pause_start_time'] as String)
          : null,
      notes: json['notes'] as String?,
      dailyTargetMinutes: (json['daily_target_minutes'] as num?)?.toDouble(),
    );
  }

  static TimerState initial() {
    return TimerState(startTime: DateTime.now());
  }
}

class TimerNotifier extends StateNotifier<TimerState> {
  final TrackingRepository _trackingRepo;
  Timer? _ticker;

  TimerNotifier({TrackingRepository? trackingRepo})
      : _trackingRepo = trackingRepo ?? TrackingRepository(),
        super(TimerState.initial()) {
    _restoreSavedSession();
  }

  void _restoreSavedSession() {
    try {
      final saved = HiveStorage.getActiveTimer();
      if (saved != null) {
        final restored = TimerState.fromJson(saved);
        if (restored.status == TimerStatus.running) {
          state = restored;
          _startTicker();
        } else if (restored.status == TimerStatus.paused) {
          state = restored;
        }
      }
    } catch (_) {
      // Storage unavailable or empty
    }
  }

  void _startTicker() {
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (state.status == TimerStatus.running) {
        state = state.copyWith(tick: state.tick + 1);
      }
    });
  }

  void _stopTicker() {
    _ticker?.cancel();
    _ticker = null;
  }

  Future<void> startTimer(Activity activity, {String? notes}) async {
    final now = DateTime.now();
    state = TimerState(
      status: TimerStatus.running,
      activityId: activity.id,
      activityName: activity.name,
      activityColor: activity.color,
      activityIcon: activity.icon,
      startTime: now,
      pausedDurationSeconds: 0,
      dailyTargetMinutes: activity.dailyTarget,
      notes: notes,
    );

    await HiveStorage.saveActiveTimer(state.toJson());
    _startTicker();

    // Async sync to backend
    try {
      final session = await _trackingRepo.startSession(
        activity.id,
        notes: notes,
      );
      state = state.copyWith(sessionId: session.id);
      await HiveStorage.saveActiveTimer(state.toJson());
    } catch (_) {
      // Offline fallback: keep local session running
    }
  }

  Future<void> pauseTimer({String? notes}) async {
    if (state.status != TimerStatus.running) return;

    final now = DateTime.now();
    state = state.copyWith(
      status: TimerStatus.paused,
      currentPauseStartTime: now,
      notes: notes ?? state.notes,
    );

    _stopTicker();
    await HiveStorage.saveActiveTimer(state.toJson());

    if (state.sessionId != null) {
      try {
        await _trackingRepo.pauseSession(state.sessionId!, notes: notes);
      } catch (_) {}
    }
  }

  Future<void> resumeTimer() async {
    if (state.status != TimerStatus.paused) return;

    final now = DateTime.now();
    int addedPause = 0;
    if (state.currentPauseStartTime != null) {
      addedPause = now.difference(state.currentPauseStartTime!).inSeconds;
    }

    state = state.copyWith(
      status: TimerStatus.running,
      pausedDurationSeconds: state.pausedDurationSeconds + (addedPause > 0 ? addedPause : 0),
      clearPauseStartTime: true,
    );

    await HiveStorage.saveActiveTimer(state.toJson());
    _startTicker();

    if (state.sessionId != null) {
      try {
        await _trackingRepo.resumeSession(state.sessionId!);
      } catch (_) {}
    }
  }

  Future<int> stopAndSaveTimer({String? notes}) async {
    final finalDuration = state.liveElapsedSeconds;
    final now = DateTime.now();
    final sid = state.sessionId;

    state = state.copyWith(
      status: TimerStatus.completed,
      endTime: now,
      notes: notes ?? state.notes,
    );

    _stopTicker();
    await HiveStorage.clearActiveTimer();

    if (sid != null) {
      try {
        await _trackingRepo.finishSession(sid, notes: notes ?? state.notes);
      } catch (_) {}
    } else if (state.activityId.isNotEmpty) {
      // If was offline, post manual session to backend
      try {
        await _trackingRepo.manualAddSession(
          activityId: state.activityId,
          startTime: state.startTime,
          endTime: now,
          notes: notes ?? state.notes,
        );
      } catch (_) {}
    }

    // Reset to idle
    state = TimerState.initial();
    return finalDuration;
  }

  Future<void> discardTimer() async {
    _stopTicker();
    await HiveStorage.clearActiveTimer();
    state = TimerState.initial();
  }

  Future<void> recordManualSession({
    required Activity activity,
    required DateTime startTime,
    required DateTime endTime,
    String? notes,
  }) async {
    await _trackingRepo.manualAddSession(
      activityId: activity.id,
      startTime: startTime,
      endTime: endTime,
      notes: notes,
    );
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }
}

// Global Providers
final timerProvider = StateNotifierProvider<TimerNotifier, TimerState>((ref) {
  final trackingRepo = ref.watch(trackingRepositoryProvider);
  return TimerNotifier(trackingRepo: trackingRepo);
});

final isTimerActiveProvider = Provider<bool>((ref) {
  final status = ref.watch(timerProvider.select((s) => s.status));
  return status == TimerStatus.running || status == TimerStatus.paused;
});
