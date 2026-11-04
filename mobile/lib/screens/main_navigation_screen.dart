import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/timer_service.dart';
import '../theme/app_theme.dart';
import '../widgets/floating_timer_bar.dart';
import 'tabs/activities_tab.dart';
import 'tabs/analytics_settings_tab.dart';
import 'tabs/dashboard_tab.dart';
import 'tabs/goals_tasks_tab.dart';
import 'timer_screen.dart';

class MainNavigationScreen extends ConsumerStatefulWidget {
  final int initialIndex;

  const MainNavigationScreen({super.key, this.initialIndex = 0});

  @override
  ConsumerState<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends ConsumerState<MainNavigationScreen> {
  late int _currentIndex;
  String? _targetActivityId;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  void _onSelectTab(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isTimerActive = ref.watch(isTimerActiveProvider);

    // Only show bottom floating timer if timer is active AND user is not already on the timer tab (index 2)
    final showFloatingTimer = isTimerActive && _currentIndex != 2;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          // 0: DASHBOARD TAB
          DashboardTab(
            onNavigateToTimer: () => _onSelectTab(2),
            onNavigateToActivities: () => _onSelectTab(1),
            onNavigateToGoals: () => _onSelectTab(3),
          ),

          // 1: ACTIVITIES / HEATMAPS TAB
          ActivitiesTab(
            onStartTimerForActivity: (activityId) {
              setState(() {
                _targetActivityId = activityId;
                _currentIndex = 2;
              });
            },
          ),

          // 2: FOCUS TIMER TAB
          TimerScreen(
            isTab: true,
            initialActivityId: _targetActivityId,
          ),

          // 3: GOALS & TASKS TAB
          const GoalsTasksTab(),

          // 4: ANALYTICS & SETTINGS TAB
          const AnalyticsSettingsTab(),
        ],
      ),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Persistent Floating Mini Timer Bar
          if (showFloatingTimer)
            FloatingTimerBar(
              onExpand: () => _onSelectTab(2),
            ),

          // 5-Tab Persistent Navigation Bar
          Container(
            decoration: BoxDecoration(
              color: theme.scaffoldBackgroundColor,
              border: Border(
                top: BorderSide(
                  color: theme.colorScheme.outline.withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
            ),
            child: NavigationBar(
              selectedIndex: _currentIndex,
              onDestinationSelected: _onSelectTab,
              backgroundColor: Colors.transparent,
              indicatorColor: theme.colorScheme.primary.withValues(alpha: 0.2),
              elevation: 0,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard, color: theme.colorScheme.primary),
                  label: 'Dashboard',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.grid_view_outlined),
                  selectedIcon: Icon(Icons.grid_view, color: theme.colorScheme.primary),
                  label: 'Activities',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.timer_outlined),
                  selectedIcon: Icon(Icons.timer, color: theme.colorScheme.primary),
                  label: 'Timer',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.track_changes_outlined),
                  selectedIcon: Icon(Icons.track_changes, color: theme.colorScheme.primary),
                  label: 'Goals',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.analytics_outlined),
                  selectedIcon: Icon(Icons.analytics, color: theme.colorScheme.primary),
                  label: 'Analytics',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
