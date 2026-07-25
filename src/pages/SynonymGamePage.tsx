import { motion } from 'framer-motion'
import { SynonymMatchGame } from '@/features/synonym-match/SynonymMatchGame'

export function SynonymGamePage() {
 return (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
 <SynonymMatchGame />
 </motion.div>
 )
}
