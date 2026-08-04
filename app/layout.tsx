import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { SeasonProvider } from '@/lib/season'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'LOC Admin',
  description: "Jeje's League of Champions — admin dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white text-ink-900 font-sans">
        <AuthProvider>
          <SeasonProvider>{children}</SeasonProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
