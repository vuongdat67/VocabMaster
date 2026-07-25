import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

export default function App() {
 return (
 <ThemeProvider>
 <RouterProvider router={router} />
 </ThemeProvider>
 )
}
