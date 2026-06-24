'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FileDropzone from '@/components/FileDropzone'
import AddressInput, { type AddressValue } from '@/components/AddressInput'

// 선택 가능한 제품 목록
const PRODUCTS = ['KDC200', 'KDC270', 'KDC280']

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
  model_name: string
  purchase_date: string
  symptom: string
  photo: File | null
}

const initialForm: FormState = {
  customer_name: '',
  phone: '',
  email: '',
  product_name: PRODUCTS[0],
  model_name: '',
  purchase_date: '',
  symptom: '',
  photo: null,
}

const initialAddress: AddressValue = { zipcode: '', address: '', addressDetail: '' }

export default function SubmitPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialForm)
  const [addressValue, setAddressValue] = useState<AddressValue>(initialAddress)
  const [loading, setLoading] = useState(false)
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
      // 주소 필드 추가
      formData.append('zipcode', addressValue.zipcode)
      formData.append('address', addressValue.address)
      formData.append('address_detail', addressValue.addressDetail)

      const res = await fetch('/api/submit', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) throw new Error(json.error ?? '접수 실패')
      router.push(`/submit/complete?receipt=${json.receipt_number}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='max-w-2xl mx-auto px-4 sm:px-6 py-10'>
      {/* 페이지 헤더 */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-slate-900'>AS 접수하기</h1>
        <p className='text-slate-500 mt-1 text-sm'>아래 정보를 입력하시면 담당자가 검토 후 연락드립니다.</p>
      </div>

      {/* 택배 접수 주소 안내 */}
      <div className='bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3 items-start'>
        <span className='text-xl mt-0.5'>📦</span>
        <div>
          <p className='text-sm font-semibold text-amber-800'>택배 접수 주소</p>
          <p className='text-sm text-amber-700 mt-0.5'>
            서울 강남구 언주로87길 6 MH빌딩 904호
          </p>
          <p className='text-xs text-amber-600 mt-1'>접수 후 위 주소로 제품을 발송해 주세요.</p>
        </div>
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
                placeholder='홍길동'
                className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
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
                className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
              />
            </label>
          </div>

          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium text-slate-700'>
              이메일 <span className='text-red-500'>*</span>
              <span className='text-xs text-slate-400 font-normal ml-1'>(접수 확인 메일 발송)</span>
            </span>
            <input
              type='email'
              name='email'
              value={form.email}
              onChange={handleChange}
              required
              placeholder='example@email.com'
              className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
            />
          </label>

          {/* 반송 주소 */}
          <div className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium text-slate-700'>
              반송 주소 <span className='text-red-500'>*</span>
              <span className='text-xs text-slate-400 font-normal ml-1'>(수리 완료 후 발송할 주소)</span>
            </span>
            <AddressInput
              value={addressValue}
              onChange={setAddressValue}
              accentColor='blue'
            />
          </div>
        </section>

        {/* 제품 정보 섹션 */}
        <section className='bg-white rounded-2xl border border-slate-200 p-6 space-y-4'>
          <h2 className='text-base font-semibold text-slate-800'>제품 정보</h2>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <label className='flex flex-col gap-1.5'>
              <span className='text-sm font-medium text-slate-700'>
                제품명 <span className='text-red-500'>*</span>
              </span>
              <select
                name='product_name'
                value={form.product_name}
                onChange={handleChange}
                required
                className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white'
              >
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>

            <label className='flex flex-col gap-1.5'>
              <span className='text-sm font-medium text-slate-700'>시리얼번호 (SN)</span>
              <input
                type='text'
                name='model_name'
                value={form.model_name}
                onChange={handleChange}
                placeholder='예: 123456'
                maxLength={20}
                className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
              />
            </label>
          </div>

          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium text-slate-700'>구매일</span>
            <input
              type='date'
              name='purchase_date'
              value={form.purchase_date}
              onChange={handleChange}
              autoComplete='off'
              className='h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent w-full sm:w-48'
            />
          </label>
        </section>

        {/* 증상 설명 섹션 */}
        <section className='bg-white rounded-2xl border border-slate-200 p-6 space-y-4'>
          <h2 className='text-base font-semibold text-slate-800'>증상 설명</h2>

          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium text-slate-700'>
              증상 <span className='text-red-500'>*</span>
            </span>
            <textarea
              name='symptom'
              value={form.symptom}
              onChange={handleChange}
              required
              rows={4}
              placeholder='제품의 증상을 최대한 자세히 설명해 주세요. (예: 전원이 켜지지 않음, 소음 발생 등)'
              className='border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none'
            />
          </label>

          <FileDropzone
            accept='image/*'
            label='사진 첨부 (선택)'
            hint='이미지 파일(JPG, PNG 등) · 최대 10MB · 드래그하거나 클릭하여 첨부'
            accentColor='blue'
            value={form.photo}
            onChange={(file) => setForm((prev) => ({ ...prev, photo: file }))}
          />
        </section>

        {error && (
          <div className='bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600'>
            {error}
          </div>
        )}

        <button
          type='submit'
          disabled={loading}
          className='w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors text-sm'
        >
          {loading ? '접수 중...' : 'AS 접수하기'}
        </button>
      </form>
    </div>
  )
}
