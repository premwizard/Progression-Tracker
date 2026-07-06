import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import { Header } from '../components/layout/Header';
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
          <Header />
          <main className="relative w-full h-full pb-20">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

