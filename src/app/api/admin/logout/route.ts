import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })
  // 로그인 시 설정한 옵션과 동일하게 맞춰야 쿠키가 정상 삭제됨
  res.cookies.set('admin-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0, // 즉시 만료
    sameSite: 'lax',
  })
  return res
}
