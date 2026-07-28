import { cookies } from 'next/headers'

// 관리자 세션 쿠키가 유효한지 확인하는 함수
//
// 로그인 시 심어둔 'admin-session' 쿠키 값이
// 환경변수 ADMIN_SESSION_SECRET과 일치하면 관리자로 인정합니다.
// (proxy.ts가 /admin 페이지를 지키는 것과 같은 방식입니다)
export async function isAdmin(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) return false
  const session = (await cookies()).get('admin-session')?.value
  return session === secret
}
