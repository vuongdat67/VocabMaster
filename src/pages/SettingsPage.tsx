import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSettingsStore } from '@/stores/settings-store'
import { Volume2, Eye, Brain, Palette, Upload, Sun, Moon, Monitor, Layout } from 'lucide-react'
import { useRef } from 'react'
import type { ThemeColor, ThemeMode } from '@/types/settings'
import { THEME_PRESETS } from '@/data/themes'

const THEMES: { key: ThemeColor; label: string; color: string }[] = [
  { key: 'indigo', label: 'Tím', color: '#6366f1' },
  { key: 'blue', label: 'Xanh dương', color: '#3b82f6' },
  { key: 'green', label: 'Xanh lá', color: '#10b981' },
  { key: 'rose', label: 'Hồng', color: '#f43f5e' },
  { key: 'amber', label: 'Cam', color: '#f59e0b' },
]

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()
  const mascotInputRef = useRef<HTMLInputElement>(null)

  const handleMascotImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      updateSettings({ mascotImageUrl: url, mascotType: 'custom' })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Cài đặt</h2>

      {/* Display */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Palette className="w-4 h-4" style={{ color: 'var(--accent-500)' }} /> Giao diện
        </h3>

        {/* Theme mode */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">Chế độ màu</label>
          <div className="flex gap-2">
            {([['light', 'Sáng', Sun], ['dark', 'Tối', Moon], ['system', 'Hệ thống', Monitor]] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => updateSettings({ theme: key as ThemeMode })}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all"
                style={{
                  borderColor: settings.theme === key ? 'var(--accent-500)' : 'var(--border-default)',
                  backgroundColor: settings.theme === key ? 'color-mix(in srgb, var(--accent-500) 10%, var(--surface-card))' : 'transparent',
                  color: settings.theme === key ? 'var(--accent-600)' : 'var(--text-tertiary)',
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme color */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">Màu chủ đạo</label>
          <div className="flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => updateSettings({ themeColor: t.key })}
                className="w-10 h-10 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: t.color,
                  borderColor: settings.themeColor === t.key ? 'var(--text-primary)' : 'transparent',
                  transform: settings.themeColor === t.key ? 'scale(1.15)' : 'scale(1)',
                }}
                title={t.label}
              />
            ))}
          </div>
        </div>

        {/* Theme preset */}
        <div>
          <label className="block text-sm text-gray-600 mb-3 flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5" /> Chủ đề
          </label>
          <div className="flex flex-col gap-2">
            <select
              value={settings.themePreset}
              onChange={(e) => updateSettings({ themePreset: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-gray-900"
              style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
            >
              {THEME_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cỡ chữ</label>
            <select
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: e.target.value as 'small' | 'medium' | 'large' })}
              className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-gray-900"
              style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
            >
              <option value="small">Nhỏ</option>
              <option value="medium">Vừa</option>
              <option value="large">Lớn</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audio */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Volume2 className="w-4 h-4" style={{ color: 'var(--accent-500)' }} /> Âm thanh
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Âm thanh</span>
          <ToggleSwitch
            checked={settings.soundEnabled}
            onChange={(c) => updateSettings({ soundEnabled: c })}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Âm lượng: {Math.round(settings.soundVolume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.soundVolume * 100}
            onChange={(e) => updateSettings({ soundVolume: parseInt(e.target.value) / 100 })}
            className="w-full"
            style={{ accentColor: 'var(--accent-500)' }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Tự động phát âm</span>
          <ToggleSwitch
            checked={settings.autoPlayAudio}
            onChange={(c) => updateSettings({ autoPlayAudio: c })}
          />
        </div>
      </Card>

      {/* Learning */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Brain className="w-4 h-4" style={{ color: 'var(--accent-500)' }} /> Học tập
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Thứ tự học</label>
            <select
              value={settings.learningOrder}
              onChange={(e) => updateSettings({ learningOrder: e.target.value as 'sequential' | 'random' })}
              className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-gray-900"
              style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
            >
              <option value="random">Ngẫu nhiên</option>
              <option value="sequential">Theo thứ tự</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Từ mới mỗi buổi</label>
            <input
              type="number"
              min={1}
              max={50}
              value={settings.newWordsPerSession}
              onChange={(e) => updateSettings({ newWordsPerSession: Math.max(1, parseInt(e.target.value) || 10) })}
              className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-gray-900"
              style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Xen kẽ từ mới & cũ</span>
          <ToggleSwitch
            checked={settings.enableInterleaving}
            onChange={(c) => updateSettings({ enableInterleaving: c })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Hiển thị IPA</span>
          <ToggleSwitch
            checked={settings.showIpa}
            onChange={(c) => updateSettings({ showIpa: c })}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Nhắc ôn tập sau (giờ)
          </label>
          <input
            type="number"
            min={1}
            max={72}
            value={settings.reviewReminderHours}
            onChange={(e) => updateSettings({ reviewReminderHours: Math.max(1, parseInt(e.target.value) || 6) })}
            className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-gray-900"
            style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
          />
        </div>
      </Card>

      {/* Mascot */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Eye className="w-4 h-4" style={{ color: 'var(--accent-500)' }} /> Mascot
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Loại</label>
            <select
              value={settings.mascotType}
              onChange={(e) => updateSettings({ mascotType: e.target.value as 'custom' | 'animal' })}
              className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-gray-900"
              style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
            >
              <option value="animal">Con vật hoạt hình</option>
              <option value="custom">Ảnh tự chọn</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vị trí</label>
            <select
              value={settings.mascotPosition}
              onChange={(e) => updateSettings({ mascotPosition: e.target.value as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' })}
              className="w-full p-2.5 rounded-lg border border-gray-200 bg-white text-gray-900"
              style={{ '--tw-ring-color': 'var(--accent-400)' } as React.CSSProperties}
            >
              <option value="bottom-right">Góc dưới phải</option>
              <option value="bottom-left">Góc dưới trái</option>
              <option value="top-right">Góc trên phải</option>
              <option value="top-left">Góc trên trái</option>
            </select>
          </div>
        </div>
        {settings.mascotType === 'custom' && (
          <div>
            <input
              ref={mascotInputRef}
              type="file"
              accept="image/*"
              onChange={handleMascotImage}
              className="hidden"
            />
            <Button
              variant="secondary"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => mascotInputRef.current?.click()}
            >
              {settings.mascotImageUrl ? 'Đổi ảnh mascot' : 'Tải ảnh mascot'}
            </Button>
            {settings.mascotImageUrl && (
              <div className="mt-2">
                <img src={settings.mascotImageUrl} alt="Mascot preview" className="w-16 h-16 rounded-full object-cover" />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Reset */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={resetSettings}>
          Khôi phục mặc định
        </Button>
      </div>
    </motion.div>
  )
}

/* ─── ToggleSwitch (shared local component) ──────────── */
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div
        className="w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--accent-400)] transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
        style={{
          backgroundColor: checked ? 'var(--accent-500)' : '#d4d4d8',
        }}
      />
    </label>
  )
}
