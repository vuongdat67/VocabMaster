import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth-store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            // Uncomment if you have email verification disabled in Supabase, or want auto-login
            // emailRedirectTo: window.location.origin
          }
        })
        if (error) throw error
        setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực (nếu có yêu cầu).')
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-base-content/60 hover:text-base-content mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              {isLogin ? <LogIn className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
            </div>
            <h1 className="text-3xl font-extrabold text-base-content mb-2">
              {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
            </h1>
            <p className="text-base-content/60">
              Đồng bộ dữ liệu của bạn trên mọi thiết bị
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-error/10 text-error rounded-xl flex items-start gap-3 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-success/10 text-success rounded-xl flex items-start gap-3 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{message}</p>
            </motion.div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-base-content/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-base-200 border-2 border-base-300 focus:border-primary text-base-content rounded-xl py-3 pl-12 pr-4 transition-colors outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-base-content/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-base-200 border-2 border-base-300 focus:border-primary text-base-content rounded-xl py-3 pl-12 pr-4 transition-colors outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full h-12 text-lg font-bold mt-2"
              disabled={loading}
              isLoading={loading}
              type="submit"
            >
              {isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-base-content/60">
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-primary hover:underline"
              type="button"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
