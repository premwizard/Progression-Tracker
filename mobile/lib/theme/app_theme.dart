import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // --- Constants (Matching Tailwind Scale) ---
  static const double spacingSm = 8.0;
  static const double spacingMd = 16.0;
  static const double spacingLg = 24.0;
  static const double spacingXl = 32.0;
  static const double radiusLg = 12.0; // rounded-xl equivalent approx
  static const double radiusXl = 16.0; // rounded-2xl equivalent

  // --- Dark Mode Colors ---
  static const Color darkBgBase = Color(0xFF171717);
  static const Color darkBgSurface = Color(0xFF262626);
  static const Color darkTextMain = Color(0xFFF5F5F5);
  static const Color darkTextMuted = Color(0xFFA3A3A3);
  static const Color darkPrimary = Color(0xFFF97316);
  static const Color darkPrimaryHover = Color(0xFFEA580C);
  static const Color darkAccent = Color(0xFFFBBF24);
  static const Color darkBorderSubtle = Color(0xFF404040);

  // --- Light Mode Colors ---
  static const Color lightBgBase = Color(0xFFFAFAFA);
  static const Color lightBgSurface = Color(0xFFFFFFFF);
  static const Color lightTextMain = Color(0xFF171717);
  static const Color lightTextMuted = Color(0xFF737373);
  static const Color lightPrimary = Color(0xFFEA580C);
  static const Color lightPrimaryHover = Color(0xFFC2410C);
  static const Color lightAccent = Color(0xFFF59E0B);
  static const Color lightBorderSubtle = Color(0xFFE5E5E5);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBgBase,
      colorScheme: const ColorScheme.dark(
        primary: darkPrimary,
        secondary: darkAccent,
        surface: darkBgSurface,
        onSurface: darkTextMain,
        outline: darkBorderSubtle,
      ),
      textTheme: _buildTextTheme(Brightness.dark),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkBgBase,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardThemeData(
        color: darkBgSurface.withOpacity(0.8), // Glass feel approx
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusXl),
          side: const BorderSide(color: darkBorderSubtle, width: 1),
        ),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightBgBase,
      colorScheme: const ColorScheme.light(
        primary: lightPrimary,
        secondary: lightAccent,
        surface: lightBgSurface,
        onSurface: lightTextMain,
        outline: lightBorderSubtle,
      ),
      textTheme: _buildTextTheme(Brightness.light),
      appBarTheme: const AppBarTheme(
        backgroundColor: lightBgBase,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
      ),
      cardTheme: CardThemeData(
        color: lightBgSurface.withOpacity(0.8), // Glass feel approx
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusXl),
          side: const BorderSide(color: lightBorderSubtle, width: 1),
        ),
      ),
    );
  }

  static TextTheme _buildTextTheme(Brightness brightness) {
    final textColor = brightness == Brightness.dark ? darkTextMain : lightTextMain;
    
    // --font-display: 'Outfit', --font-sans: 'Inter'
    return TextTheme(
      displayLarge: GoogleFonts.outfit(fontSize: 57, fontWeight: FontWeight.bold, color: textColor, letterSpacing: -1.5),
      displayMedium: GoogleFonts.outfit(fontSize: 45, fontWeight: FontWeight.bold, color: textColor, letterSpacing: -1.0),
      displaySmall: GoogleFonts.outfit(fontSize: 36, fontWeight: FontWeight.bold, color: textColor, letterSpacing: -0.5),
      headlineLarge: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w600, color: textColor),
      headlineMedium: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w600, color: textColor),
      headlineSmall: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w600, color: textColor),
      titleLarge: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w600, color: textColor),
      
      // Body uses Inter
      titleMedium: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: textColor),
      titleSmall: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: textColor),
      bodyLarge: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.normal, color: textColor),
      bodyMedium: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.normal, color: textColor),
      bodySmall: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.normal, color: textColor),
      labelLarge: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textColor),
      labelMedium: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: textColor),
      labelSmall: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: textColor),
    );
  }
}
