import { useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'

interface Particle {
 id: number
 x: number
 y: number
 size: number
 duration: number
 delay: number
}

export function FloatingParticles() {
 const particles = useRef<Particle[]>(
 Array.from({ length: 15 }, (_, i) => ({
 id: i,
 x: Math.random() * 100,
 y: Math.random() * 100,
 size: Math.random() * 4 + 2,
 duration: Math.random() * 10 + 15,
 delay: Math.random() * 10,
 }))
 )

 return (
 <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
 {particles.current.map((p) => (
 <motion.div
 key={p.id}
 className="absolute rounded-full bg-indigo-300/20"
 style={{
 left: `${p.x}%`,
 top: `${p.y}%`,
 width: p.size,
 height: p.size,
 }}
 animate={{
 y: [0, -30, 0, -20, 0],
 x: [0, 15, -10, 10, 0],
 opacity: [0.3, 0.6, 0.2, 0.5, 0.3],
 }}
 transition={{
 duration: p.duration,
 repeat: Infinity,
 delay: p.delay,
 ease: 'easeInOut',
 }}
 />
 ))}
 </div>
 )
}
