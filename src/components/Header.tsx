'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/submit', label: 'AS 접수하기' },
  { href: '/check', label: '접수내역 확인' },
  { href: '/purchase', label: '신규구매' },
]

export default function Header() {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <header className='bg-white border-b border-slate-200 sticky top-0 z-50'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6'>
        <div className='flex items-center justify-between h-16'>
          {/* 로고 */}
          <Link href='/' className='flex items-center gap-2'>
            <span className='text-2xl font-bold text-blue-600 tracking-tight'>OTTOKI</span>
            <span className='hidden sm:block text-xs text-slate-400 font-medium mt-1'>SERVICE CENTER</span>
          </Link>

          <div className='flex items-center gap-2'>
            {/* 데스크탑 네비게이션 */}
            <nav className='hidden sm:flex items-center gap-1'>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* 모바일 네비게이션 */}
            <nav className='flex sm:hidden items-center gap-1'>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label.replace('AS ', '')}
                </Link>
              ))}
            </nav>

            {/* 관리자 버튼 */}
            <Link
              href={isAdmin ? '/admin/dashboard' : '/admin'}
              className={`ml-1 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isAdmin
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <svg xmlns='http://www.w3.org/2000/svg' className='w-3.5 h-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
              </svg>
              <span className='hidden sm:inline'>관리자</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
