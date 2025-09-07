import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TopNavigation } from '@/components/ui/navigation'
import { MobileFooterMenu } from '@/components/ui/mobile-footer-menu'
import { AuthProvider } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Affiliate Learning Platform',
  description: 'Learn and Earn with our comprehensive affiliate learning platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TopNavigation />
          <main className="min-h-screen pb-20 md:pb-0">
            {children}
          </main>
          <MobileFooterMenu />
        </AuthProvider>
      </body>
    </html>
  )
}