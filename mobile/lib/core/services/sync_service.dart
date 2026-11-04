import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/dio_client.dart';
import '../storage/hive_storage.dart';

class SyncState {
  final bool isSyncing;
  final int pendingCount;
  final DateTime? lastSyncTime;
  final String? lastError;

  const SyncState({
    this.isSyncing = false,
    this.pendingCount = 0,
    this.lastSyncTime,
    this.lastError,
  });

  SyncState copyWith({
    bool? isSyncing,
    int? pendingCount,
    DateTime? lastSyncTime,
    String? lastError,
  }) {
    return SyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      pendingCount: pendingCount ?? this.pendingCount,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      lastError: lastError,
    );
  }
}

class SyncNotifier extends StateNotifier<SyncState> {
  final DioClient? _client;

  SyncNotifier({DioClient? client})
      : _client = client,
        super(SyncState(pendingCount: HiveStorage.getPendingSyncCount())) {
    refreshCount();
  }

  void refreshCount() {
    state = state.copyWith(pendingCount: HiveStorage.getPendingSyncCount());
  }

  Future<void> queueMutation({
    required String endpoint,
    String method = 'POST',
    required Map<String, dynamic> payload,
  }) async {
    final item = SyncQueueItem(
      id: '${DateTime.now().millisecondsSinceEpoch}_${endpoint.hashCode}',
      endpoint: endpoint,
      method: method,
      payload: payload,
      timestamp: DateTime.now(),
    );
    await HiveStorage.addToSyncQueue(item);
    refreshCount();

    // Optimistically attempt to sync immediately if client is available
    if (_client != null) {
      await syncNow();
    }
  }

  Future<bool> syncNow() async {
    if (state.isSyncing) return false;
    refreshCount();

    final items = HiveStorage.getPendingSyncItems();
    if (items.isEmpty) {
      state = state.copyWith(lastSyncTime: DateTime.now(), lastError: null);
      return true;
    }

    state = state.copyWith(isSyncing: true, lastError: null);

    if (_client == null) {
      // Mock / Offline mode: simulated drain
      for (var item in items) {
        await HiveStorage.removeSyncQueueItem(item.id);
      }
      state = state.copyWith(
        isSyncing: false,
        pendingCount: 0,
        lastSyncTime: DateTime.now(),
      );
      return true;
    }

    int successCount = 0;
    String? lastErr;

    for (var item in items) {
      try {
        await _client.dio.request(
          item.endpoint,
          data: item.payload,
          options: Options(method: item.method),
        );
        await HiveStorage.removeSyncQueueItem(item.id);
        successCount++;
      } catch (e) {
        lastErr = e.toString();
        // Update item retry count and stop drain to preserve FIFO dependency order
        await HiveStorage.updateSyncQueueItem(item.copyWith(retryCount: item.retryCount + 1));
        break;
      }
    }

    refreshCount();
    state = state.copyWith(
      isSyncing: false,
      lastSyncTime: successCount > 0 ? DateTime.now() : state.lastSyncTime,
      lastError: lastErr,
    );

    return lastErr == null;
  }
}

final syncProvider = StateNotifierProvider<SyncNotifier, SyncState>((ref) {
  DioClient? client;
  try {
    client = DioClient();
  } catch (_) {
    client = null;
  }
  return SyncNotifier(client: client);
});
