// 카카오 refresh token 재발급 스크립트 (약 2개월마다 만료 시 실행)
//
// 사용법:
//   1) 터미널에서 실행:  node scripts/get-kakao-token.mjs
//   2) 출력된 주소를 브라우저에 열어 카카오 로그인 + 메시지 전송 동의
//   3) 출력되는 KAKAO_REFRESH_TOKEN 값을 .env.local(및 배포 환경변수)에 갱신
//
// REST API 키 / 클라이언트 시크릿은 .env.local에서 읽어옵니다.

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

// .env.local 읽어서 환경변수로 로드
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2]
  }
}

const REST_API_KEY = process.env.KAKAO_REST_API_KEY
const CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET
// 카카오 콘솔에 등록한 Redirect URI와 100% 똑같아야 함
const REDIRECT_URI = 'http://localhost:3000/oauth'

if (!REST_API_KEY) {
  console.error('.env.local에 KAKAO_REST_API_KEY가 없습니다.')
  process.exit(1)
}

// 1) 카카오 로그인(인가) 주소 — 메시지 전송 권한(talk_message) 요청
const authUrl =
  'https://kauth.kakao.com/oauth/authorize' +
  `?client_id=${REST_API_KEY}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  '&response_type=code' +
  '&scope=talk_message'

console.log('\n아래 주소를 브라우저에 열어 카카오 로그인 + 동의하세요:\n')
console.log(authUrl + '\n')

// 2) localhost:3000 에 잠깐 서버를 띄워 카카오가 보내는 인가코드를 받음
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000')
  if (url.pathname !== '/oauth') {
    res.writeHead(404)
    res.end()
    return
  }

  const code = url.searchParams.get('code')
  if (!code) {
    res.writeHead(400)
    res.end('인가코드(code)가 없습니다.')
    return
  }

  try {
    // 3) 인가코드를 토큰으로 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: REST_API_KEY,
        ...(CLIENT_SECRET ? { client_secret: CLIENT_SECRET } : {}),
        redirect_uri: REDIRECT_URI,
        code,
      }),
    })
    const data = await tokenRes.json()

    if (data.refresh_token) {
      console.log('\n✅ 성공! .env.local의 KAKAO_REFRESH_TOKEN을 아래 값으로 교체하세요:\n')
      console.log('KAKAO_REFRESH_TOKEN=' + data.refresh_token + '\n')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h2>완료! 터미널로 돌아가세요.</h2>')
    } else {
      console.log('\n❌ 토큰 교환 실패:', data)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h2>실패. 터미널을 확인하세요.</h2>')
    }
  } catch (err) {
    console.error('에러:', err)
    res.writeHead(500)
    res.end('에러 발생')
  } finally {
    setTimeout(() => server.close(() => process.exit(0)), 500)
  }
})

server.listen(3000, () => console.log('대기 중... (localhost:3000)\n'))
