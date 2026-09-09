'use client'

import { useState } from 'react'
import { Sidebar } from '@/frontend/components/Sidebar'
import { Header } from '@/frontend/components/Header'
import { Providers } from '@/frontend/components/Providers'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Providers>
      <div className="app-shell">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-content">
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>
    </Providers>
  )
}
