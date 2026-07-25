import { Menu } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

export function Header() {
  const { toggleSidebar, isMobile } = useUIStore()

  return (
    <header
      className="flex items-center justify-between px-4 lg:px-6"
      style={{
        height: 48,
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'color-mix(in srgb, var(--surface) 80%, transparent)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  )
}
