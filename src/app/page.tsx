import Link from 'next/link'

// 메인 메뉴 카드 데이터
const menuCards = [
  {
    href: '/submit',
    icon: '🔧',
    title: 'AS 접수하기',
    description: '제품 고장, 파손, 오작동 등 AS가 필요하신 경우 접수해 주세요.',
    buttonText: '접수하러 가기',
    color: 'blue',
  },
  {
    href: '/check',
    icon: '🔍',
    title: '접수내역 확인',
    description: '접수번호 또는 이름+연락처로 AS 진행 현황을 확인하세요.',
    buttonText: '조회하러 가기',
    color: 'green',
  },
  {
    href: '/purchase',
    icon: '🛒',
    title: '신규구매',
    description: '신규 구매를 원하시면 요청서를 작성해 주세요.',
    buttonText: '구매 문의하기',
    color: 'purple',
  },
]

// 색상별 클래스 매핑
const colorMap = {
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    border: 'hover:border-blue-300',
  },
  green: {
    icon: 'bg-green-100 text-green-600',
    button: 'bg-green-600 hover:bg-green-700 text-white',
    border: 'hover:border-green-300',
  },
  purple: {
    icon: 'bg-purple-100 text-purple-600',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    border: 'hover:border-purple-300',
  },
}

export default function HomePage() {
  return (
    <div className='max-w-5xl mx-auto px-4 sm:px-6 py-12'>
      {/* 히어로 섹션 */}
      <div className='text-center mb-12'>
        <h1 className='text-3xl sm:text-4xl font-bold text-slate-900 mb-4'>
          OTTOKI 서비스 센터
        </h1>
        <p className='text-lg text-slate-500 max-w-xl mx-auto'>
          AS 접수부터 신규구매 문의까지, 빠르고 편리하게 이용하세요.
        </p>
      </div>

      {/* 메뉴 카드 그리드 */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
        {menuCards.map((card) => {
          const colors = colorMap[card.color as keyof typeof colorMap]
          return (
            <div
              key={card.href}
              className={`bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg ${colors.border}`}
            >
              {/* 아이콘 */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${colors.icon}`}>
                {card.icon}
              </div>

              {/* 제목과 설명 */}
              <div className='flex-1'>
                <h2 className='text-lg font-semibold text-slate-900 mb-2'>
                  {card.title}
                </h2>
                <p className='text-sm text-slate-500 leading-relaxed'>
                  {card.description}
                </p>
              </div>

              {/* 버튼 */}
              <Link
                href={card.href}
                className={`w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${colors.button}`}
              >
                {card.buttonText}
              </Link>
            </div>
          )
        })}
      </div>

      {/* 안내 배너 */}
      <div className='mt-10 bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3'>
        <span className='text-2xl'>💬</span>
        <div>
          <p className='text-sm font-semibold text-blue-800'>
            접수 후 진행 상황을 이메일로 안내해 드립니다.
          </p>
          <p className='text-xs text-blue-600 mt-0.5'>
            접수 완료 시 입력하신 이메일 주소로 접수번호와 안내 메일이 발송됩니다.
          </p>
        </div>
      </div>

      {/* 관리자 링크 */}
      <div className='mt-8 text-center'>
        <Link
          href='/admin'
          className='inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors'
        >
          <span>🔐</span>
          관리자 페이지
        </Link>
      </div>
    </div>
  )
}
