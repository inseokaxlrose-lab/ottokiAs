'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? '로그인 실패')
      router.push('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-[60vh] flex items-center justify-center px-4'>
      <div className='w-full max-w-sm'>
        <div className='text-center mb-8'>
          <span className='text-4xl'>🔐</span>
          <h1 className='text-xl font-bold text-slate-900 mt-3'>관리자 로그인</h1>
          <p className='text-sm text-slate-500 mt-1'>OTTOKI 서비스 관리자 전용</p>
        </div>

        <form onSubmit={handleSubmit} className='bg-white rounded-2xl border border-slate-200 p-6 space-y-4'>
          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium text-slate-700'>비밀번호</span>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder='관리자 비밀번호 입력'
              className='border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent'
            />
          </label>

          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600'>
              {error}
            </div>
          )}

          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors text-sm'
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
