import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { db } from '@/db'
import { checkStreak } from '@/algorithms/review-scheduler'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BookOpen, TrendingUp, Clock, Target, Brain, Zap } from 'lucide-react'

export function StatsPage() {
	const [stats, setStats] = useState({
		totalStudied: 0,
		totalCorrect: 0,
		totalWrong: 0,
		accuracy: 0,
		streak: 0,
		sessionsCompleted: 0,
		totalTime: 0,
	})
	const [modeData, setModeData] = useState<{ name: string; value: number }[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function load() {
			try {
				const srsAll = await db.srsData.toArray()
				const totalCorrect = srsAll.reduce((s, d) => s + d.timesCorrect, 0)
				const totalWrong = srsAll.reduce((s, d) => s + d.timesWrong, 0)
				const sessions = await db.sessions.toArray()
				const totalTime = sessions.reduce((s, sess) => s + (sess.totalTime || 0), 0)
				const streakData = await checkStreak()

				// Count accuracy by mode
				const modeResults: Record<string, { correct: number; wrong: number }> = {}
				sessions.forEach((sess) => {
					sess.results.forEach((r) => {
						if (!modeResults[r.mode]) modeResults[r.mode] = { correct: 0, wrong: 0 }
						if (r.isCorrect) modeResults[r.mode]!.correct++
						else modeResults[r.mode]!.wrong++
					})
				})

				setStats({
					totalStudied: srsAll.length,
					totalCorrect,
					totalWrong,
					accuracy: totalCorrect + totalWrong > 0 ? (totalCorrect / (totalCorrect + totalWrong)) * 100 : 0,
					streak: streakData.current,
					sessionsCompleted: sessions.length,
					totalTime,
				})

				setModeData(
					Object.entries(modeResults).map(([name, data]) => ({
						name: name.replace('_', ' '),
						value: data.correct + data.wrong,
					}))
				)
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin w-8 h-8 border-4 rounded-full" style={{ borderColor: 'var(--accent-500)', borderTopColor: 'transparent' }} />
			</div>
		)
	}

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
			<h2 className="text-2xl font-bold text-gray-900 tracking-tight">Thống kê chi tiết</h2>

			{/* Summary cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card className="p-4">
					<div className="flex items-center gap-2 mb-1" style={{ color: 'var(--accent-600)' }}>
						<BookOpen className="w-4 h-4" />
						<span className="text-xs font-medium">Đã học</span>
					</div>
					<p className="text-2xl font-bold text-gray-900">{stats.totalStudied}</p>
				</Card>
				<Card className="p-4">
					<div className="flex items-center gap-2 mb-1" style={{ color: 'var(--accent-500)' }}>
						<TrendingUp className="w-4 h-4" />
						<span className="text-xs font-medium">Độ chính xác</span>
					</div>
					<p className="text-2xl font-bold text-gray-900">{stats.accuracy.toFixed(1)}%</p>
				</Card>
				<Card className="p-4">
					<div className="flex items-center gap-2 mb-1" style={{ color: 'var(--accent-500)' }}>
						<Target className="w-4 h-4" />
						<span className="text-xs font-medium">Streak</span>
					</div>
					<p className="text-2xl font-bold text-gray-900">{stats.streak} ngày</p>
				</Card>
				<Card className="p-4">
					<div className="flex items-center gap-2 mb-1" style={{ color: 'var(--accent-600)' }}>
						<Zap className="w-4 h-4" />
						<span className="text-xs font-medium">Buổi học</span>
					</div>
					<p className="text-2xl font-bold text-gray-900">{stats.sessionsCompleted}</p>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Accuracy by mode chart */}
				<Card className="p-6">
					<h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
						<Brain className="w-4 h-4" />
						Phân bố chế độ học
					</h3>
					{modeData.length > 0 ? (
						<div className="w-full h-64">
							<ResponsiveContainer>
								<BarChart data={modeData}>
									<XAxis dataKey="name" tick={{ fontSize: 11 }} />
									<YAxis />
									<Tooltip />
									<Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--accent-500)" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					) : (
						<p className="text-gray-400 text-center py-8">Chưa có dữ liệu</p>
					)}
				</Card>

				{/* Correct/Wrong pie */}
				<Card className="p-6">
					<h3 className="font-semibold text-gray-900 mb-4">Tỉ lệ đúng/sai</h3>
					{(stats.totalCorrect + stats.totalWrong) > 0 ? (
						<div className="w-full h-64">
							<ResponsiveContainer>
								<PieChart>
									<Pie
										data={[
											{ name: 'Đúng', value: stats.totalCorrect },
											{ name: 'Sai', value: stats.totalWrong },
										]}
										dataKey="value"
										nameKey="name"
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={100}
										label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
									>
										<Cell fill="var(--accent-500)" />
										<Cell fill="#ef4444" />
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>
					) : (
						<p className="text-gray-400 text-center py-8">Chưa có dữ liệu</p>
					)}
				</Card>
			</div>

			{/* Detail stats */}
			<Card className="p-6">
				<h3 className="font-semibold text-gray-900 mb-4">Chi tiết</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div>
						<span className="text-gray-400">Tổng đúng</span>
						<p className="font-semibold text-green-600">{stats.totalCorrect}</p>
					</div>
					<div>
						<span className="text-gray-400">Tổng sai</span>
						<p className="font-semibold text-red-600">{stats.totalWrong}</p>
					</div>
					<div>
						<span className="text-gray-400">Thời gian học</span>
						<p className="font-semibold text-gray-900">
							{Math.floor(stats.totalTime / 60000)} phút
						</p>
					</div>
					<div>
						<span className="text-gray-400">Trung bình/buổi</span>
						<p className="font-semibold text-gray-900">
							{stats.sessionsCompleted > 0
								? Math.round((stats.totalCorrect + stats.totalWrong) / stats.sessionsCompleted)
								: 0} từ
						</p>
					</div>
				</div>
			</Card>
		</motion.div>
	)
}
