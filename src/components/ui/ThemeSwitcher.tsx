import { Palette, Check, Sun, Moon } from 'lucide-react'
import { THEME_PRESETS } from '@/data/themes'
import { useSettingsStore } from '@/stores/settings-store'
import type { ThemeMode } from '@/types/settings'

export function ThemeSwitcher({ sidebarOpen }: { sidebarOpen: boolean }) {
  const { settings, updateSettings } = useSettingsStore()

  return (
    <div className="dropdown dropdown-top w-full group">
      <div 
        tabIndex={0} 
        role="button" 
        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-gray-500 hover:text-gray-700 hover:bg-gray-50 w-full"
      >
        <Palette className="w-[18px] h-[18px] shrink-0" />
        {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Giao diện</span>}
      </div>
      <div 
        tabIndex={0} 
        className="dropdown-content z-50 py-3 shadow-xl bg-white rounded-box w-full mb-2 border border-gray-200 cursor-default overflow-hidden"
      >
        <div className="flex gap-2 mb-2 pb-3 px-3 border-b border-gray-100 shrink-0">
          <button
            onClick={() => updateSettings({ theme: 'light' as ThemeMode })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all ${
              settings.theme === 'light' 
                ? 'border-accent-500 bg-accent-50 text-accent-600' 
                : 'border-transparent text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="text-sm font-medium">Sáng</span>
          </button>
          <button
            onClick={() => updateSettings({ theme: 'dark' as ThemeMode })}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 transition-all ${
              settings.theme === 'dark' 
                ? 'border-accent-500 bg-accent-50 text-accent-600' 
                : 'border-transparent text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="text-sm font-medium">Tối</span>
          </button>
        </div>
        <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto scrollbar-thin">
          {THEME_PRESETS.map((theme) => {
            const isActive = settings.themePreset === theme.id
            return (
              <li key={theme.id} className="px-2">
                <button
                  onClick={() => updateSettings({ themePreset: theme.id })}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg ${isActive ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{theme.icon}</span>
                    <span className="text-base">{theme.name}</span>
                  </div>
                  {isActive && <Check className="w-5 h-5 text-accent-500" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
