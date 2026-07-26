import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { db } from '@/db'
import { format, subDays, startOfWeek, addDays } from 'date-fns'

interface HeatmapDay {
  date: Date
  count: number
}

const WEEKS = 52
const DAYS_IN_WEEK = 7

export function StreakHeatmap() {
  const [activity, setActivity] = useState<Record<string, number>>({})
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; count: number } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const records = await db.weeklyActivity.toArray()
      const dataMap: Record<string, number> = {}
      records.forEach(r => {
        dataMap[r.date] = r.wordsStudied
      })
      setActivity(dataMap)
    }
    loadData()
  }, [])

  const { grid, flatDays } = useMemo(() => {
    const today = new Date()
    const startDate = startOfWeek(subDays(today, (WEEKS - 1) * DAYS_IN_WEEK))
    
    const dayArray: HeatmapDay[][] = Array.from({ length: WEEKS }, () => [])
    const flat: HeatmapDay[] = []
    
    let currentDate = startDate
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < DAYS_IN_WEEK; d++) {
        const dateStr = format(currentDate, 'yyyy-MM-dd')
        const day = {
          date: currentDate,
          count: activity[dateStr] || 0
        }
        dayArray[w]!.push(day)
        flat.push(day)
        currentDate = addDays(currentDate, 1)
      }
    }
    return { grid: dayArray, flatDays: flat }
  }, [activity])

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (count < 10) return 'bg-green-200 dark:bg-green-900/40'
    if (count < 30) return 'bg-green-400 dark:bg-green-700/60'
    if (count < 60) return 'bg-green-500 dark:bg-green-500'
    return 'bg-green-600 dark:bg-green-400'
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Learning Streak</h3>
          <p className="text-sm text-gray-500">Hoạt động học tập trong năm qua</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-green-500">
            {Object.keys(activity).length} <span className="text-sm font-medium text-gray-500">ngày</span>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="min-w-[800px] flex gap-1 relative">
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={dayIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (weekIndex * 0.01) + (dayIndex * 0.02) }}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3.5 h-3.5 rounded-[3px] transition-colors duration-200 cursor-pointer ${getColor(day.count)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend & Tooltip info */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>Ít</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-[2px] bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-[2px] bg-green-200 dark:bg-green-900/40" />
            <div className="w-3 h-3 rounded-[2px] bg-green-400 dark:bg-green-700/60" />
            <div className="w-3 h-3 rounded-[2px] bg-green-500 dark:bg-green-500" />
            <div className="w-3 h-3 rounded-[2px] bg-green-600 dark:bg-green-400" />
          </div>
          <span>Nhiều</span>
        </div>
        
        <div className="h-4 font-medium text-gray-700 dark:text-gray-300">
          {hoveredDay ? (
            `${hoveredDay.count} từ vựng vào ${format(hoveredDay.date, 'dd/MM/yyyy')}`
          ) : (
            'Di chuột qua các ô để xem chi tiết'
          )}
        </div>
      </div>
    </div>
  )
}
