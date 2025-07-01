import './globals.css'
import { Inter } from 'next/font/google'
import ReduxProvider from './providers/ReduxProvider'
import AuthProvider from './components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MCQ Test Platform',
  description: 'Advanced Multiple Choice Question Testing Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
