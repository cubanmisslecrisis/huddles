import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Huddle - Your city, made social',
  description:
    'Huddles turns a real city map into a shared social world: see where friends are, what they recommend, which huddles are forming, and what spots they saved.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#FFF8EE',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
