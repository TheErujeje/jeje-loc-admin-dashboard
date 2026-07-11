import type { Metadata } from 'next'
import { Inter, Oswald } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })

export const metadata: Metadata = {
  title: 'LOC Admin',
  description: "Jeje's League of Champions — admin dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <body className="min-h-screen bg-stadium-900 text-white font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
