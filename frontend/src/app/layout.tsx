import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import { TimerProvider } from '../context/TimerContext';
import { Header } from '../components/layout/Header';
import { TimerModal } from '../components/timer/TimerModal';
import { FloatingTimerBar } from '../components/timer/FloatingTimerBar';
import './globals.css';
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: 'Progression Tracker',
  description: 'Track your skills, goals, and habits over time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans")}>
      <body className="min-h-screen bg-bg-base text-text-main font-sans selection:bg-primary/30 selection:text-primary">
        <AuthProvider>
          <TimerProvider>
            <Header />
            <main className="relative w-full h-full pb-20">
              {children}
            </main>
            <FloatingTimerBar />
            <TimerModal />
          </TimerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

