'use client'

import { useRef, useState } from 'react'
import Script from 'next/script'

// Kakao 우편번호 API 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string
          address: string
          roadAddress: string
          jibunAddress: string
        }) => void
        onclose?: () => void
        width?: string | number
        height?: string | number
      }) => { embed: (el: HTMLElement) => void }
    }
  }
}

export interface AddressValue {
  zipcode: string
  address: string
  addressDetail: string
}

interface AddressInputProps {
  value: AddressValue
  onChange: (value: AddressValue) => void
  accentColor?: 'blue' | 'purple'
}

export default function AddressInput({ value, onChange, accentColor = 'blue' }: AddressInputProps) {
  const [open, setOpen] = useState(false)
  const embedRef = useRef<HTMLDivElement>(null)

  const ring = accentColor === 'blue' ? 'focus:ring-blue-400' : 'focus:ring-purple-400'
  const btnColor = accentColor === 'blue'
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-purple-600 hover:bg-purple-700'

  function openSearch() {
    setOpen(true)
    // div가 렌더된 뒤 embed 실행
    setTimeout(() => {
      if (!window.daum?.Postcode || !embedRef.current) return
      new window.daum.Postcode({
        width: '100%',
        height: '100%',
        oncomplete(data) {
          const addr = data.roadAddress || data.jibunAddress
          onChange({ ...value, zipcode: data.zonecode, address: addr })
          setOpen(false)
        },
        onclose() { setOpen(false) },
      }).embed(embedRef.current)
    }, 80)
  }

  return (
    <>
      <Script
        src='//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
        strategy='lazyOnload'
      />

      <div className='space-y-2'>
        {/* 우편번호 + 검색 버튼 */}
        <div className='flex gap-2'>
          <input
            type='text'
            value={value.zipcode}
            readOnly
            placeholder='우편번호'
            className={`h-10 w-28 border border-slate-300 rounded-lg px-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 ${ring}`}
          />
          <button
            type='button'
            onClick={openSearch}
            className={`h-10 px-4 rounded-lg text-sm font-medium text-white transition-colors ${btnColor}`}
          >
            주소 검색
          </button>
        </div>

        {/* 기본 주소 (자동 입력) */}
        <input
          type='text'
          value={value.address}
          readOnly
          placeholder='기본 주소 (위 버튼으로 검색)'
          className={`h-10 w-full border border-slate-300 rounded-lg px-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 ${ring}`}
        />

        {/* 상세 주소 */}
        <input
          type='text'
          value={value.addressDetail}
          onChange={(e) => onChange({ ...value, addressDetail: e.target.value })}
          placeholder='상세 주소 (동, 호수 등)'
          className={`h-10 w-full border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 ${ring} focus:border-transparent`}
        />
      </div>

      {/* 주소 검색 모달 */}
      {open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'>
          <div className='bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-md'>
            <div className='flex items-center justify-between px-4 py-3 border-b border-slate-200'>
              <span className='text-sm font-semibold text-slate-800'>주소 검색</span>
              <button
                type='button'
                onClick={() => setOpen(false)}
                className='w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors text-lg'
              >
                ✕
              </button>
            </div>
            <div ref={embedRef} style={{ height: 460 }} />
          </div>
        </div>
      )}
    </>
  )
}
