'use client'

import { useState, useRef, useCallback } from 'react'

interface FileDropzoneProps {
  accept?: string          // 허용 파일 타입 (예: 'image/*' 또는 'image/*,.pdf')
  label?: string           // 라벨 텍스트
  hint?: string            // 힌트 텍스트
  maxSizeMB?: number       // 최대 파일 크기 (MB)
  accentColor?: 'blue' | 'purple'
  value: File | null
  onChange: (file: File | null) => void
}

export default function FileDropzone({
  accept = 'image/*',
  label = '파일 첨부',
  hint = '이미지 파일 · 최대 10MB',
  maxSizeMB = 10,
  accentColor = 'blue',
  value,
  onChange,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const accent = {
    blue: {
      border: 'border-blue-400 bg-blue-50',
      text: 'text-blue-600',
      button: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    },
    purple: {
      border: 'border-purple-400 bg-purple-50',
      text: 'text-purple-600',
      button: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    },
  }[accentColor]

  // 파일 유효성 검사 및 등록
  const processFile = useCallback((file: File) => {
    setError(null)

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`파일 크기가 ${maxSizeMB}MB를 초과합니다.`)
      return
    }

    onChange(file)
  }, [maxSizeMB, onChange])

  // 드래그 이벤트
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  // 일반 파일 선택
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // 파일 제거
  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className='flex flex-col gap-1.5'>
      <span className='text-sm font-medium text-slate-700'>{label}</span>
      <p className='text-xs text-slate-400'>{hint}</p>

      {/* 드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !value && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all duration-150
          ${value ? 'cursor-default' : 'cursor-pointer'}
          ${dragging ? `${accent.border} scale-[1.01]` : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'}
        `}
      >
        {/* 드래그 중 오버레이 */}
        {dragging && (
          <div className={`absolute inset-0 rounded-xl flex items-center justify-center ${accent.border} border-2`}>
            <p className={`text-sm font-semibold ${accent.text}`}>여기에 파일을 놓으세요</p>
          </div>
        )}

        {value ? (
          /* 파일이 선택된 상태 */
          <div className='flex items-center gap-3 w-full'>
            <div className='flex-1 flex items-center gap-2 min-w-0'>
              <span className='text-2xl'>
                {value.type.startsWith('image/') ? '🖼️' : '📄'}
              </span>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-slate-800 truncate'>{value.name}</p>
                <p className='text-xs text-slate-400'>
                  {(value.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={handleRemove}
              className='flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-500 flex items-center justify-center text-sm transition-colors'
            >
              ✕
            </button>
          </div>
        ) : (
          /* 빈 상태 */
          <>
            <div className='text-3xl text-slate-300'>📎</div>
            <div className='text-center'>
              <p className='text-sm text-slate-500'>
                파일을 드래그하거나{' '}
                <span className={`font-semibold ${accent.text}`}>클릭하여 선택</span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* 숨겨진 파일 input */}
      <input
        ref={inputRef}
        type='file'
        accept={accept}
        onChange={handleInputChange}
        className='hidden'
      />

      {/* 오류 메시지 */}
      {error && <p className='text-xs text-red-500'>{error}</p>}
    </div>
  )
}
