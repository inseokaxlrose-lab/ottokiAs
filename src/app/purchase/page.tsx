'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FileDropzone from '@/components/FileDropzone'
import AddressInput, { type AddressValue } from '@/components/AddressInput'
import { BANK_INFO } from '@/lib/types'

// 구매 가능 제품 목록 (나중에 확장 시 여기에 추가)
const PRODUCTS = [
  { value: 'KDC280', label: 'KDC280', price: 330000 },
]

// 연락처 자동 포맷: 숫자만 입력받아 010-XXXX-XXXX 형태로 변환
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

interface FormState {
  customer_name: string
  phone: string
  email: string
  product_name: string
  quantity: string
  inquiry: string
  business_doc: File | null
}

const initialForm: FormState = {
  customer_name: '',
  phone: '',
  email: '',
  product_name: 'KDC280',
  quantity: '1',
  inquiry: '',
  business_doc: null,
}

const initialAddress: AddressValue = { zipcode: '', address: '', addressDetail: '' }

export default function PurchasePage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialForm)
  const [addressValue, setAddressValue] = useState<AddressValue>(initialAddress)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'phone') {
      setForm((prev) => ({ ...prev, phone: formatPhone(value) }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null) formData.append(key, value as string | File)
      })
      // 배송 주소 필드 추가
      formData.append('zipcode', addressValue.zipcode)
      formData.append('address', addressValue.address)
      formData.append('address_detail', addressValue.addressDetail)

      const res = await fetch('/api/purchase', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? '제출 실패')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 제출 완료 화면
  if (done) {
    return (
      <div className='max-w-lg mx-auto px-4 sm:px-6 py-16 text-center'>
        <div className='w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6'>
          <span className='text-4xl'>🛒</span>
        </div>
        <h1 className='text-2xl font-bold text-slate-900 mb-2'>문의가 접수되었습니다!</h1>
        <p className='text-slate-500 text-sm mb-8'>
          담당자가 확인 후 입력하신 연락처로 안내드리겠습니다.<br />
          확인 이메일도 발송되었습니다.
        </p>
        <div className='flex gap-3 justify-center'>
          <button
            onClick={() => router.push('/')}
            className='px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors'
          >
            메인으로 돌아가기
          </button>
          <button
            onClick={() => { setDone(false); setForm(initialForm); setAddressValue(initialAddress) }}
            className='px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-medium transition-colors'
          >
            새 문의하기
          </button>
        </div>
      </div>
    )
  }

  const selectedProduct = PRODUCTS.find((p) => p.value === form.product_name)

  return (
    <div className='max-w-2xl mx-auto px-4 sm:px-6 py-10'>
      {/* 페이지 헤더 */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-slate-900'>신규구매 문의</h1>
        <p className='text-slate-500 mt-1 text-sm'>
          구매를 원하시면 아래 양식을 작성해 주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-8'>
        {/* 고객 정보 섹션 */}
        <section className='bg-white rounded-2xl border border-slate-200 p-6 space-y-4'>
          <h2 className='text-base font-semibold text-slate-800'>고객 정보</h2>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <label className='flex flex-col gap-1.5'>
              <span className='text-sm font-medium text-slate-700'>
                이름 <span className='text-red-500'>*</span>
              </span>
              <input
                type='text'
                name='customer_name'
                value={form.customer_name}
                onChange={handleChange}
                required
                placeholder='홍길동 / 회사명'
                className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent'
              />
            </label>

            <label className='flex flex-col gap-1.5'>
              <span className='text-sm font-medium text-slate-700'>
                연락처 <span className='text-red-500'>*</span>
              </span>
              <input
                type='tel'
                name='phone'
                value={form.phone}
                onChange={handleChange}
                required
                placeholder='010-0000-0000'
                className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent'
              />
            </label>
          </div>

          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium text-slate-700'>
              이메일 <span className='text-red-500'>*</span>
            </span>
            <input
              type='email'
              name='email'
              value={form.email}
              onChange={handleChange}
              required
              placeholder='example@email.com'
              className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent'
            />
          </label>

          {/* 배송 주소 */}
          <div className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium text-slate-700'>
              배송 주소 <span className='text-red-500'>*</span>
            </span>
            <AddressInput
              value={addressValue}
              onChange={setAddressValue}
              accentColor='purple'
            />
          </div>
        </section>

        {/* 구매 정보 섹션 */}
        <section className='bg-white rounded-2xl border border-slate-200 p-6 space-y-4'>
          <h2 className='text-base font-semibold text-slate-800'>구매 정보</h2>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <label className='flex flex-col gap-1.5'>
              <span className='text-sm font-medium text-slate-700'>
                구매 제품 <span className='text-red-500'>*</span>
              </span>
              <select
                name='product_name'
                value={form.product_name}
                onChange={handleChange}
                required
                className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white'
              >
                {PRODUCTS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>

            <label className='flex flex-col gap-1.5'>
              <span className='text-sm font-medium text-slate-700'>
                구매 수량 <span className='text-red-500'>*</span>
              </span>
              <input
                type='number'
                name='quantity'
                value={form.quantity}
                onChange={handleChange}
                required
                min='1'
                max='999'
                className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent'
              />
            </label>
          </div>

          {/* 가격 정보 */}
          {selectedProduct && (
            <div className='bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center justify-between'>
              <div>
                <p className='text-xs text-purple-500 mb-0.5'>단가 (VAT 별도)</p>
                <p className='text-lg font-bold text-purple-800'>
                  {selectedProduct.price.toLocaleString()}원
                </p>
              </div>
              <div className='text-right'>
                <p className='text-xs text-purple-500 mb-0.5'>합계 (VAT 별도)</p>
                <p className='text-lg font-bold text-purple-800'>
                  {(selectedProduct.price * Number(form.quantity || 1)).toLocaleString()}원
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 추가 문의 섹션 */}
        <section className='bg-white rounded-2xl border border-slate-200 p-6 space-y-4'>
          <h2 className='text-base font-semibold text-slate-800'>추가 문의 사항</h2>

          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium text-slate-700'>문의 내용</span>
            <textarea
              name='inquiry'
              value={form.inquiry}
              onChange={handleChange}
              rows={3}
              placeholder='납기 일정, 배송 방법 등 추가 문의 사항을 작성해 주세요. (선택)'
              className='border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none'
            />
          </label>

          <FileDropzone
            accept='image/*,.pdf'
            label='사업자등록증 (선택, 사업자 구매 시 첨부)'
            hint='이미지(JPG, PNG) 또는 PDF 파일 · 최대 10MB · 드래그하거나 클릭하여 첨부'
            accentColor='purple'
            value={form.business_doc}
            onChange={(file) => setForm((prev) => ({ ...prev, business_doc: file }))}
          />
        </section>

        {error && (
          <div className='bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600'>
            {error}
          </div>
        )}

        {/* 입금 계좌 안내 */}
        <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-4'>
          <p className='text-sm font-semibold text-yellow-800 mb-2'>💳 입금 계좌 안내</p>
          <p className='text-xs text-yellow-700 mb-3'>
            문의 접수 후 담당자가 확인하여 견적 안내를 드립니다.<br />
            아래 계좌로 입금 확인 시 발송 처리됩니다.
          </p>
          <div className='bg-white border border-yellow-200 rounded-lg px-4 py-3 space-y-1 text-sm'>
            <div className='flex gap-2'>
              <span className='text-slate-400 w-12'>은행</span>
              <span className='font-medium text-slate-800'>{BANK_INFO.bank}</span>
            </div>
            <div className='flex gap-2'>
              <span className='text-slate-400 w-12'>계좌</span>
              <span className='font-bold text-slate-900 tracking-wide'>{BANK_INFO.account}</span>
            </div>
            <div className='flex gap-2'>
              <span className='text-slate-400 w-12'>예금주</span>
              <span className='font-medium text-slate-800'>{BANK_INFO.holder}</span>
            </div>
          </div>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-xl transition-colors text-sm'
        >
          {loading ? '제출 중...' : '구매 문의 제출하기'}
        </button>
      </form>
    </div>
  )
}
