import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zoltra – Hitta B2B-leads och skapa personliga säljmail',
  description: 'Zoltra hjälper småföretag att hitta lokala B2B-leads och skapa personliga outreach-mail snabbt och enkelt.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
