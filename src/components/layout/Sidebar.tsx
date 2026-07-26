import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, GraduationCap, Import, Settings,
  BarChart3, Repeat, ChevronLeft, Image, Link2, Wind, Camera, Music, VolumeX, Grid3x3, LayoutTemplate, Layers, Edit3, Search
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useSettingsStore } from '@/stores/settings-store'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'

const mainLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dictionary', icon: Search, label: 'Tra từ' },
  { to: '/learn', icon: GraduationCap, label: 'Học tập' },
  { to: '/review', icon: Repeat, label: 'Ôn tập' },
  { to: '/words', icon: BookOpen, label: 'Từ vựng' },
]

const gameLinks = [
  { to: '/games/matching', icon: Image, label: 'Nối từ-Ảnh' },
  { to: '/games/synonym', icon: Link2, label: 'Đồng nghĩa' },
  { to: '/games/crossword', icon: Grid3x3, label: 'Ô chữ' },
  { to: '/games/wordle', icon: LayoutTemplate, label: 'Đoán từ' },
  { to: '/games/swipe', icon: Layers, label: 'Quẹt thẻ' },
  { to: '/games/context', icon: Edit3, label: 'Điền từ' },
  { to: '/wind', icon: Wind, label: 'Vườn Từ' },
]

const bottomLinks = [
  { to: '/import', icon: Import, label: 'Import' },
  { to: '/images', icon: Camera, label: 'Hình ảnh' },
  { to: '/stats', icon: BarChart3, label: 'Thống kê' },
  { to: '/settings', icon: Settings, label: 'Cài đặt' },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const bgmEnabled = useSettingsStore(state => state.settings.bgmEnabled)
  const updateSettings = useSettingsStore(state => state.updateSettings)

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        initial={{ width: sidebarOpen ? 240 : 64 }}
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="h-screen bg-white border-r border-gray-200 flex flex-col overflow-hidden shrink-0 z-20"
      >
        {/* ── Logo ── */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-gray-100">
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight whitespace-nowrap"
              style={{ color: 'var(--accent-600)' }}
            >
              VocabMaster
            </motion.span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title={sidebarOpen ? 'Thu gọn' : 'Mở rộng'}
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-200 ${
                !sidebarOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* ── Nav links ── */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto scrollbar-thin">
          {sidebarOpen && (
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Học tập
            </p>
          )}
          {mainLinks.map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} icon={Icon} label={label} sidebarOpen={sidebarOpen} />
          ))}

          {sidebarOpen && (
            <p className="px-2 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Giải trí
            </p>
          )}
          {gameLinks.map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} icon={Icon} label={label} sidebarOpen={sidebarOpen} />
          ))}

          <div className="my-2 border-t border-gray-100" />

          {bottomLinks.map(({ to, icon: Icon, label }) => (
            <NavItem key={to} to={to} icon={Icon} label={label} sidebarOpen={sidebarOpen} />
          ))}
        </nav>

        {/* ── Footer ── */}
        <div className="px-2 py-3 border-t border-gray-100 flex flex-col gap-1 overflow-visible">
          <ThemeSwitcher sidebarOpen={sidebarOpen} />
          
          <button
            onClick={() => updateSettings({ bgmEnabled: !bgmEnabled })}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-gray-500 hover:text-gray-700 hover:bg-gray-50 w-full"
            title="Bật/tắt nhạc nền"
          >
            {bgmEnabled ? <Music className="w-[18px] h-[18px] shrink-0" /> : <VolumeX className="w-[18px] h-[18px] shrink-0" />}
            {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Nhạc nền</span>}
          </button>

          {sidebarOpen && (
            <div className="px-2 mt-2">
              <p className="text-[11px] text-gray-400">VocabMaster &middot; v0.1</p>
            </div>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}

function NavItem({
  to,
  icon: Icon,
  label,
  sidebarOpen,
}: {
  to: string
  icon: React.FC<{ className?: string }>
  label: string
  sidebarOpen: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
          isActive
            ? 'text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`
      }
      style={({ isActive }) =>
        isActive
          ? {
              backgroundColor: 'var(--accent-500)',
            }
          : undefined
      }
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      {sidebarOpen && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </NavLink>
  )
}
