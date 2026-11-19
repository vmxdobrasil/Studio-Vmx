import {
  Home,
  KeyRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Plug,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { APP_NAME } from '../config'
import { navigate, type Route } from '../lib/router'
import { signOut, type SessionUser } from '../services/auth'
import { useApp } from '../store/app'
import { BrandLogo } from './BrandLogo'
import { cx } from './ui'

const COLLAPSED_KEY = 'cs-sidebar-collapsed'

/* Menu lateral no padrão do skip-design-system: marca no topo, seções em
   pílulas (Início, Brand Kit, Lixeira) e a conta do usuário no rodapé. O
   Studio não é seção — o editor abre clicando num carrossel. O botão no
   cabeçalho coloca a sidebar em 72px (só ícones) e a escolha fica salva. */
export function SideNav({ route, user }: { route: Route; user: SessionUser }) {
  const trashCount = useApp((s) => Object.values(s.carousels).filter((c) => c.deletedAt).length)
  const saveState = useApp((s) => s.saveState)
  const label = user.name || user.email
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === '1')

  const toggle = () =>
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSED_KEY, v ? '0' : '1')
      return !v
    })

  const items = [
    { key: 'home', label: 'Início', icon: Home, go: () => navigate('/') },
    { key: 'brand-kits', label: 'Brand Kit', icon: Palette, go: () => navigate('/brand-kits') },
    {
      key: 'trash',
      label: 'Lixeira',
      icon: Trash2,
      go: () => navigate('/lixeira'),
      badge: trashCount,
    },
    { key: 'integracoes', label: 'Integrações', icon: Plug, go: () => navigate('/integracoes') },
    { key: 'mcp', label: 'Autorizações', icon: KeyRound, go: () => navigate('/mcp') },
  ]

  const logout = () => {
    if (
      saveState === 'salvando' &&
      !window.confirm('Ainda estamos salvando suas últimas mudanças. Sair mesmo assim?')
    )
      return
    signOut()
  }

  return (
    <aside
      className={cx(
        'shrink-0 h-full flex flex-col bg-[#0D0D14] border-r border-white/[0.08] transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[296px]',
      )}
    >
      <div
        className={cx('flex items-center gap-2.5 pt-5 pb-4', collapsed ? 'flex-col px-3' : 'px-5')}
      >
        <button
          onClick={() => navigate('/')}
          title={APP_NAME}
          aria-label={APP_NAME}
          className={cx('flex items-center min-w-0', collapsed && 'justify-center')}
        >
          <BrandLogo markOnly={collapsed} variant="onDark" size="md" />
        </button>
        <button
          onClick={toggle}
          title={collapsed ? 'Abrir menu' : 'Fechar menu'}
          aria-label={collapsed ? 'Abrir menu' : 'Fechar menu'}
          className={cx(
            'size-7 grid place-items-center rounded-full text-white/60 hover:bg-white/[0.06] hover:text-white shrink-0',
            !collapsed && 'ml-auto',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.5} />
          ) : (
            <PanelLeftClose size={16} strokeWidth={1.5} />
          )}
        </button>
      </div>

      <nav
        className={cx(
          'flex-1 min-h-0 overflow-y-auto flex flex-col gap-1',
          collapsed ? 'px-3' : 'px-3',
        )}
      >
        {items.map((it) => {
          const active = route.name === it.key
          return (
            <button
              key={it.key}
              onClick={it.go}
              title={it.label}
              className={cx(
                'relative flex items-center gap-3 h-9 rounded-full text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-0' : 'px-3',
                active
                  ? 'bg-[#1F2121] text-white'
                  : 'text-[#C3C3C3] hover:bg-white/[0.06] hover:text-white',
              )}
            >
              <it.icon size={20} strokeWidth={1.5} />
              {!collapsed && <span className="flex-1 text-left">{it.label}</span>}
              {!!it.badge && !collapsed && (
                <span className="text-xs font-semibold text-[#A6A6B3] bg-white/[0.08] px-2 py-0.5 rounded-full">
                  {it.badge}
                </span>
              )}
              {!!it.badge && collapsed && (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#C3B0FF]" />
              )}
            </button>
          )
        })}
      </nav>

      <div
        className={cx(
          'border-t border-white/[0.08] p-3',
          collapsed && 'flex flex-col items-center gap-2',
        )}
      >
        <div
          className={cx('flex items-center gap-2.5 px-2 py-1', collapsed && 'px-0 py-0')}
          title={collapsed ? `${label} — ${user.email}` : undefined}
        >
          <span
            className="size-8 rounded-full grid place-items-center text-sm font-semibold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #A683FF, #6F1AE5)' }}
          >
            {(label[0] ?? '?').toUpperCase()}
          </span>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{label}</div>
              <div className="text-xs text-[#86868F] truncate">{user.email}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              title="Sair"
              className="size-8 grid place-items-center rounded-full text-white/60 hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={logout}
            title="Sair"
            className="size-8 grid place-items-center rounded-full text-white/60 hover:bg-white/[0.06] hover:text-white"
          >
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </aside>
  )
}
