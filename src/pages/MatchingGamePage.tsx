import { motion } from 'framer-motion'
import { MatchingGame } from '@/features/matching/MatchingGame'

export function MatchingGamePage() {
 return (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
 <MatchingGame />
 </motion.div>
 )
}
