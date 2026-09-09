'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TableProperties, History, Calculator, TrendingUp, LogOut, Settings, Target } from 'lucide-react'
import { signOut } from 'next-auth/react'

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()

  const mainNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tabela', label: 'Tabela de Parcelas', icon: TableProperties },
    { href: '/historico', label: 'Histórico Pago', icon: History },
    { href: '/tr-ipca', label: 'Índices BCB', icon: TrendingUp },
  ]

  const toolNavItems = [
    { href: '/simulador', label: 'Simular Aportes', icon: Calculator },
    { href: '/ferramentas/calculadora-reversa', label: 'Calculadora Reversa', icon: Target },
  ]

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
          style={{ display: 'block' }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <div className="icon-wrap">
              <Calculator size={20} />
            </div>
            <div>
              Amortização
              <div className="sidebar-brand-sub">PRICE + TR</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu Principal</div>
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon />
                {item.label}
              </Link>
            )
          })}

          <div className="sidebar-section-label mt-8">Ferramentas</div>
          {toolNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon />
                {item.label}
              </Link>
            )
          })}

          <div className="sidebar-section-label mt-8">Conta</div>
          <Link
            href="/config"
            className={`sidebar-link ${pathname === '/config' ? 'active' : ''}`}
            onClick={onClose}
          >
            <Settings />
            Configurações
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="sidebar-link w-full text-left text-danger hover:bg-danger-bg hover:text-danger"
          >
            <LogOut />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
