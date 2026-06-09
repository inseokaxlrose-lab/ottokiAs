import { NextRequest, NextResponse } from 'next/server'

// /admin 경로는 세션 쿠키가 없으면 로그인 페이지로 이동
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /admin/login은 보호 제외
  if (pathname === '/admin') return NextResponse.next()

  // /admin/** 하위 경로 보호
  if (pathname.startsWith('/admin/')) {
    const session = req.cookies.get('admin-session')?.value
    const secret = process.env.ADMIN_SESSION_SECRET

    if (!session || session !== secret) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
