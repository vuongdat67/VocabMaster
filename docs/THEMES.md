# Theme Presets

Hệ thống gồm 10 theme preset, mỗi preset định nghĩa bộ màu cho light mode và dark mode.

## Danh sách

| # | Preset | Icon | Light vibes | Dark vibes |
|---|--------|------|-------------|------------|
| 1 | **Zinc** | ⚪ | Xám trung tính (default) | Xám đen zinc premium |
| 2 | **Emerald** | 🌿 | Xanh lá cây tươi | Rừng tối |
| 3 | **Retro** | 📻 | Vàng kem, nâu đất | Nâu trầm vintage |
| 4 | **Cyberpunk** | ⚡ | Tím nhạt | Tím neon đậm |
| 5 | **Forest** | 🌲 | Xanh lá forest | Rừng sâu |
| 6 | **Luxury** | ✨ | Vàng gold | Đen + vàng |
| 7 | **Ocean** | 🌊 | Xanh dương biển | Xanh navy |
| 8 | **Dracula** | 🧛 | Hồng pastel | Dark mode purple |
| 9 | **Nord** | ❄️ | Xám xanh nordic | Xám xanh tối |
| 10 | **Sunset** | 🌅 | Cam hoàng hôn | Cam đỏ tối |

## Cấu trúc

```typescript
interface ThemePreset {
  id: string
  name: string
  icon: string
  swatchLight: string    // for picker preview
  swatchDark: string     // for picker preview
  light: Record<string, string>   // CSS variables (light)
  dark: Record<string, string>    // CSS variables (dark)
}
```

File: `src/data/themes.ts`

## CSS Variables

```
--surface
--surface-secondary
--surface-tertiary
--surface-card
--text-primary
--text-secondary
--text-tertiary
--border-default
--accent-500
```

## Cách dùng

```tsx
style={{ backgroundColor: 'var(--surface-card)' }}
style={{ color: 'var(--accent-500)' }}
style={{ border: '1px solid var(--border-default)' }}
```
