import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  const adminPassword = process.env.ADMIN_PASSWORD
  const sessionSecret = process.env.ADMIN_SESSION_SECRET

  if (!adminPassword || !sessionSecret) {
    return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 })
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  // 로그인 성공 시 세션 쿠키 설정 (httpOnly로 JS에서 읽기 불가)
  const res = NextResponse.json({ success: true })
  res.cookies.set('admin-session', sessionSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS 환경(Vercel)에서는 secure 필수
    path: '/',
    maxAge: 60 * 60 * 8, // 8시간
    sameSite: 'lax',
  })

  return res
}
