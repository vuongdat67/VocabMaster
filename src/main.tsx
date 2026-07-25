import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Initialize database and seed data
async function init() {
 try {
 const { db } = await import('./db')
 const { seedWordPacks } = await import('./data/seed')
 await seedWordPacks()

 createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <App />
 </StrictMode>
 )
 } catch (error) {
 console.error('Failed to initialize app:', error)
 // Still render even if DB init fails
 createRoot(document.getElementById('root')!).render(<App />)
 }
}

init()
