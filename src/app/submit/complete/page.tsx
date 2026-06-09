'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

// 접수번호를 URL 파라미터에서 읽는 컴포넌트
function CompleteContent() {
  const searchParams = useSearchParams()
  const receiptNumber = searchParams.get('receipt') ?? ''

  return (
    <div className='max-w-lg mx-auto px-4 sm:px-6 py-16 text-center'>
      {/* 성공 아이콘 */}
      <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
        <span className='text-4xl'>✅</span>
      </div>

      <h1 className='text-2xl font-bold text-slate-900 mb-2'>접수가 완료되었습니다!</h1>
      <p className='text-slate-500 text-sm mb-8'>
        담당자가 검토 후 입력하신 연락처로 안내드리겠습니다.<br />
        접수 확인 이메일도 발송되었습니다.
      </p>

      {/* 접수번호 표시 */}
      <div className='bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8'>
        <p className='text-sm text-slate-500 mb-2'>접수번호</p>
        <p className='text-2xl font-bold text-blue-600 tracking-wider'>{receiptNumber}</p>
        <p className='text-xs text-slate-400 mt-2'>이 번호로 접수 현황을 확인하실 수 있습니다.</p>
      </div>

      {/* 하단 버튼 */}
      <div className='flex flex-col sm:flex-row gap-3 justify-center'>
        <Link
          href='/check'
          className='px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors'
        >
          접수내역 확인하기
        </Link>
        <Link
          href='/'
          className='px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-medium transition-colors'
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

export default function SubmitCompletePage() {
  return (
    <Suspense>
      <CompleteContent />
    </Suspense>
  )
}
