import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const animalSvgs = [
 // Owl
 `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
 <circle cx="50" cy="50" r="35" fill="#6366f1" opacity="0.15"/>
 <circle cx="50" cy="45" r="25" fill="#6366f1" opacity="0.2"/>
 <circle cx="38" cy="40" r="8" fill="white" opacity="0.9"/>
 <circle cx="62" cy="40" r="8" fill="white" opacity="0.9"/>
 <circle cx="38" cy="40" r="4" fill="#1e1b4b"/>
 <circle cx="62" cy="40" r="4" fill="#1e1b4b"/>
 <polygon points="50,48 44,58 56,58" fill="#f59e0b"/>
 <path d="M35 55 Q50 65 65 55" stroke="#6366f1" stroke-width="2" fill="none"/>
 </svg>`,
 // Fox
 `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
 <polygon points="50,65 25,45 40,45" fill="#f97316" opacity="0.3"/>
 <polygon points="50,65 75,45 60,45" fill="#f97316" opacity="0.3"/>
 <ellipse cx="50" cy="55" rx="22" ry="20" fill="#f97316" opacity="0.2"/>
 <circle cx="40" cy="50" r="5" fill="white" opacity="0.9"/>
 <circle cx="60" cy="50" r="5" fill="white" opacity="0.9"/>
 <circle cx="40" cy="50" r="2.5" fill="#1e1b4b"/>
 <circle cx="60" cy="50" r="2.5" fill="#1e1b4b"/>
 <ellipse cx="50" cy="58" rx="3" ry="2" fill="#1e1b4b"/>
 </svg>`,
 // Cat
 `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
 <polygon points="35,25 30,45 40,40" fill="#8b5cf6" opacity="0.2"/>
 <polygon points="65,25 70,45 60,40" fill="#8b5cf6" opacity="0.2"/>
 <circle cx="50" cy="55" r="22" fill="#8b5cf6" opacity="0.15"/>
 <circle cx="40" cy="52" r="6" fill="#a78bfa" opacity="0.4"/>
 <circle cx="60" cy="52" r="6" fill="#a78bfa" opacity="0.4"/>
 <circle cx="40" cy="52" r="3" fill="#1e1b4b"/>
 <circle cx="60" cy="52" r="3" fill="#1e1b4b"/>
 <ellipse cx="42" cy="58" rx="2" ry="1" fill="#1e1b4b"/>
 <ellipse cx="58" cy="58" rx="2" ry="1" fill="#1e1b4b"/>
 <path d="M45 65 Q50 70 55 65" stroke="#8b5cf6" stroke-width="2" fill="none"/>
 </svg>`,
]

export function AnimalAnimation() {
 const [currentAnimal, setCurrentAnimal] = useState(0)
 const [isHappy, setIsHappy] = useState(false)

 useEffect(() => {
 // Change animal every 10 seconds
 const interval = setInterval(() => {
 setCurrentAnimal((prev) => (prev + 1) % animalSvgs.length)
 }, 10000)
 return () => clearInterval(interval)
 }, [])

 // Listen for correct answers to trigger happy animation
 useEffect(() => {
 const handler = () => {
 setIsHappy(true)
 setTimeout(() => setIsHappy(false), 2000)
 }
 window.addEventListener('vocab:correct', handler)
 return () => window.removeEventListener('vocab:correct', handler)
 }, [])

 return (
 <motion.div
 className="w-16 h-16 cursor-pointer select-none"
 animate={{
 y: isHappy ? [0, -10, 0, -5, 0] : [0, -3, 0, -2, 0],
 rotate: isHappy ? [0, -10, 10, -5, 0] : 0,
 }}
 transition={{
 duration: isHappy ? 0.5 : 3,
 repeat: isHappy ? 0 : Infinity,
 ease: 'easeInOut',
 }}
 whileHover={{ scale: 1.1 }}
 dangerouslySetInnerHTML={{ __html: animalSvgs[currentAnimal] ?? animalSvgs[0] ?? '' }}
 onClick={() => {
 window.dispatchEvent(new CustomEvent('vocab:mascot-click'))
 }}
 title="Động vật đồng hành!"
 />
 )
}
