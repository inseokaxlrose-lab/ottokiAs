'use client'

import { useState, type ReactNode } from 'react'
import type { AsRequest, AsStatus, PurchaseRequest, PurchaseStatus } from '@/lib/types'
import { statusLabel, purchaseStatusLabel, BANK_INFO } from '@/lib/types'

// AS 상태별 스타일
const statusStyle: Record<AsStatus, { bg: string; text: string; dot: string }> = {
  received:          { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  delivery_received: { bg: 'bg-sky-50',    text: 'text-sky-700',    dot: 'bg-sky-400' },
  symptom_checked:   { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  quote_sent:        { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  payment_confirmed: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  repairing:         { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  cancelled:         { bg: 'bg-slate-100', text: 'text-slate-500',  dot: 'bg-slate-400' },
  completed:         { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  shipped:           { bg: 'bg-teal-50',   text: 'text-teal-700',   dot: 'bg-teal-500' },
}

// 신규구매 상태 스타일
const purchaseStyle: Record<PurchaseStatus, { bg: string; text: string; dot: string }> = {
  pending:         { bg: 'bg-blue-50',   text: 'text-blue-700',  dot: 'bg-blue-400' },
  waiting_payment: { bg: 'bg-yellow-50', text: 'text-yellow-700',dot: 'bg-yellow-400' },
  shipped:         { bg: 'bg-teal-50',   text: 'text-teal-700',  dot: 'bg-teal-500' },
  cancelled:       { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
}

// AS 타임라인 순서 (취소 제외)
const statusSteps: AsStatus[] = [
  'received', 'delivery_received', 'symptom_checked',
  'quote_sent', 'payment_confirmed', 'repairing', 'completed', 'shipped',
]

// 신규구매 타임라인 순서
const purchaseSteps: PurchaseStatus[] = ['pending', 'waiting_payment', 'shipped']

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 계좌 정보 컴포넌트
function BankInfoBox({ message }: { message: string }) {
  return (
    <div className='mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4'>
      <p className='text-sm font-semibold text-yellow-800 mb-2'>💳 입금 안내</p>
      <p className='text-sm text-yellow-700 mb-3'>{message}</p>
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
  )
}

// 택배 정보 컴포넌트
function TrackingInfoBox({ courierCompany, trackingNumber }: { courierCompany: string; trackingNumber: string }) {
  return (
    <div className='mt-4 bg-teal-50 border border-teal-200 rounded-xl p-4'>
      <p className='text-sm font-semibold text-teal-800 mb-3'>🚚 발송 정보</p>
      <div className='bg-white border border-teal-200 rounded-lg px-4 py-3 space-y-1 text-sm'>
        {courierCompany && (
          <div className='flex gap-2'>
            <span className='text-slate-400 w-16'>택배사</span>
            <span className='font-medium text-slate-800'>{courierCompany}</span>
          </div>
        )}
        {trackingNumber && (
          <div className='flex gap-2'>
            <span className='text-slate-400 w-16'>송장번호</span>
            <span className='font-bold text-slate-900 tracking-wide'>{trackingNumber}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckPage() {
  const [tab, setTab] = useState<'as' | 'purchase'>('as')

  // AS 조회 상태
  const [asTab, setAsTab] = useState<'receipt' | 'name'>('receipt')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [asName, setAsName] = useState('')
  const [asPhone, setAsPhone] = useState('')
  const [asResults, setAsResults] = useState<AsRequest[] | null>(null)
  const [asLoading, setAsLoading] = useState(false)
  const [asError, setAsError] = useState<string | null>(null)


  // 신규구매 조회 상태
  const [purchaseName, setPurchaseName] = useState('')
  const [purchasePhone, setPurchasePhone] = useState('')
  const [purchaseResults, setPurchaseResults] = useState<PurchaseRequest[] | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  // 연락처 포맷 (숫자만)
  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  // AS 조회
  async function handleAsSearch(e: React.FormEvent) {
    e.preventDefault()
    setAsError(null)
    setAsResults(null)
    setAsLoading(true)
    try {
      const params = new URLSearchParams()
      if (asTab === 'receipt') params.set('receipt_number', receiptNumber)
      else { params.set('name', asName); params.set('phone', asPhone) }

      const res = await fetch(`/api/check?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '조회 실패')
      setAsResults(json.data)
    } catch (err) {
      setAsError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setAsLoading(false)
    }
  }

  // 신규구매 조회
  async function handlePurchaseSearch(e: React.FormEvent) {
    e.preventDefault()
    setPurchaseError(null)
    setPurchaseResults(null)
    setPurchaseLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('name', purchaseName)
      params.set('phone', purchasePhone)

      const res = await fetch(`/api/purchase-check?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '조회 실패')
      setPurchaseResults(json.data)
    } catch (err) {
      setPurchaseError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setPurchaseLoading(false)
    }
  }

  const inputCls = 'h-10 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'

  return (
    <div className='max-w-2xl mx-auto px-4 sm:px-6 py-10'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-slate-900'>접수내역 확인</h1>
        <p className='text-slate-500 mt-1 text-sm'>AS 접수 및 신규구매 진행 현황을 조회하세요.</p>
      </div>

      {/* 탭 */}
      <div className='flex gap-2 mb-6 border-b border-slate-200'>
        <button
          onClick={() => setTab('as')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'as' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          AS 접수 확인
        </button>
        <button
          onClick={() => setTab('purchase')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'purchase' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          신규구매 확인
        </button>
      </div>

      {/* ─── AS 접수 확인 탭 ─── */}
      {tab === 'as' && (
        <>
          <div className='bg-white rounded-2xl border border-slate-200 p-6 mb-8'>
            <div className='flex gap-2 mb-5'>
              <button
                onClick={() => setAsTab('receipt')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${asTab === 'receipt' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                접수번호로 조회
              </button>
              <button
                onClick={() => setAsTab('name')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${asTab === 'name' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                이름+연락처로 조회
              </button>
            </div>

            <form onSubmit={handleAsSearch} className='space-y-4'>
              {asTab === 'receipt' ? (
                <label className='flex flex-col gap-1.5'>
                  <span className='text-sm font-medium text-slate-700'>접수번호</span>
                  <input
                    type='text'
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    required
                    placeholder='예: AS-20240608-0001'
                    className={`${inputCls} uppercase`}
                  />
                </label>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <label className='flex flex-col gap-1.5'>
                    <span className='text-sm font-medium text-slate-700'>이름</span>
                    <input type='text' value={asName} onChange={(e) => setAsName(e.target.value)} required placeholder='홍길동' className={inputCls} />
                  </label>
                  <label className='flex flex-col gap-1.5'>
                    <span className='text-sm font-medium text-slate-700'>연락처</span>
                    <input type='tel' value={asPhone} onChange={(e) => setAsPhone(formatPhone(e.target.value))} required placeholder='010-0000-0000' className={inputCls} />
                  </label>
                </div>
              )}
              <button type='submit' disabled={asLoading} className='w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors text-sm'>
                {asLoading ? '조회 중...' : '조회하기'}
              </button>
            </form>
          </div>

          {asError && <div className='bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-6'>{asError}</div>}

          {asResults && asResults.map((item) => {
            const style = statusStyle[item.status]
            const currentStepIndex = statusSteps.indexOf(item.status)
            const isCancelled = item.status === 'cancelled'
            // 상태별 날짜 맵 (이력에서 추출)
            const historyMap = new Map<string, string>()
            item.as_status_history?.forEach((h) => {
              if (!historyMap.has(h.status)) historyMap.set(h.status, h.changed_at)
            })

            return (
              <div key={item.id} className='bg-white rounded-2xl border border-slate-200 p-6 mb-4'>
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <p className='text-xs text-slate-400'>접수번호</p>
                    <p className='font-bold text-slate-900 text-lg tracking-wide'>{item.receipt_number}</p>
                    <p className='text-xs text-slate-400 mt-0.5'>접수일: {formatDate(item.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${style.bg} ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {statusLabel[item.status]}
                  </span>
                </div>

                {/* 상태 타임라인 — 4+4 두 행, 연결선 포함 */}
                {!isCancelled && (
                  <div className='mb-6 space-y-3'>
                    {([statusSteps.slice(0, 4), statusSteps.slice(4)] as AsStatus[][]).map((rowSteps, rowIdx) => {
                      // 원과 연결선을 별도 요소로 배열에 담아 flat하게 렌더링
                      const nodes: ReactNode[] = []
                      rowSteps.forEach((step, colIdx) => {
                        const globalIdx = rowIdx * 4 + colIdx
                        const isPast = globalIdx <= currentStepIndex
                        const stepDate = historyMap.get(step)

                        nodes.push(
                          <div key={step} className='flex-1 flex flex-col items-center min-w-0'>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                              isPast ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-400'
                            }`}>
                              {isPast ? '✓' : globalIdx + 1}
                            </div>
                            <span className={`text-xs mt-1 text-center leading-tight px-0.5 ${isPast ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                              {statusLabel[step]}
                            </span>
                            {stepDate && (
                              <span className='text-xs text-slate-400 mt-0.5 text-center'>{formatDate(stepDate)}</span>
                            )}
                          </div>
                        )

                        // 마지막 원 제외하고 연결선 추가 (mt-4 = 원 높이 절반, 중앙 정렬)
                        if (colIdx < rowSteps.length - 1) {
                          nodes.push(
                            <div
                              key={`line-${globalIdx}`}
                              className={`shrink-0 w-4 sm:w-6 h-0.5 mt-4 ${globalIdx < currentStepIndex ? 'bg-blue-400' : 'bg-slate-200'}`}
                            />
                          )
                        }
                      })

                      return (
                        <div key={rowIdx} className='flex items-start'>
                          {nodes}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 접수 정보 */}
                <table className='w-full text-sm'>
                  <tbody>
                    <tr className='border-t border-slate-100'><td className='py-2 text-slate-400 w-24'>제품명</td><td className='py-2 font-medium'>{item.product_name}</td></tr>
                    <tr className='border-t border-slate-100'>
                      <td className='py-2 text-slate-400'>시리얼번호</td>
                      <td className={`py-2 ${item.model_name ? '' : 'text-slate-400'}`}>{item.model_name || '미입력'}</td>
                    </tr>
                    <tr className='border-t border-slate-100'><td className='py-2 text-slate-400'>증상</td><td className='py-2 whitespace-pre-wrap'>{item.symptom}</td></tr>
                  </tbody>
                </table>

                {/* AS 수리 결과 */}
                {item.as_results && item.as_results.length > 0 && (() => {
                  const result = item.as_results![0]
                  const hasContent = result.repair_detail || result.cost != null
                  if (!hasContent) return null
                  const isShipped = item.status === 'shipped'
                  const hasTracking = !!(item.courier_company || item.tracking_number)
                  return (
                    <div className='mt-4 bg-green-50 border border-green-100 rounded-xl p-4'>
                      <p className='text-sm font-semibold text-green-800 mb-3'>🔧 수리 결과</p>
                      <table className='w-full text-sm'>
                        <tbody>
                          {result.repair_detail && (
                            <tr>
                              <td className='py-1.5 text-green-700 font-medium w-20 align-top'>수리 내용</td>
                              <td className='py-1.5 text-green-900 whitespace-pre-wrap'>{result.repair_detail}</td>
                            </tr>
                          )}
                          {result.cost != null && (
                            <tr>
                              <td className='py-1.5 text-green-700 font-medium'>수리 비용</td>
                              <td className='py-1.5 text-green-900 font-bold text-base'>
                                {result.cost > 0 ? `${result.cost.toLocaleString()}원` : '무상 수리'}
                              </td>
                            </tr>
                          )}
                          {result.completed_at && (
                            <tr>
                              <td className='py-1.5 text-green-700 font-medium'>완료일</td>
                              <td className='py-1.5 text-green-900'>{new Date(result.completed_at).toLocaleDateString('ko-KR')}</td>
                            </tr>
                          )}
                          {result.note && (
                            <tr>
                              <td className='py-1.5 text-green-700 font-medium'>비고</td>
                              <td className='py-1.5 text-green-900'>{result.note}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      {/* 발송완료 + 택배 정보 있으면 택배 정보 표시 */}
                      {isShipped && hasTracking && (
                        <TrackingInfoBox
                          courierCompany={item.courier_company ?? ''}
                          trackingNumber={item.tracking_number ?? ''}
                        />
                      )}
                      {/* 발송완료가 아닌 경우: 수리비 > 0 이면 입금 안내 */}
                      {!isShipped && result.cost != null && result.cost > 0 && (
                        <BankInfoBox message='수리비를 아래 계좌로 입금해 주시면 제품을 발송해 드립니다.' />
                      )}
                      {/* 발송완료가 아닌 경우: 비용 미확정이면 입금 안내 */}
                      {!isShipped && result.cost == null && result.repair_detail && (
                        <BankInfoBox message='수리 비용이 확정되면 아래 계좌로 입금해 주세요. 입금 확인 후 발송됩니다.' />
                      )}
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </>
      )}

      {/* ─── 신규구매 확인 탭 ─── */}
      {tab === 'purchase' && (
        <>
          <div className='bg-white rounded-2xl border border-slate-200 p-6 mb-8'>
            <p className='text-sm text-slate-500 mb-4'>접수 시 입력하신 이름과 연락처로 조회하세요.</p>
            <form onSubmit={handlePurchaseSearch} className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <label className='flex flex-col gap-1.5'>
                  <span className='text-sm font-medium text-slate-700'>이름</span>
                  <input type='text' value={purchaseName} onChange={(e) => setPurchaseName(e.target.value)} required placeholder='홍길동 / 회사명' className={inputCls} />
                </label>
                <label className='flex flex-col gap-1.5'>
                  <span className='text-sm font-medium text-slate-700'>연락처</span>
                  <input type='tel' value={purchasePhone} onChange={(e) => setPurchasePhone(formatPhone(e.target.value))} required placeholder='010-0000-0000' className={inputCls} />
                </label>
              </div>
              <button type='submit' disabled={purchaseLoading} className='w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-xl transition-colors text-sm'>
                {purchaseLoading ? '조회 중...' : '조회하기'}
              </button>
            </form>
          </div>

          {purchaseError && <div className='bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-6'>{purchaseError}</div>}

          {purchaseResults && purchaseResults.map((item) => {
            const style = purchaseStyle[item.status]
            const currentStepIndex = purchaseSteps.indexOf(item.status)
            const historyMap = new Map<string, string>()
            item.purchase_status_history?.forEach((h) => {
              if (!historyMap.has(h.status)) historyMap.set(h.status, h.changed_at)
            })
            const showBankInfo = item.status !== 'shipped' && item.status !== 'cancelled'

            return (
              <div key={item.id} className='bg-white rounded-2xl border border-slate-200 p-6 mb-4'>
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <p className='text-xs text-slate-400'>접수일: {formatDate(item.created_at)}</p>
                    <p className='font-bold text-slate-900'>{item.customer_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${style.bg} ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {purchaseStatusLabel[item.status]}
                  </span>
                </div>

                {/* 진행 타임라인 */}
                {item.status !== 'cancelled' && (
                  <div className='flex items-start mb-6'>
                    {purchaseSteps.map((step, idx) => {
                      const isPast = idx <= currentStepIndex
                      const isLast = idx === purchaseSteps.length - 1
                      const stepDate = historyMap.get(step)
                      return (
                        <div key={step} className='flex items-start flex-1'>
                          <div className='flex flex-col items-center w-full'>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                              isPast ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-300 text-slate-400'
                            }`}>
                              {isPast ? '✓' : idx + 1}
                            </div>
                            <span className={`text-xs mt-1 ${isPast ? 'text-purple-600 font-medium' : 'text-slate-400'}`}>
                              {purchaseStatusLabel[step]}
                            </span>
                            {stepDate && <span className='text-xs text-slate-400 mt-0.5'>{formatDate(stepDate)}</span>}
                          </div>
                          {!isLast && <div className={`flex-1 h-0.5 mt-3.5 ${idx < currentStepIndex ? 'bg-purple-400' : 'bg-slate-200'}`} />}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 구매 정보 */}
                <table className='w-full text-sm'>
                  <tbody>
                    <tr className='border-t border-slate-100'><td className='py-2 text-slate-400 w-24'>제품</td><td className='py-2 font-medium'>{item.product_name}</td></tr>
                    <tr className='border-t border-slate-100'><td className='py-2 text-slate-400'>수량</td><td className='py-2'>{item.quantity}개</td></tr>
                    {item.inquiry && <tr className='border-t border-slate-100'><td className='py-2 text-slate-400'>문의</td><td className='py-2 whitespace-pre-wrap'>{item.inquiry}</td></tr>}
                  </tbody>
                </table>

                {/* 발송완료·취소 제외하고 계좌 안내 항상 표시 */}
                {showBankInfo && (
                  <BankInfoBox message={
                    item.status === 'waiting_payment'
                      ? '아래 계좌로 입금이 확인되면 발송 처리됩니다. 입금 완료 후 1~2 영업일 내 발송됩니다.'
                      : '담당자 확인 후 견적 안내를 드립니다. 확인 후 아래 계좌로 입금해 주세요.'
                  } />
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
