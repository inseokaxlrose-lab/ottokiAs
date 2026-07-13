'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AsRequest, AsStatus, PurchaseRequest, PurchaseStatus, Partner } from '@/lib/types'
import { statusLabel, purchaseStatusLabel, BANK_INFO } from '@/lib/types'

// 상태 뱃지 색상
const statusColor: Record<AsStatus, string> = {
  received:          'bg-blue-100 text-blue-700',
  delivery_received: 'bg-sky-100 text-sky-700',
  symptom_checked:   'bg-indigo-100 text-indigo-700',
  quote_sent:        'bg-violet-100 text-violet-700',
  payment_confirmed: 'bg-yellow-100 text-yellow-700',
  repairing:         'bg-orange-100 text-orange-700',
  cancelled:         'bg-slate-100 text-slate-500',
  completed:         'bg-green-100 text-green-700',
  shipped:           'bg-teal-100 text-teal-700',
}

const ALL_STATUSES: AsStatus[] = [
  'received', 'delivery_received', 'symptom_checked',
  'quote_sent', 'payment_confirmed', 'repairing',
  'cancelled', 'completed', 'shipped',
]

// 신규구매 상태 뱃지 색상
const purchaseColor: Record<PurchaseStatus, string> = {
  pending:         'bg-blue-100 text-blue-700',
  waiting_payment: 'bg-yellow-100 text-yellow-700',
  preparing:       'bg-orange-100 text-orange-700',
  shipped:         'bg-teal-100 text-teal-700',
  cancelled:       'bg-slate-100 text-slate-500',
}

// 신규구매 상태 변경 버튼 순서 (접수완료 → 입금대기 → 상품 준비중 → 발송완료, 취소)
const ALL_PURCHASE_STATUSES: PurchaseStatus[] = [
  'pending', 'waiting_payment', 'preparing', 'shipped', 'cancelled',
]

// 결과 입력 폼 초기값
const emptyResult = { repair_detail: '', cost: '', completed_at: '', note: '' }

// 거래처 폼 초기값
const emptyPartnerForm = {
  name: '', phone: '', address: '', address_detail: '', zipcode: '',
  business_number: '', business_type: '', business_category: '',
  representative: '', email: '', note: '', business_doc_url: '',
}

