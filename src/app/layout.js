import './globals.css'
import { Inter } from 'next/font/google'
import ReduxProvider from './providers/ReduxProvider'
import AuthProvider from './components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'Entrance Academy - Nepal Medical & Engineering Entrance Exam Preparation',
    template: '%s | Entrance Academy'
  },
  description: 'Comprehensive online platform for Nepal entrance exam preparation including MECEE-BL, IOE, TU, KU entrance exams. Practice MCQs, mock tests, and get detailed solutions for MBBS, BDS, Engineering, and other professional courses.',
  keywords: [
    'Nepal entrance exam',
    'MECEE-BL preparation',
    'IOE entrance exam',
    'TU entrance exam',
    'KU entrance exam',
    'MBBS entrance Nepal',
    'BDS entrance Nepal',
    'Engineering entrance Nepal',
    'Medical entrance preparation',
    'MCQ practice Nepal',
    'Online test platform Nepal',
    'Entrance Academy',
    'Nepal medical entrance',
    'BSc Nursing entrance',
    'BPH entrance exam',
    'BAMS entrance exam',
    'Mental Agility Test',
    'Nepal student preparation'
  ],
  authors: [{ name: 'Entrance Academy Team' }],
  creator: 'Entrance Academy',
  publisher: 'Entrance Academy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://entrance.academy'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Entrance Academy - Nepal Medical & Engineering Entrance Exam Preparation',
    description: 'Comprehensive online platform for Nepal entrance exam preparation including MECEE-BL, IOE, TU, KU entrance exams. Practice MCQs, mock tests, and get detailed solutions.',
    url: 'https://entrance.academy',
    siteName: 'Entrance Academy',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Entrance Academy - Nepal Entrance Exam Preparation Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Entrance Academy - Nepal Medical & Engineering Entrance Exam Preparation',
    description: 'Comprehensive online platform for Nepal entrance exam preparation including MECEE-BL, IOE, TU, KU entrance exams.',
    images: ['/twitter-image.jpg'],
    creator: '@entranceacademy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#3B82F6',
      },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'education',
  classification: 'Educational Platform',
  referrer: 'origin-when-cross-origin',
  colorScheme: 'light',
  themeColor: '#3B82F6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  other: {
    'msapplication-TileColor': '#3B82F6',
    'msapplication-config': '/browserconfig.xml',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Additional SEO and Performance Meta Tags */}
        <meta name="application-name" content="Entrance Academy" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Entrance Academy" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-starturl" content="/" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
        <meta name="msapplication-square70x70logo" content="/mstile-70x70.png" />
        <meta name="msapplication-square150x150logo" content="/mstile-150x150.png" />
        <meta name="msapplication-wide310x150logo" content="/mstile-310x150.png" />
        <meta name="msapplication-square310x310logo" content="/mstile-310x310.png" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for common external resources */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "Entrance Academy",
              "url": "https://entrance.academy",
              "logo": "https://entrance.academy/logo.png",
              "description": "Comprehensive online platform for Nepal entrance exam preparation including MECEE-BL, IOE, TU, KU entrance exams.",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "NP",
                "addressRegion": "Nepal"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "url": "https://entrance.academy/contact"
              },
              "sameAs": [
                "https://www.facebook.com/entranceacademy",
                "https://www.twitter.com/entranceacademy",
                "https://www.instagram.com/entranceacademy"
              ],
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://entrance.academy/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
        
        {/* Structured Data for Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Entrance Academy",
              "url": "https://entrance.academy",
              "description": "Nepal's premier online entrance exam preparation platform",
              "inLanguage": "en",
              "copyrightYear": "2024",
              "creator": {
                "@type": "Organization",
                "name": "Entrance Academy"
              }
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ReduxProvider>
          <AuthProvider>
            <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
              {children}
            </main>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
