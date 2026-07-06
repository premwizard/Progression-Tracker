import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('Mobile app smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that the title is displayed
    expect(find.text('Progression Tracker'), findsOneWidget);

    // Verify that the action buttons are displayed
    expect(find.text('Get Started'), findsOneWidget);
    expect(find.text('View Demo'), findsOneWidget);
  });
}