export default function AdminDashboardPage() {
  const router = useRouter()

  // 탭: AS접수 | 신규구매 | 거래처관리
  const [tab, setTab] = useState<'as' | 'purchase' | 'partner'>('as')

  // ── AS 접수 상태 ──
  const [requests, setRequests] = useState<AsRequest[]>([])
  const [loadingAs, setLoadingAs] = useState(true)
  const [selected, setSelected] = useState<AsRequest | null>(null)
  const [resultForm, setResultForm] = useState(emptyResult)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<AsStatus | 'all'>('all')

  // 시리얼번호 인라인 수정
  const [editingSerial, setEditingSerial] = useState(false)
  const [serialValue, setSerialValue] = useState('')
  const [serialSaving, setSerialSaving] = useState(false)

  // 거래처 선택 팝업
  const [showPartnerPopup, setShowPartnerPopup] = useState(false)
  const [partnerPopupSearch, setPartnerPopupSearch] = useState('')
  const [partnerPopupSaving, setPartnerPopupSaving] = useState(false)

  // 거래처 탭 목록 검색
  const [partnerSearch, setPartnerSearch] = useState('')

  // 택배정보 인라인 수정
  const [editingShipping, setEditingShipping] = useState(false)
  const [shippingForm, setShippingForm] = useState({ courier_company: '', tracking_number: '' })
  const [shippingSaving, setShippingSaving] = useState(false)

  // ── 신규구매 상태 ──
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([])
  const [loadingPurchase, setLoadingPurchase] = useState(true)
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRequest | null>(null)

  // ── 거래처 관리 상태 ──
  const [partners, setPartners] = useState<Partner[]>([])
  const [loadingPartner, setLoadingPartner] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [partnerForm, setPartnerForm] = useState(emptyPartnerForm)
  const [partnerMode, setPartnerMode] = useState<'list' | 'create' | 'edit'>('list')
  const [partnerSaving, setPartnerSaving] = useState(false)
  const [partnerDocFile, setPartnerDocFile] = useState<File | null>(null)

  // ── 데이터 로딩 ──
  const fetchRequests = useCallback(async () => {
    setLoadingAs(true)
    try {
      const res = await fetch('/api/admin/requests')
      if (res.status === 401 || res.status === 403) { router.push('/admin'); return }
      const json = await res.json()
      setRequests(json.data ?? [])
    } finally {
      setLoadingAs(false)
    }
  }, [router])

  const fetchPurchases = useCallback(async () => {
    setLoadingPurchase(true)
    try {
      const res = await fetch('/api/admin/purchases')
      if (res.status === 401 || res.status === 403) { router.push('/admin'); return }
      const json = await res.json()
      setPurchases(json.data ?? [])
    } finally {
      setLoadingPurchase(false)
    }
  }, [router])

  const fetchPartners = useCallback(async () => {
    setLoadingPartner(true)
    try {
      const res = await fetch('/api/admin/partners')
      const json = await res.json()
      setPartners(json.data ?? [])
    } finally {
      setLoadingPartner(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
    fetchPurchases()
    fetchPartners()
  }, [fetchRequests, fetchPurchases, fetchPartners])

  // ── AS 접수 ──
  function selectRequest(item: AsRequest) {
    setSelected(item)
    setEditingSerial(false)
    setSerialValue(item.model_name ?? '')
    setShowPartnerPopup(false)
    setEditingShipping(false)
    setShippingForm({
      courier_company: item.courier_company ?? '',
      tracking_number: item.tracking_number ?? '',
    })
    const existing = item.as_results?.[0]
    setResultForm({
      repair_detail: existing?.repair_detail ?? '',
      cost: existing?.cost?.toString() ?? '',
      completed_at: existing?.completed_at ?? '',
      note: existing?.note ?? '',
    })
  }

  async function saveSerial() {
    if (!selected) return
    setSerialSaving(true)
    try {
      const res = await fetch(`/api/admin/requests/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: serialValue }),
      })
      if (!res.ok) { alert((await res.json().catch(() => ({}))).error ?? '수정 실패'); return }
      setRequests((prev) => prev.map((r) => r.id === selected.id ? { ...r, model_name: serialValue } : r))
      setSelected((prev) => prev ? { ...prev, model_name: serialValue } : null)
      setEditingSerial(false)
    } finally {
      setSerialSaving(false)
    }
  }

  // 팝업에서 거래처 클릭 시 즉시 저장
  async function selectPartnerFromPopup(partner: Partner | null) {
    if (!selected) return
    setPartnerPopupSaving(true)
    try {
      const res = await fetch(`/api/admin/requests/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: partner?.id ?? null }),
      })
      if (!res.ok) { alert((await res.json().catch(() => ({}))).error ?? '저장 실패'); return }
      const partnerSnap = partner ? { id: partner.id, name: partner.name, phone: partner.phone } : null
      setRequests((prev) => prev.map((r) =>
        r.id === selected.id ? { ...r, partner_id: partner?.id ?? null, partner: partnerSnap } : r
      ))
      setSelected((prev) => prev ? { ...prev, partner_id: partner?.id ?? null, partner: partnerSnap } : null)
      setShowPartnerPopup(false)
    } finally {
      setPartnerPopupSaving(false)
    }
  }

  async function saveShipping() {
    if (!selected) return
    setShippingSaving(true)
    try {
      const res = await fetch(`/api/admin/requests/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier_company: shippingForm.courier_company || null,
          tracking_number: shippingForm.tracking_number || null,
        }),
      })
      if (!res.ok) { alert((await res.json().catch(() => ({}))).error ?? '저장 실패'); return }
      setRequests((prev) => prev.map((r) =>
        r.id === selected.id ? { ...r, ...shippingForm } : r
      ))
      setSelected((prev) => prev ? { ...prev, ...shippingForm } : null)
      setEditingShipping(false)
    } finally {
      setShippingSaving(false)
    }
  }

  async function updateStatus(id: string, status: AsStatus) {
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      alert((await res.json().catch(() => ({}))).error ?? '상태 변경 실패. Supabase SQL을 먼저 실행해주세요.')
      return
    }
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
    setSelected((prev) => prev?.id === id ? { ...prev, status } : prev)
  }

  async function saveResult(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/requests/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: {
            repair_detail: resultForm.repair_detail,
            cost: resultForm.cost ? Number(resultForm.cost) : null,
            completed_at: resultForm.completed_at || null,
            note: resultForm.note,
          },
        }),
      })
      if (!res.ok) { alert((await res.json().catch(() => ({}))).error ?? 'AS 결과 저장 실패'); return }
      // 서버 재조회로 최신 데이터 반영
      const listRes = await fetch('/api/admin/requests')
      if (listRes.ok) {
        const listJson = await listRes.json()
        const updated: AsRequest[] = listJson.data ?? []
        setRequests(updated)
        const updatedItem = updated.find((r) => r.id === selected.id)
        if (updatedItem) setSelected(updatedItem)
      }
      alert('저장되었습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 접수 삭제 (소프트 삭제 → 목록에서 숨김)
  async function deleteRequest(id: string) {
    if (!confirm('이 접수를 삭제하시겠습니까?\n삭제하면 목록에서 보이지 않습니다.')) return
    const res = await fetch(`/api/admin/requests/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      alert((await res.json().catch(() => ({}))).error ?? '삭제 실패. Supabase SQL을 먼저 실행해주세요.')
      return
    }
    // 화면 목록에서 제거 + 상세 닫기
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setSelected(null)
  }

  // ── 신규구매 ──
  async function updatePurchaseStatus(id: string, status: PurchaseStatus) {
    const res = await fetch(`/api/admin/purchases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      alert((await res.json().catch(() => ({}))).error ?? '상태 변경 실패. Supabase SQL을 먼저 실행해주세요.')
      return
    }
    setPurchases((prev) => prev.map((p) => p.id === id ? { ...p, status } : p))
    setSelectedPurchase((prev) => prev?.id === id ? { ...prev, status } : prev)
  }

  // ── 거래처 관리 ──
  function openCreatePartner() {
    setSelectedPartner(null)
    setPartnerForm(emptyPartnerForm)
    setPartnerDocFile(null)
    setPartnerMode('create')
  }

  function openEditPartner(p: Partner) {
    setSelectedPartner(p)
    setPartnerForm({
      name: p.name, phone: p.phone, address: p.address,
      address_detail: p.address_detail ?? '', zipcode: p.zipcode ?? '',
      business_number: p.business_number ?? '', business_type: p.business_type ?? '',
      business_category: p.business_category ?? '', representative: p.representative ?? '',
      email: p.email ?? '', note: p.note ?? '', business_doc_url: p.business_doc_url ?? '',
    })
    setPartnerDocFile(null)
    setPartnerMode('edit')
  }

  async function savePartner(e: React.FormEvent) {
    e.preventDefault()
    setPartnerSaving(true)
    try {
      // 파일이 있으면 먼저 업로드
      let docUrl = partnerForm.business_doc_url
      if (partnerDocFile) {
        const fd = new FormData()
        fd.append('file', partnerDocFile)
        fd.append('bucket', 'partner-docs')
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        if (!uploadRes.ok) { alert('파일 업로드 실패'); return }
        const uploadJson = await uploadRes.json()
        docUrl = uploadJson.url
      }

      const payload = { ...partnerForm, business_doc_url: docUrl || null }
      const isEdit = partnerMode === 'edit' && selectedPartner
      const url = isEdit ? `/api/admin/partners/${selectedPartner.id}` : '/api/admin/partners'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { alert((await res.json().catch(() => ({}))).error ?? '저장 실패'); return }
      await fetchPartners()
      setPartnerMode('list')
      alert(isEdit ? '수정되었습니다.' : '등록되었습니다.')
    } finally {
      setPartnerSaving(false)
    }
  }

  async function deletePartner(id: string) {
    if (!confirm('거래처를 삭제하시겠습니까?')) return
    const res = await fetch(`/api/admin/partners/${id}`, { method: 'DELETE' })
    if (!res.ok) { alert('삭제 실패'); return }
    await fetchPartners()
    if (selectedPartner?.id === id) setSelectedPartner(null)
    setPartnerMode('list')
  }

  // ── 로그아웃 ──
  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  const filtered = filterStatus === 'all' ? requests : requests.filter((r) => r.status === filterStatus)

  // 공통 입력 스타일
  const inputCls = 'border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400'

  return (
    <div className='max-w-6xl mx-auto px-4 sm:px-6 py-8'>
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900'>관리자 대시보드</h1>
          <p className='text-sm text-slate-500 mt-0.5'>
            AS {requests.length}건 · 신규구매 {purchases.length}건 · 거래처 {partners.length}곳
          </p>
        </div>
        <button
          onClick={handleLogout}
          className='px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors'
        >
          로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className='flex gap-2 mb-6 border-b border-slate-200'>
        {([
          { key: 'as',      label: `AS 접수 (${requests.length})`,    activeColor: 'border-blue-600 text-blue-600' },
          { key: 'purchase', label: `신규구매 (${purchases.length})`, activeColor: 'border-purple-600 text-purple-600' },
          { key: 'partner',  label: `거래처 (${partners.length})`,    activeColor: 'border-emerald-600 text-emerald-600' },
        ] as const).map(({ key, label, activeColor }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? activeColor : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── AS 접수 탭 ─── */}
      {tab === 'as' && (
        <>
          {/* 상태 필터 */}
          <div className='space-y-2 mb-6'>
            <div className='flex flex-wrap gap-2'>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                전체 ({requests.length})
              </button>
              {(['received', 'delivery_received', 'symptom_checked', 'quote_sent', 'payment_confirmed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {statusLabel[s]} ({requests.filter((r) => r.status === s).length})
                </button>
              ))}
            </div>
            <div className='flex flex-wrap gap-2'>
              {(['repairing', 'cancelled', 'completed', 'shipped'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {statusLabel[s]} ({requests.filter((r) => r.status === s).length})
                </button>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* 왼쪽: 접수 목록 */}
            <div className='space-y-3'>
              {loadingAs && <div className='text-center py-12 text-slate-400 text-sm'>불러오는 중...</div>}
              {!loadingAs && filtered.length === 0 && (
                <div className='text-center py-12 text-slate-400 text-sm'>해당 접수 내역이 없습니다.</div>
              )}
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selectRequest(item)}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${selected?.id === item.id ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-200'}`}
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div>
                      <p className='text-xs text-slate-400'>{new Date(item.created_at).toLocaleDateString('ko-KR')}</p>
                      <p className='font-semibold text-slate-900 text-sm'>{item.receipt_number}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[item.status]}`}>
                      {statusLabel[item.status]}
                    </span>
                  </div>
                  <div className='text-sm text-slate-600'>
                    <span className='font-medium'>{item.customer_name}</span>
                    {item.partner && <span className='text-emerald-600 ml-1.5 text-xs'>[{item.partner.name}]</span>}
                    <span className='text-slate-400 mx-1.5'>·</span>
                    <span>{item.product_name}</span>
                    {item.model_name && <span className='text-slate-400 ml-1'>({item.model_name})</span>}
                  </div>
                  <p className='text-xs text-slate-400 mt-1 truncate'>{item.symptom}</p>
                </div>
              ))}
            </div>

            {/* 오른쪽: 상세 + 상태 변경 + 결과 등록 */}
            <div>
              {!selected ? (
                <div className='bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm'>
                  왼쪽 목록에서 접수 건을 선택하세요
                </div>
              ) : (
                <div className='bg-white rounded-xl border border-slate-200 p-5 space-y-5 sticky top-24'>
                  <div>
                    <div className='flex items-center justify-between mb-3'>
                      <h2 className='font-bold text-slate-900'>{selected.receipt_number}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status]}`}>
                        {statusLabel[selected.status]}
                      </span>
                    </div>
                    <table className='w-full text-sm'>
                      <tbody>
                        <tr><td className='py-1 text-slate-400 w-20'>고객명</td><td className='py-1 font-medium'>{selected.customer_name}</td></tr>
                        <tr><td className='py-1 text-slate-400'>연락처</td><td className='py-1'>{selected.phone}</td></tr>
                        <tr><td className='py-1 text-slate-400'>이메일</td><td className='py-1'>{selected.email}</td></tr>

                        {/* 거래처 선택 (팝업) */}
                        <tr>
                          <td className='py-1 text-slate-400 align-middle'>거래처</td>
                          <td className='py-1'>
                            <div className='flex items-center gap-2'>
                              <span className={selected.partner ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                                {selected.partner?.name ?? '미지정'}
                              </span>
                              <button
                                onClick={() => { setPartnerPopupSearch(''); setShowPartnerPopup(true) }}
                                className='text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2'
                              >
                                검색
                              </button>
                            </div>
                          </td>
                        </tr>

                        <tr><td className='py-1 text-slate-400'>제품</td><td className='py-1'>{selected.product_name}</td></tr>

                        {/* S/N 인라인 편집 */}
                        <tr>
                          <td className='py-1 text-slate-400 align-middle'>S/N</td>
                          <td className='py-1'>
                            {editingSerial ? (
                              <div className='flex items-center gap-1.5'>
                                <input
                                  type='text'
                                  value={serialValue}
                                  onChange={(e) => setSerialValue(e.target.value)}
                                  className='h-7 border border-blue-400 rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 flex-1 min-w-0'
                                  autoFocus
                                  placeholder='시리얼번호'
                                />
                                <button
                                  onClick={saveSerial}
                                  disabled={serialSaving}
                                  className='px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs rounded transition-colors whitespace-nowrap'
                                >
                                  {serialSaving ? '저장중' : '저장'}
                                </button>
                                <button
                                  onClick={() => { setEditingSerial(false); setSerialValue(selected.model_name ?? '') }}
                                  className='px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded'
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <div className='flex items-center gap-2'>
                                <span className={selected.model_name ? '' : 'text-slate-400'}>{selected.model_name || '미입력'}</span>
                                <button
                                  onClick={() => { setEditingSerial(true); setSerialValue(selected.model_name ?? '') }}
                                  className='text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2'
                                >
                                  수정
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {selected.purchase_date && <tr><td className='py-1 text-slate-400'>구매일</td><td className='py-1'>{selected.purchase_date}</td></tr>}
                        <tr>
                          <td className='py-1 text-slate-400 align-top'>증상</td>
                          <td className='py-1 whitespace-pre-wrap'>{selected.symptom}</td>
                        </tr>
                        {selected.address && (
                          <tr>
                            <td className='py-1 text-slate-400 align-top'>반송주소</td>
                            <td className='py-1 text-xs'>{selected.zipcode && `[${selected.zipcode}] `}{selected.address}{selected.address_detail && ` ${selected.address_detail}`}</td>
                          </tr>
                        )}
                        {selected.photo_url && (
                          <tr>
                            <td className='py-1 text-slate-400'>사진</td>
                            <td className='py-1'>
                              <a href={selected.photo_url} target='_blank' rel='noopener noreferrer' className='text-blue-600 underline text-xs'>파일 보기</a>
                            </td>
                          </tr>
                        )}

                        {/* 택배정보 인라인 편집 */}
                        <tr>
                          <td className='py-1 text-slate-400 align-top pt-2'>택배정보</td>
                          <td className='py-1 pt-2'>
                            {editingShipping ? (
                              <div className='space-y-1.5'>
                                <input
                                  type='text'
                                  value={shippingForm.courier_company}
                                  onChange={(e) => setShippingForm((p) => ({ ...p, courier_company: e.target.value }))}
                                  placeholder='택배사 (예: CJ대한통운)'
                                  className='w-full h-7 border border-blue-400 rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300'
                                  autoFocus
                                />
                                <input
                                  type='text'
                                  value={shippingForm.tracking_number}
                                  onChange={(e) => setShippingForm((p) => ({ ...p, tracking_number: e.target.value }))}
                                  placeholder='송장번호'
                                  className='w-full h-7 border border-blue-400 rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300'
                                />
                                <div className='flex gap-1.5'>
                                  <button
                                    onClick={saveShipping}
                                    disabled={shippingSaving}
                                    className='px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs rounded transition-colors'
                                  >
                                    {shippingSaving ? '저장중' : '저장'}
                                  </button>
                                  <button
                                    onClick={() => { setEditingShipping(false); setShippingForm({ courier_company: selected.courier_company ?? '', tracking_number: selected.tracking_number ?? '' }) }}
                                    className='px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded'
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className='flex items-start gap-2'>
                                <div>
                                  {selected.courier_company || selected.tracking_number ? (
                                    <span className='text-slate-700 text-xs'>
                                      {selected.courier_company && <span>{selected.courier_company}</span>}
                                      {selected.courier_company && selected.tracking_number && <span className='text-slate-400 mx-1'>|</span>}
                                      {selected.tracking_number && <span>{selected.tracking_number}</span>}
                                    </span>
                                  ) : (
                                    <span className='text-slate-400 text-xs'>미입력</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => { setEditingShipping(true); setShippingForm({ courier_company: selected.courier_company ?? '', tracking_number: selected.tracking_number ?? '' }) }}
                                  className='text-xs text-blue-500 hover:text-blue-700 underline underline-offset-2 shrink-0'
                                >
                                  수정
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* 상태 이력 */}
                    {selected.as_status_history && selected.as_status_history.length > 0 && (
                      <div className='mt-3 pt-3 border-t border-slate-100'>
                        <p className='text-xs font-semibold text-slate-400 mb-1.5'>진행 이력</p>
                        <div className='space-y-0.5'>
                          {[...selected.as_status_history]
                            .sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime())
                            .map((h) => (
                              <p key={h.id} className='text-xs text-slate-500'>
                                {statusLabel[h.status]}: {new Date(h.changed_at).toLocaleDateString('ko-KR')}
                              </p>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 진행 상태 변경 */}
                  <div className='border-t border-slate-100 pt-4'>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>진행 상태 변경</p>
                    <div className='flex flex-wrap gap-2'>
                      {ALL_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(selected.id, s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            selected.status === s
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {statusLabel[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AS 결과 등록 */}
                  <form onSubmit={saveResult} className='border-t border-slate-100 pt-4 space-y-3'>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>AS 처리 결과</p>
                    <label className='flex flex-col gap-1'>
                      <span className='text-xs font-medium text-slate-600'>수리 내용</span>
                      <textarea
                        value={resultForm.repair_detail}
                        onChange={(e) => setResultForm((p) => ({ ...p, repair_detail: e.target.value }))}
                        rows={2}
                        placeholder='수리 내용을 입력하세요'
                        className='border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none'
                      />
                    </label>
                    <div className='grid grid-cols-2 gap-3'>
                      <label className='flex flex-col gap-1'>
                        <span className='text-xs font-medium text-slate-600'>수리 비용 (원)</span>
                        <input
                          type='number'
                          value={resultForm.cost}
                          onChange={(e) => setResultForm((p) => ({ ...p, cost: e.target.value }))}
                          placeholder='0'
                          className='border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400'
                        />
                      </label>
                      <label className='flex flex-col gap-1'>
                        <span className='text-xs font-medium text-slate-600'>완료일</span>
                        <input
                          type='date'
                          value={resultForm.completed_at}
                          onChange={(e) => setResultForm((p) => ({ ...p, completed_at: e.target.value }))}
                          className='border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400'
                        />
                      </label>
                    </div>
                    <label className='flex flex-col gap-1'>
                      <span className='text-xs font-medium text-slate-600'>비고</span>
                      <input
                        type='text'
                        value={resultForm.note}
                        onChange={(e) => setResultForm((p) => ({ ...p, note: e.target.value }))}
                        placeholder='추가 메모'
                        className='border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400'
                      />
                    </label>
                    <button
                      type='submit'
                      disabled={saving}
                      className='w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors text-sm'
                    >
                      {saving ? '저장 중...' : '결과 저장'}
                    </button>
                    {/* 삭제 버튼: 폼 제출이 아니라 별도 동작이므로 type='button' */}
                    <button
                      type='button'
                      onClick={() => deleteRequest(selected.id)}
                      className='w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm'
                    >
                      삭제
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── 신규구매 탭 ─── */}
      {tab === 'purchase' && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='space-y-3'>
            {loadingPurchase && <div className='text-center py-12 text-slate-400 text-sm'>불러오는 중...</div>}
            {!loadingPurchase && purchases.length === 0 && (
              <div className='text-center py-12 text-slate-400 text-sm'>신규구매 접수 내역이 없습니다.</div>
            )}
            {purchases.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedPurchase(item)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${selectedPurchase?.id === item.id ? 'border-purple-400 ring-1 ring-purple-200' : 'border-slate-200'}`}
              >
                <div className='flex items-start justify-between mb-2'>
                  <div>
                    <p className='text-xs text-slate-400'>{new Date(item.created_at).toLocaleDateString('ko-KR')}</p>
                    <p className='font-semibold text-slate-900 text-sm'>{item.customer_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${purchaseColor[item.status]}`}>
                    {purchaseStatusLabel[item.status] ?? item.status}
                  </span>
                </div>
                <div className='text-sm text-slate-600'>
                  <span>{item.product_name}</span>
                  <span className='text-slate-400 mx-1.5'>·</span>
                  <span>{item.quantity}개</span>
                </div>
                <p className='text-xs text-slate-400 mt-1'>{item.phone}</p>
              </div>
            ))}
          </div>

          <div>
            {!selectedPurchase ? (
              <div className='bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm'>
                왼쪽 목록에서 항목을 선택하세요
              </div>
            ) : (
              <div className='bg-white rounded-xl border border-slate-200 p-5 space-y-4 sticky top-24'>
                <div className='flex items-center justify-between'>
                  <h2 className='font-bold text-slate-900'>신규구매 상세</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${purchaseColor[selectedPurchase.status]}`}>
                    {purchaseStatusLabel[selectedPurchase.status]}
                  </span>
                </div>
                <table className='w-full text-sm'>
                  <tbody>
                    <tr><td className='py-1 text-slate-400 w-20'>고객명</td><td className='py-1 font-medium'>{selectedPurchase.customer_name}</td></tr>
                    <tr><td className='py-1 text-slate-400'>연락처</td><td className='py-1'>{selectedPurchase.phone}</td></tr>
                    <tr><td className='py-1 text-slate-400'>이메일</td><td className='py-1'>{selectedPurchase.email}</td></tr>
                    <tr><td className='py-1 text-slate-400'>제품</td><td className='py-1'>{selectedPurchase.product_name}</td></tr>
                    <tr><td className='py-1 text-slate-400'>수량</td><td className='py-1'>{selectedPurchase.quantity}개</td></tr>
                    <tr><td className='py-1 text-slate-400'>접수일</td><td className='py-1'>{new Date(selectedPurchase.created_at).toLocaleDateString('ko-KR')}</td></tr>
                    {selectedPurchase.address && (
                      <tr><td className='py-1 text-slate-400 align-top'>배송주소</td><td className='py-1'>{selectedPurchase.zipcode && `[${selectedPurchase.zipcode}] `}{selectedPurchase.address}{selectedPurchase.address_detail && ` ${selectedPurchase.address_detail}`}</td></tr>
                    )}
                    {selectedPurchase.inquiry && (
                      <tr><td className='py-1 text-slate-400 align-top'>문의내용</td><td className='py-1 whitespace-pre-wrap'>{selectedPurchase.inquiry}</td></tr>
                    )}
                    {selectedPurchase.business_doc_url && (
                      <tr><td className='py-1 text-slate-400'>사업자등록증</td><td className='py-1'><a href={selectedPurchase.business_doc_url} target='_blank' rel='noopener noreferrer' className='text-purple-600 underline text-xs'>파일 보기</a></td></tr>
                    )}
                  </tbody>
                </table>
                <div className='border-t border-slate-100 pt-4 mt-4'>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>진행 상태 변경</p>
                  <div className='flex flex-wrap gap-2'>
                    {ALL_PURCHASE_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => updatePurchaseStatus(selectedPurchase.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          selectedPurchase.status === s
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {purchaseStatusLabel[s]}
                      </button>
                    ))}
                  </div>
                  {selectedPurchase.purchase_status_history && selectedPurchase.purchase_status_history.length > 0 && (
                    <div className='mt-3 space-y-1'>
                      {[...selectedPurchase.purchase_status_history]
                        .sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime())
                        .map((h) => (
                          <p key={h.id} className='text-xs text-slate-400'>
                            {purchaseStatusLabel[h.status]}: {new Date(h.changed_at).toLocaleDateString('ko-KR')}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
                <div className='border-t border-slate-100 pt-4 mt-1'>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2'>입금 계좌</p>
                  <p className='text-xs text-slate-600'>{BANK_INFO.bank} {BANK_INFO.account} ({BANK_INFO.holder})</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 거래처 관리 탭 ─── */}
      {tab === 'partner' && (
        <div>
          {partnerMode === 'list' && (
            <>
              <div className='flex flex-col sm:flex-row gap-3 mb-4'>
                {/* 검색창 */}
                <div className='relative flex-1'>
                  <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                  <input
                    type='text'
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder='거래처명, 연락처, 사업자번호로 검색'
                    className='w-full h-9 pl-9 pr-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400'
                  />
                </div>
                <button
                  onClick={openCreatePartner}
                  className='px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap'
                >
                  + 거래처 등록
                </button>
              </div>

              {loadingPartner && <div className='text-center py-12 text-slate-400 text-sm'>불러오는 중...</div>}
              {!loadingPartner && partners.length === 0 && (
                <div className='text-center py-12 text-slate-400 text-sm'>등록된 거래처가 없습니다.</div>
              )}
              {/* 검색 필터 적용 */}
              {(() => {
                const q = partnerSearch.trim().toLowerCase()
                const filtered = q
                  ? partners.filter((p) =>
                      p.name.toLowerCase().includes(q) ||
                      p.phone.includes(q) ||
                      (p.business_number ?? '').includes(q) ||
                      (p.representative ?? '').toLowerCase().includes(q)
                    )
                  : partners
                if (!loadingPartner && q && filtered.length === 0) {
                  return <p className='text-center py-8 text-slate-400 text-sm'>&lsquo;{partnerSearch}&rsquo;에 대한 결과가 없습니다.</p>
                }
                return (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {filtered.map((p) => (
                  <div key={p.id} className='bg-white rounded-xl border border-slate-200 p-4'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <p className='font-semibold text-slate-900'>{p.name}</p>
                        <p className='text-sm text-slate-500'>{p.phone}</p>
                      </div>
                      <div className='flex gap-2'>
                        <button
                          onClick={() => openEditPartner(p)}
                          className='text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2'
                        >
                          수정
                        </button>
                        <button
                          onClick={() => deletePartner(p.id)}
                          className='text-xs text-red-500 hover:text-red-700 underline underline-offset-2'
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <p className='text-xs text-slate-400'>{p.address}{p.address_detail && ` ${p.address_detail}`}</p>
                    {p.business_number && <p className='text-xs text-slate-400 mt-0.5'>사업자: {p.business_number}</p>}
                    {(p.business_type || p.business_category) && (
                      <p className='text-xs text-slate-400 mt-0.5'>{p.business_type}{p.business_type && p.business_category && ' / '}{p.business_category}</p>
                    )}
                    {p.business_doc_url && (
                      <a href={p.business_doc_url} target='_blank' rel='noopener noreferrer' className='text-xs text-emerald-600 underline underline-offset-2 mt-1 inline-block'>
                        사업자등록증 보기
                      </a>
                    )}
                  </div>
                ))}
              </div>
                )
              })()}
            </>
          )}

          {(partnerMode === 'create' || partnerMode === 'edit') && (
            <div className='max-w-xl'>
              <div className='flex items-center gap-3 mb-5'>
                <button
                  onClick={() => setPartnerMode('list')}
                  className='text-sm text-slate-500 hover:text-slate-700'
                >
                  ← 목록
                </button>
                <h2 className='font-bold text-slate-900'>
                  {partnerMode === 'create' ? '거래처 등록' : '거래처 수정'}
                </h2>
              </div>

              <form onSubmit={savePartner} className='space-y-4'>
                {/* 필수 정보 */}
                <div className='bg-white rounded-xl border border-slate-200 p-4 space-y-3'>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>필수 정보</p>
                  <label className='flex flex-col gap-1'>
                    <span className='text-sm font-medium text-slate-700'>거래처명 *</span>
                    <input
                      type='text'
                      required
                      value={partnerForm.name}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder='(주)에이아이시스템'
                      className={inputCls}
                    />
                  </label>
                  <label className='flex flex-col gap-1'>
                    <span className='text-sm font-medium text-slate-700'>연락처 *</span>
                    <input
                      type='text'
                      required
                      value={partnerForm.phone}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder='02-0000-0000'
                      className={inputCls}
                    />
                  </label>
                  <label className='flex flex-col gap-1'>
                    <span className='text-sm font-medium text-slate-700'>주소 *</span>
                    <input
                      type='text'
                      required
                      value={partnerForm.address}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder='서울시 강남구 ...'
                      className={inputCls}
                    />
                  </label>
                  <div className='grid grid-cols-2 gap-3'>
                    <label className='flex flex-col gap-1'>
                      <span className='text-sm font-medium text-slate-700'>상세주소</span>
                      <input
                        type='text'
                        value={partnerForm.address_detail}
                        onChange={(e) => setPartnerForm((p) => ({ ...p, address_detail: e.target.value }))}
                        placeholder='101동 202호'
                        className={inputCls}
                      />
                    </label>
                    <label className='flex flex-col gap-1'>
                      <span className='text-sm font-medium text-slate-700'>우편번호</span>
                      <input
                        type='text'
                        value={partnerForm.zipcode}
                        onChange={(e) => setPartnerForm((p) => ({ ...p, zipcode: e.target.value }))}
                        placeholder='12345'
                        className={inputCls}
                      />
                    </label>
                  </div>
                </div>

                {/* 선택 정보 */}
                <div className='bg-white rounded-xl border border-slate-200 p-4 space-y-3'>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>사업자 정보 (선택)</p>
                  <div className='grid grid-cols-2 gap-3'>
                    <label className='flex flex-col gap-1'>
                      <span className='text-sm font-medium text-slate-700'>사업자등록번호</span>
                      <input
                        type='text'
                        value={partnerForm.business_number}
                        onChange={(e) => setPartnerForm((p) => ({ ...p, business_number: e.target.value }))}
                        placeholder='000-00-00000'
                        className={inputCls}
                      />
                    </label>
                    <label className='flex flex-col gap-1'>
                      <span className='text-sm font-medium text-slate-700'>대표자명</span>
                      <input
                        type='text'
                        value={partnerForm.representative}
                        onChange={(e) => setPartnerForm((p) => ({ ...p, representative: e.target.value }))}
                        placeholder='홍길동'
                        className={inputCls}
                      />
                    </label>
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <label className='flex flex-col gap-1'>
                      <span className='text-sm font-medium text-slate-700'>업태</span>
                      <input
                        type='text'
                        value={partnerForm.business_type}
                        onChange={(e) => setPartnerForm((p) => ({ ...p, business_type: e.target.value }))}
                        placeholder='제조업'
                        className={inputCls}
                      />
                    </label>
                    <label className='flex flex-col gap-1'>
                      <span className='text-sm font-medium text-slate-700'>업종</span>
                      <input
                        type='text'
                        value={partnerForm.business_category}
                        onChange={(e) => setPartnerForm((p) => ({ ...p, business_category: e.target.value }))}
                        placeholder='전자부품'
                        className={inputCls}
                      />
                    </label>
                  </div>
                  <label className='flex flex-col gap-1'>
                    <span className='text-sm font-medium text-slate-700'>이메일</span>
                    <input
                      type='email'
                      value={partnerForm.email}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder='partner@example.com'
                      className={inputCls}
                    />
                  </label>
                  <label className='flex flex-col gap-1'>
                    <span className='text-sm font-medium text-slate-700'>메모</span>
                    <textarea
                      value={partnerForm.note}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, note: e.target.value }))}
                      rows={2}
                      placeholder='거래 조건, 담당자 정보 등'
                      className={`${inputCls} resize-none`}
                    />
                  </label>
                </div>

                {/* 사업자등록증 */}
                <div className='bg-white rounded-xl border border-slate-200 p-4 space-y-3'>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>사업자등록증 (선택)</p>
                  <label className='flex flex-col gap-1'>
                    <span className='text-sm font-medium text-slate-700'>파일 첨부</span>
                    <input
                      type='file'
                      accept='image/*,.pdf'
                      onChange={(e) => setPartnerDocFile(e.target.files?.[0] ?? null)}
                      className='text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100'
                    />
                    {partnerForm.business_doc_url && !partnerDocFile && (
                      <a href={partnerForm.business_doc_url} target='_blank' rel='noopener noreferrer' className='text-xs text-emerald-600 underline underline-offset-2'>
                        현재 첨부 파일 보기
                      </a>
                    )}
                  </label>
                </div>

                <div className='flex gap-3'>
                  <button
                    type='submit'
                    disabled={partnerSaving}
                    className='flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-xl transition-colors text-sm'
                  >
                    {partnerSaving ? '저장 중...' : partnerMode === 'create' ? '등록' : '수정 완료'}
                  </button>
                  {partnerMode === 'edit' && selectedPartner && (
                    <button
                      type='button'
                      onClick={() => deletePartner(selectedPartner.id)}
                      className='px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors text-sm border border-red-200'
                    >
                      삭제
                    </button>
                  )}
                  <button
                    type='button'
                    onClick={() => setPartnerMode('list')}
                    className='px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors text-sm'
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ─── 거래처 검색 팝업 ─── */}
      {showPartnerPopup && (
        <div
          className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
          onClick={() => setShowPartnerPopup(false)}
        >
          <div
            className='bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 */}
            <div className='p-4 border-b border-slate-200'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='font-semibold text-slate-900 text-base'>거래처 선택</h3>
                <button
                  onClick={() => setShowPartnerPopup(false)}
                  className='w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-lg leading-none'
                >
                  ✕
                </button>
              </div>
              <div className='relative'>
                <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
                <input
                  type='text'
                  value={partnerPopupSearch}
                  onChange={(e) => setPartnerPopupSearch(e.target.value)}
                  placeholder='거래처명, 연락처, 사업자번호로 검색'
                  className='w-full h-9 pl-9 pr-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
                  autoFocus
                />
              </div>
            </div>

            {/* 팝업 목록 */}
            <div className='overflow-y-auto flex-1'>
              {/* 선택 안함 */}
              <button
                onClick={() => selectPartnerFromPopup(null)}
                disabled={partnerPopupSaving}
                className='w-full px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-50 border-b border-slate-100 transition-colors disabled:opacity-50'
              >
                선택 안함 (연결 해제)
              </button>

              {(() => {
                const q = partnerPopupSearch.trim().toLowerCase()
                const list = q
                  ? partners.filter((p) =>
                      p.name.toLowerCase().includes(q) ||
                      p.phone.includes(q) ||
                      (p.business_number ?? '').includes(q) ||
                      (p.representative ?? '').toLowerCase().includes(q)
                    )
                  : partners

                if (list.length === 0) {
                  return (
                    <p className='text-center py-10 text-slate-400 text-sm'>
                      {q ? `'${partnerPopupSearch}'에 대한 결과가 없습니다` : '등록된 거래처가 없습니다'}
                    </p>
                  )
                }

                return list.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPartnerFromPopup(p)}
                    disabled={partnerPopupSaving}
                    className={`w-full px-4 py-3 text-left border-b border-slate-100 hover:bg-blue-50 transition-colors disabled:opacity-50 ${
                      selected?.partner_id === p.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-slate-900 text-sm'>{p.name}</p>
                        <p className='text-xs text-slate-400 mt-0.5'>
                          {p.phone}
                          {p.address && <span className='ml-1.5'>· {p.address}</span>}
                        </p>
                        {p.business_number && (
                          <p className='text-xs text-slate-400'>사업자: {p.business_number}</p>
                        )}
                      </div>
                      {selected?.partner_id === p.id && (
                        <span className='text-xs text-blue-600 font-medium shrink-0 ml-2'>현재 선택</span>
                      )}
                    </div>
                  </button>
                ))
              })()}
            </div>

            {partnerPopupSaving && (
              <div className='p-3 border-t border-slate-100 text-center text-xs text-slate-400'>저장 중...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
