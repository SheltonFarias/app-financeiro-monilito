'use client'

import { useSession } from 'next-auth/react'
import { ThemeToggle } from './ThemeToggle'
import { Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="header">
      <div className="flex items-center gap-3">
        {/* Botão hambúrguer — visível apenas no mobile */}
        <button
          onClick={onMenuClick}
          className="btn btn-ghost btn-icon"
          style={{ display: 'none' }}
          id="sidebar-toggle"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="header-title">
          Conquista Laguna — Apt. 203
        </div>
      </div>
      <div className="header-actions">
        <ThemeToggle />
        <div className="text-right mr-3 hidden sm:block">
          <div className="text-sm font-semibold">{session?.user?.name || 'Usuário'}</div>
          <div className="text-xs text-muted">Contrato 8.7877.1271835-8</div>
        </div>
        <div className="avatar" title={session?.user?.email || ''}>
          {session?.user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  )
}
