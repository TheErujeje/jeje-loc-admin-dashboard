import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { SeasonProvider } from '@/lib/season'
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/lib/theme'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'LOC Admin',
  description: "Jeje's League of Champions — admin dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white text-ink-900 font-sans dark:bg-ink-900 dark:text-ink-100">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>
          <AuthProvider>
            <SeasonProvider>{children}</SeasonProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
